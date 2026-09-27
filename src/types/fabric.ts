/**
 * EXECUTION FABRIC — Core Types & Contracts
 * Based on Version 2.0 Production System Design
 */

export type ProviderId = 'gmi' | 'aws' | 'gcp' | 'azure' | 'static';

export type OptimizationStrategy = 'fastest' | 'cheapest' | 'balanced';

export interface ComputeRequirements {
  gpuModel: string;
  minVramGB: number;
  region: string;
  architecture: 'amd64' | 'arm64';
  minRamGB: number;
  minDiskGB: number;
  spotAllowed: boolean;
  strategy: OptimizationStrategy;
}

export interface ComputeOffer {
  id: string;
  provider: ProviderId;
  providerName: string;
  sku: string;
  gpuModel: string;
  gpuCount: number;
  vramGB: number;
  region: string;
  ramGB: number;
  diskGB: number;
  pricePerHour: number;
  spot: boolean;
  estStartupSec: number;
  warmAvailable: boolean;
  opaqueRef: string;
  score?: number;
  latencyScore?: number;
  costScore?: number;
  localityScore?: number;
}

export interface BootstrapSpec {
  agentDownloadUrl: string;
  agentSha256: string;
  agentSignature: string;
  registrationUrl: string;
  oneTimeRegistrationToken: string;
  gatewayUrl: string;
  protocolMin: string;
  protocolMax: string;
  workspaceId: string;
  tenantId: string;
  nodeLeaseId: string;
  generation: number;
}

export interface NodeCapabilities {
  cpuCores: number;
  ramGB: number;
  diskGB: number;
  arch: 'amd64' | 'arm64';
  gpuCount: number;
  gpuModel: string;
  vramGB: number;
  driverVersion: string;
  cudaVersion: string;
  cudaCapability: string;
  osRelease: string;
  kernelVersion: string;
}

export interface NodeLease {
  leaseId: string;
  nodeId: string;
  generation: number; // fencing token
  expiresAt: string;
  capabilities: NodeCapabilities;
  provider: {
    id: ProviderId;
    name: string;
    sku: string;
    region: string;
    instanceId: string;
  };
  cost: {
    hourlyRate: number;
    currency: string;
    accumulatedUSD: number;
  };
  status: 'PROVISIONING' | 'BOOTSTRAPPING' | 'ATTACHED' | 'RELEASING' | 'RELEASED' | 'LOST';
}

export interface ProviderStatus {
  providerId: ProviderId;
  name: string;
  connected: boolean;
  authValid: boolean;
  permsValid: boolean;
  quotaValid: boolean;
  regionAvailable: boolean;
  quotaDetails: string;
  authIdentity: string;
  message: string;
  lastChecked: string;
  onboardingType: 'api_key' | 'sts_assume_role' | 'wif_oidc' | 'entra_wif' | 'pairing_token';
  externalId?: string;
  roleArn?: string;
  gmiEntitlement?: boolean;
}

export interface EnvironmentSpec {
  specId: string;
  detectionSource: 'devcontainer' | 'dockerfile' | 'pyproject_uv' | 'requirements' | 'conda';
  baseImage: string;
  baseImageDigest: string;
  pythonVersion: string;
  cudaRequirement: string;
  devcontainerFeatures: string[];
  systemPackages: string[];
  dependencyLockfile: string;
  reproducibility: 'fully_pinned' | 'partially_pinned' | 'warning';
  reproducibilityScore: number;
  reproducibilityNotes: string[];
}

export interface EnvironmentArtifact {
  specId: string;
  imageDigest: string;
  platform: 'linux/amd64' | 'linux/arm64';
  sbomDigest: string;
  signature: string;
  provenance: string;
  builtAt: string;
  buildTimeSec: number;
  cacheLayer: 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
  scanResult: {
    vulnerabilitiesCritical: number;
    vulnerabilitiesHigh: number;
    secretsDetected: number;
    policyPassed: boolean;
  };
}

export type ReadinessCheckId = 
  | 'cloud_lease'
  | 'storage_mount'
  | 'container_digest'
  | 'network_tunnel'
  | 'jupyter_api'
  | 'python_kernel'
  | 'project_imports'
  | 'nvidia_driver'
  | 'cuda_tensor_exec'
  | 'port_proxy'
  | 'checkpoint_path';

export interface ReadinessCheck {
  id: ReadinessCheckId;
  label: string;
  category: 'core' | 'runtime' | 'gpu' | 'services';
  status: 'idle' | 'running' | 'passed' | 'failed';
  evidence?: string;
  latencyMs?: number;
  error?: string;
}

export interface DetachedJob {
  id: string;
  name: string;
  command: string;
  pid: number;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startedAt: string;
  durationSec: number;
  currentEpoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  vramUsedGB: number;
  logs: string[];
}

export interface NotebookCell {
  id: string;
  cellType: 'code' | 'markdown';
  source: string;
  outputs?: {
    outputType: 'stream' | 'execute_result' | 'display_data' | 'error';
    text?: string[];
    data?: Record<string, string>;
  }[];
  executionCount: number | null;
  status: 'idle' | 'running' | 'success' | 'error';
  runtimeMs?: number;
}

export interface RepositoryFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  language?: 'python' | 'json' | 'toml' | 'markdown' | 'dockerfile';
  content?: string;
  cells?: NotebookCell[];
  children?: RepositoryFile[];
}

export interface GpuTelemetry {
  model: string;
  vramTotalGB: number;
  vramUsedGB: number;
  gpuUtilPercent: number;
  memoryUtilPercent: number;
  temperatureC: number;
  powerWatts: number;
  maxPowerWatts: number;
  fanSpeedPercent: number;
  pciBusId: string;
  tensorCoreTflops: number;
  tensorOpsExecuted: number;
}

export interface PortForward {
  port: number;
  name: string;
  protocol: 'http' | 'websocket' | 'tcp';
  authenticatedUrl: string;
  isPublic: boolean;
  status: 'listening' | 'closed';
}

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  createdAt: string;
  sizeMB: number;
  type: 'local_block_volume' | 'portable_restic_encrypted';
  status: 'healthy' | 'archived';
  sha256: string;
}

export interface TraceEvent {
  id: string;
  timestamp: string;
  source: 'broker' | 'agent' | 'gateway' | 'scheduler' | 'reconciler' | 'builder' | 'jupyter';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: Record<string, unknown>;
}

export interface ChaosSettings {
  blockUdpTransport: boolean;      // force TLS/WSS fallback
  simulateAmbiguousCreate: boolean; // timeout after create -> idempotent lookup
  quotaExceededError: boolean;     // typed QUOTA_EXCEEDED
  missingGmiEntitlement: boolean;  // typed ENTITLEMENT_MISSING
  simulateKernelCrash: boolean;    // kill kernel process
  simulateSpotEviction: boolean;   // spot preemption notice
  simulateBrowserDisconnect: boolean; // disconnect client WebSocket
}
