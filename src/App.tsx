/**
 * EXECUTION FABRIC
 * Production SOTA Multi-Cloud Cloud IDE & Universal Execution Core
 * Quiet, dark, grayscale-dominant theme with single restrained accent
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
import { ActivityBar } from './components/navigation/ActivityBar';
import { StatusBar } from './components/navigation/StatusBar';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { ComputeSelector } from './components/compute/ComputeSelector';
import { EnvironmentPanel } from './components/environment/EnvironmentPanel';
import { ProviderManager } from './components/providers/ProviderManager';
import { VerificationTestbed } from './components/verification/VerificationTestbed';
import { ArchitectureViewer } from './components/architecture/ArchitectureViewer';
import { LaunchModal } from './components/workspace/LaunchModal';

export default function App() {
  const [activeView, setActiveView] = useState<'workspace' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec'>('workspace');

  // Layout Panels Visibility
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // Core State
  const [files] = useState<RepositoryFile[]>([...mockRepositoryFiles]);
  const [lease, setLease] = useState<NodeLease | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('offer-gmi-h200');
  const [telemetry, setTelemetry] = useState<GpuTelemetry>({ ...defaultGpuTelemetry });
  const [readinessChecks, setReadinessChecks] = useState<ReadinessCheck[]>([...initialReadinessChecks]);
  
  // Pipeline & Telemetry Events
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

  // Initial Auto-Launch simulation on startup so user lands in ready state
  useEffect(() => {
    executeLaunchPipeline(false);
  }, []);

  // Periodic GPU telemetry variation (calm, real-looking)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const utilDelta = (Math.random() - 0.5) * 4;
        const tempDelta = (Math.random() - 0.5) * 0.8;
        const powerDelta = (Math.random() - 0.5) * 12;

        return {
          ...prev,
          gpuUtilPercent: Math.min(100, Math.max(15, Math.round(prev.gpuUtilPercent + utilDelta))),
          temperatureC: Math.min(85, Math.max(40, Math.round(prev.temperatureC + tempDelta))),
          powerWatts: Math.min(700, Math.max(220, Math.round(prev.powerWatts + powerDelta))),
        };
      });
    }, 3000);

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

  const isReadinessReady = readinessChecks.every(c => c.status === 'passed') && !isLaunching;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e] text-[#cccccc] font-sans antialiased">
      {/* 1. Editor Title Bar (35px) */}
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        lease={lease}
        readinessReady={isReadinessReady}
        onLaunchClick={() => executeLaunchPipeline(true)}
        isLaunching={isLaunching}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showBottomPanel={showBottomPanel}
        onToggleBottomPanel={() => setShowBottomPanel(!showBottomPanel)}
        showInspector={showInspector}
        onToggleInspector={() => setShowInspector(!showInspector)}
      />

      {/* 2. Main Body: Activity Bar + Active Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar (48px) */}
        <ActivityBar
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'workspace' && (
            <WorkspaceLayout
              files={files}
              lease={lease}
              telemetry={telemetry}
              readinessChecks={readinessChecks}
              onReverifyReadiness={() => executeLaunchPipeline(true)}
              isVerifying={isLaunching}
              onExecuteTerminalCommand={() => {}}
              showSidebar={showSidebar}
              showBottomPanel={showBottomPanel}
              showInspector={showInspector}
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
      </div>

      {/* 3. Status Bar (22px) */}
      <StatusBar
        lease={lease}
        readinessReady={isReadinessReady}
        onOpenTerminal={() => {
          setActiveView('workspace');
          setShowBottomPanel(true);
        }}
        onOpenReadiness={() => {
          setActiveView('workspace');
          setShowInspector(true);
        }}
        onOpenCompute={() => setActiveView('compute')}
      />

      {/* 4. Launch & Readiness Verification Modal Dialog */}
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
