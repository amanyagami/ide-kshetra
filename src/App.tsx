/**
 * EXECUTION FABRIC
 * SOTA-Oriented, Open-Source-First Cloud IDE & Multi-Cloud Compute Fabric
 * Version 2.0 Production System Design
 */

import React, { useState, useEffect } from 'react';
import { 
  NodeLease, 
  ComputeOffer, 
  BootstrapSpec, 
  GpuTelemetry, 
  ReadinessCheck, 
  TraceEvent, 
  ChaosSettings,
  RepositoryFile
} from './types/fabric';
import { mockRepositoryFiles } from './data/mockRepository';
import { defaultGpuTelemetry } from './data/cloudProviders';
import { computeBroker } from './services/computeBroker';
import { environmentCompiler } from './services/environmentCompiler';
import { initialReadinessChecks, runReadinessVerification } from './services/readinessVerifier';

import { TopBar } from './components/navigation/TopBar';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { ComputeSelector } from './components/compute/ComputeSelector';
import { EnvironmentPanel } from './components/environment/EnvironmentPanel';
import { ProviderManager } from './components/providers/ProviderManager';
import { VerificationTestbed } from './components/verification/VerificationTestbed';
import { ArchitectureViewer } from './components/architecture/ArchitectureViewer';
import { LaunchModal } from './components/workspace/LaunchModal';

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<'workspace' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec'>('workspace');

  // Core Execution Fabric State
  const [files] = useState<RepositoryFile[]>([...mockRepositoryFiles]);
  const [lease, setLease] = useState<NodeLease | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('offer-gmi-h200');
  const [telemetry, setTelemetry] = useState<GpuTelemetry>({ ...defaultGpuTelemetry });
  const [readinessChecks, setReadinessChecks] = useState<ReadinessCheck[]>([...initialReadinessChecks]);
  
  // Pipeline & Trace Events
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState<boolean>(false);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Chaos & Fault Simulation
  const [chaos, setChaos] = useState<ChaosSettings>({
    blockUdpTransport: false,
    simulateAmbiguousCreate: false,
    quotaExceededError: false,
    missingGmiEntitlement: false,
    simulateKernelCrash: false,
    simulateSpotEviction: false,
    simulateBrowserDisconnect: false,
  });

  // Environment Compiler Data
  const envSpec = environmentCompiler.detectAndCompileEnvironment(
    files.map(f => f.path)
  );
  const envArtifact = environmentCompiler.buildAndSignArtifact(envSpec);

  // Initial Auto-Launch simulation on startup so user lands directly in verified state
  useEffect(() => {
    executeLaunchPipeline(false);
  }, []);

  // Telemetry fluctuation simulator (shows live hardware activity)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const utilDelta = (Math.random() - 0.5) * 6;
        const tempDelta = (Math.random() - 0.5) * 1.5;
        const powerDelta = (Math.random() - 0.5) * 20;

        return {
          ...prev,
          gpuUtilPercent: Math.min(100, Math.max(12, Math.round(prev.gpuUtilPercent + utilDelta))),
          temperatureC: Math.min(85, Math.max(38, Math.round(prev.temperatureC + tempDelta))),
          powerWatts: Math.min(700, Math.max(180, Math.round(prev.powerWatts + powerDelta))),
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const executeLaunchPipeline = async (showModal = true) => {
    setIsLaunching(true);
    setLaunchError(null);
    if (showModal) setIsLaunchModalOpen(true);

    const bootstrapSpec: BootstrapSpec = {
      agentDownloadUrl: 'https://release.fabric.internal/agent/v2.4.1/fabric-agent-linux-amd64',
      agentSha256: '4f89d311cb7a8b92ef88019aa1275d4097e6e5a593e2b3c7aa864980deef2951',
      agentSignature: 'cosign:v2:sig-789a2b1f8e',
      registrationUrl: 'https://control.fabric.internal/api/v1/register',
      oneTimeRegistrationToken: 'reg_token_' + Math.random().toString(36).substring(2, 10),
      gatewayUrl: 'quic://gateway.fabric.internal:443',
      protocolMin: 'v2.0',
      protocolMax: 'v2.4',
      workspaceId: 'ws-gemma-core-99',
      tenantId: 'tenant-noahlabs-ai',
      nodeLeaseId: 'pending',
      generation: 1001,
    };

    const requestId = `req-${Date.now().toString(36)}`;

    try {
      // 1. Acquire Compute from Part B Broker
      const acquiredLease = await computeBroker.acquireCompute(
        requestId,
        selectedOfferId,
        bootstrapSpec,
        chaos,
        (evt) => setTraceEvents(prev => [evt, ...prev.slice(0, 40)])
      );

      setLease(acquiredLease);

      // 2. Run Truthful All-Ready Verification Gate
      await runReadinessVerification((checkId, status, evidence, latencyMs) => {
        setReadinessChecks(prev =>
          prev.map(c => (c.id === checkId ? { ...c, status, evidence, latencyMs } : c))
        );
      });

      setIsLaunching(false);
    } catch (err: any) {
      setLaunchError(err.message || 'Pipeline failed');
      setIsLaunching(false);
    }
  };

  const handleSelectOfferAndLaunch = (offer: ComputeOffer) => {
    setSelectedOfferId(offer.id);
    setActiveView('workspace');
    executeLaunchPipeline(true);
  };

  const avatarUrl = '/src/assets/images/avatar_engineer_1790479540008.jpg';
  const gpuImageThumbnail = '/src/assets/images/gpu_accelerator_chip_1790479549433.jpg';
  const isReadinessReady = readinessChecks.every(c => c.status === 'passed') && !isLaunching;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        lease={lease}
        readinessReady={isReadinessReady}
        onLaunchClick={() => executeLaunchPipeline(true)}
        isLaunching={isLaunching}
        avatarUrl={avatarUrl}
      />

      {/* 2. Main Viewport Router */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'workspace' && (
          <WorkspaceLayout
            files={files}
            lease={lease}
            telemetry={telemetry}
            readinessChecks={readinessChecks}
            onReverifyReadiness={() => executeLaunchPipeline(true)}
            isVerifying={isLaunching}
            gpuImageThumbnail={gpuImageThumbnail}
            onExecuteTerminalCommand={(cmd) => {
              // Terminal dispatch callback
            }}
          />
        )}

        {activeView === 'compute' && (
          <ComputeSelector
            onSelectAndLaunch={handleSelectOfferAndLaunch}
            selectedOfferId={selectedOfferId}
          />
        )}

        {activeView === 'environment' && (
          <EnvironmentPanel
            spec={envSpec}
            artifact={envArtifact}
          />
        )}

        {activeView === 'providers' && (
          <ProviderManager />
        )}

        {activeView === 'verification' && (
          <VerificationTestbed
            chaos={chaos}
            onUpdateChaos={setChaos}
          />
        )}

        {activeView === 'spec' && (
          <ArchitectureViewer />
        )}
      </main>

      {/* 3. Real-Time Launch & Readiness Verification Modal */}
      <LaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        isLaunching={isLaunching}
        events={traceEvents}
        readinessChecks={readinessChecks}
        error={launchError}
        onLaunch={() => executeLaunchPipeline(true)}
        onReadyComplete={() => {
          setIsLaunchModalOpen(false);
          setActiveView('workspace');
        }}
      />
    </div>
  );
}
