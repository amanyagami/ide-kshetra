import { 
  ComputeOffer, 
  ComputeRequirements, 
  NodeLease, 
  ProviderStatus, 
  BootstrapSpec,
  ChaosSettings,
  TraceEvent,
} from '../types/fabric';
import { initialComputeOffers, initialProviderStatuses } from '../data/cloudProviders';

export class ComputeBrokerService {
  private offers: ComputeOffer[] = [...initialComputeOffers];
  private providerStatuses: Record<string, ProviderStatus> = { ...initialProviderStatuses };
  private activeLeases: Map<string, NodeLease> = new Map();
  private idempotencyStore: Map<string, NodeLease> = new Map();
  private generationCounter = 1000;

  // Rank and schedule offers according to two-stage scheduling
  public listOffers(requirements: ComputeRequirements): ComputeOffer[] {
    // Stage 1: Hard constraint filtering
    const eligible = this.offers.filter(offer => {
      if (offer.vramGB < requirements.minVramGB) return false;
      if (!requirements.spotAllowed && offer.spot) return false;
      if (requirements.region !== 'any' && !offer.region.startsWith(requirements.region)) return false;
      return true;
    });

    // Stage 2: Soft ranking
    return eligible.map(offer => {
      // Calculate scores (0 - 100)
      const costScore = Math.max(0, 100 - (offer.pricePerHour / 5.0) * 100);
      const latencyScore = Math.max(0, 100 - (offer.estStartupSec / 60.0) * 100 + (offer.warmAvailable ? 20 : 0));
      const localityScore = offer.provider === 'gmi' || offer.provider === 'static' ? 95 : 80;

      let totalScore = 0;
      if (requirements.strategy === 'fastest') {
        totalScore = latencyScore * 0.6 + costScore * 0.2 + localityScore * 0.2;
      } else if (requirements.strategy === 'cheapest') {
        totalScore = costScore * 0.7 + latencyScore * 0.15 + localityScore * 0.15;
      } else {
        // Balanced
        totalScore = costScore * 0.4 + latencyScore * 0.4 + localityScore * 0.2;
      }

      return {
        ...offer,
        score: Math.round(totalScore),
        latencyScore: Math.round(latencyScore),
        costScore: Math.round(costScore),
        localityScore: Math.round(localityScore),
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // Acquire compute with idempotency, generation fencing, and failure modeling
  public async acquireCompute(
    requestId: string,
    offerId: string,
    bootstrap: BootstrapSpec,
    chaos: ChaosSettings,
    onProgress?: (event: TraceEvent) => void
  ): Promise<NodeLease> {
    const emit = (source: TraceEvent['source'], level: TraceEvent['level'], message: string, details?: Record<string, unknown>) => {
      if (onProgress) {
        onProgress({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          source,
          level,
          message,
          details,
        });
      }
    };

    // Invariant I3: Idempotent request matching
    if (this.idempotencyStore.has(requestId)) {
      emit('broker', 'info', `Idempotent request detected for request_id=${requestId}. Returning existing leased resource.`);
      return this.idempotencyStore.get(requestId)!;
    }

    const offer = this.offers.find(o => o.id === offerId) || this.offers[0];

    // Chaos simulation check: Quota exceeded
    if (chaos.quotaExceededError) {
      emit('scheduler', 'error', `Compute acquisition rejected by provider: QUOTA_EXCEEDED. SKU ${offer.sku} in ${offer.region} exceeds tenant quota.`, {
        errorType: 'QUOTA_EXCEEDED',
        quotaDetails: this.providerStatuses[offer.provider]?.quotaDetails,
      });
      throw new Error(`QUOTA_EXCEEDED: Cannot provision ${offer.sku}. Regional quota limit reached in ${offer.region}. Request quota increase in provider console.`);
    }

    // Chaos simulation check: Missing GMI entitlement
    if (chaos.missingGmiEntitlement && offer.provider === 'gmi') {
      emit('broker', 'error', 'GMI Cloud container entitlement verification failed: ENTITLEMENT_MISSING. Organization does not have container permissions enabled.', {
        errorType: 'ENTITLEMENT_MISSING',
      });
      throw new Error(`ENTITLEMENT_MISSING: GMI Cloud account lacks container service entitlement. Verify organization billing settings.`);
    }

    emit('broker', 'info', `AcquireCompute initiated: request_id=${requestId}, provider=${offer.providerName}, SKU=${offer.sku}`);

    // Step 1: Validate connection
    emit('broker', 'info', `Step 1/5: Validating provider connection & IAM credentials for ${offer.providerName}...`);
    await new Promise(r => setTimeout(r, 200));

    // Step 2: Idempotent tag creation
    emit('scheduler', 'info', `Step 2/5: Allocating hardware instance with idempotency tag 'fabric-req-${requestId.slice(0, 8)}' in ${offer.region}...`);
    await new Promise(r => setTimeout(r, 350));

    // Chaos simulation: Ambiguous create timeout
    if (chaos.simulateAmbiguousCreate) {
      emit('broker', 'warn', `Ambiguous create API timeout encountered from ${offer.providerName}. Invariant I3: querying provider by client token 'fabric-req-${requestId.slice(0, 8)}' before retrying...`);
      await new Promise(r => setTimeout(r, 300));
      emit('broker', 'info', `Discovered existing resource matching request_id tag. Adopting resource without creating duplicate billing instance.`);
    }

    // Step 3: Inject signed bootstrap specification
    emit('agent', 'info', `Step 3/5: Injecting signed BootstrapSpec (SHA256: ${bootstrap.agentSha256.slice(0, 12)}...) into node environment...`);
    await new Promise(r => setTimeout(r, 300));

    // Step 4: Transport fallback check
    if (chaos.blockUdpTransport) {
      emit('gateway', 'warn', `QUIC/HTTP3 UDP probe blocked on port 443 by network firewall. Invariant: automatically falling back to HTTPS/WebSocket transport on TCP :443...`);
      await new Promise(r => setTimeout(r, 200));
      emit('gateway', 'success', `Transport fallback successful: established multiplexed TLS/WSS session on TCP :443.`);
    } else {
      emit('gateway', 'success', `Primary transport established: multiplexed QUIC/HTTP3 session on UDP :443 with mTLS.`);
    }

    // Step 5: Wait for RegistrationSink handshake
    emit('agent', 'info', `Step 4/5: Waiting for Fabric Agent bootstrap registration handshake...`);
    await new Promise(r => setTimeout(r, 350));

    // Generate Lease with generation fencing token
    this.generationCounter += 1;
    const leaseId = `lease-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nodeId = `node-${offer.provider}-${Math.random().toString(36).substring(2, 8)}`;

    const lease: NodeLease = {
      leaseId,
      nodeId,
      generation: this.generationCounter,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      provider: {
        id: offer.provider,
        name: offer.providerName,
        sku: offer.sku,
        region: offer.region,
        instanceId: `inst-${Math.random().toString(36).substring(2, 10)}`,
      },
      cost: {
        hourlyRate: offer.pricePerHour,
        currency: 'USD',
        accumulatedUSD: 0.12,
      },
      capabilities: {
        cpuCores: offer.provider === 'gmi' ? 32 : 16,
        ramGB: offer.ramGB,
        diskGB: offer.diskGB,
        arch: 'amd64',
        gpuCount: offer.gpuCount,
        gpuModel: offer.gpuModel,
        vramGB: offer.vramGB,
        driverVersion: '550.54.14',
        cudaVersion: '12.4',
        cudaCapability: offer.vramGB >= 140 ? 'sm_90' : 'sm_89',
        osRelease: 'Ubuntu 22.04.4 LTS (GNU/Linux 6.5.0-generic)',
        kernelVersion: '6.5.0-35-generic',
      },
      status: 'ATTACHED',
    };

    this.activeLeases.set(leaseId, lease);
    this.idempotencyStore.set(requestId, lease);

    emit('broker', 'success', `Step 5/5: NodeLease issued! Attached node ${nodeId} under lease_id=${leaseId} (Generation: ${lease.generation}). Handing off to Part A Universal Execution Core.`);

    return lease;
  }

  // Release compute safely with fencing validation
  public async releaseCompute(leaseId: string, generation: number): Promise<boolean> {
    const lease = this.activeLeases.get(leaseId);
    if (!lease) {
      // Invariant I3: Idempotent release
      return true;
    }

    // Invariant I4: Fencing token check
    if (lease.generation !== generation) {
      throw new Error(`FENCING_ERROR: Stale generation token ${generation} rejected. Current lease generation is ${lease.generation}.`);
    }

    lease.status = 'RELEASING';
    await new Promise(r => setTimeout(r, 200));
    lease.status = 'RELEASED';
    this.activeLeases.delete(leaseId);
    return true;
  }

  // Validate provider connection health
  public validateProvider(providerId: string): ProviderStatus {
    const status = this.providerStatuses[providerId];
    if (!status) {
      throw new Error(`Unknown provider ${providerId}`);
    }
    return {
      ...status,
      lastChecked: 'Just now',
    };
  }

  // Global reconciler: repairs drift and detects orphan resources (Section 8.4)
  public reconcileFleet(): {
    reconciledCount: number;
    orphansFound: number;
    activeLeasesCount: number;
    driftRepaired: boolean;
  } {
    return {
      reconciledCount: this.activeLeases.size,
      orphansFound: 0,
      activeLeasesCount: this.activeLeases.size,
      driftRepaired: true,
    };
  }
}

export const computeBroker = new ComputeBrokerService();
