/**
 * EXECUTION FABRIC (Kshetra)
 * Production SOTA Multi-Cloud Cloud IDE & Universal Execution Core
 * Integrated GitHub App + Google Cloud Platform Existing VM Connectors
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
  RepositoryFile,
  UserSession,
  GcpProject,
  GcpVmInstance,
  GitHubRepo,
  WorkspaceBinding,
  DataMode
} from './types/fabric';
import { mockRepositoryFiles } from './data/mockRepository';
import { defaultGpuTelemetry } from './data/cloudProviders';
import { computeBroker } from './services/computeBroker';
import { environmentCompiler } from './services/environmentCompiler';
import { initialReadinessChecks, runReadinessVerification } from './services/readinessVerifier';
import { cloudService } from './services/cloudService';

import { TopBar } from './components/navigation/TopBar';
import { ActivityBar } from './components/navigation/ActivityBar';
import { StatusBar } from './components/navigation/StatusBar';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { GcpVmExplorer } from './components/cloud/GcpVmExplorer';
import { ComputeSelector } from './components/compute/ComputeSelector';
import { EnvironmentPanel } from './components/environment/EnvironmentPanel';
import { ProviderManager } from './components/providers/ProviderManager';
import { VerificationTestbed } from './components/verification/VerificationTestbed';
import { ArchitectureViewer } from './components/architecture/ArchitectureViewer';
import { LaunchModal } from './components/workspace/LaunchModal';
import { AuthModal } from './components/auth/AuthModal';
import { WorkspaceBindingModal } from './components/cloud/WorkspaceBindingModal';

export default function App() {
  const [activeView, setActiveView] = useState<'workspace' | 'gcp' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec'>('workspace');

  // Layout Panels Visibility
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // Data mode: reported by the server (KSHETRA_DATA_MODE). Starts as 'mock'
  // (the safe default) until /api/config resolves on mount.
  const [dataMode, setDataMode] = useState<DataMode>('mock');

  // User Session & Real-Time Cloud Connections.
  // Starts unauthenticated; loadCloudData() below populates it from the real
  // /api/session response for both modes (mock mode's server still returns
  // its demo fixture session; live mode returns a real/unauthenticated one).
  const [session, setSession] = useState<UserSession>({
    isAuthenticated: false,
    user: null,
    connections: {
      github: { connected: false, authorizedReposCount: 0 },
      gcp: { connected: false, discoveredProjectsCount: 0, discoveredVmsCount: 0 },
    },
  });

  // Cloud VMs & Projects
  const [gcpProjects, setGcpProjects] = useState<GcpProject[]>([]);
  const [activeGcpProjectId, setActiveGcpProjectId] = useState<string>('noahlabs-ai-prod');
  const [gcpVms, setGcpVms] = useState<GcpVmInstance[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [activeWorkspaces, setActiveWorkspaces] = useState<WorkspaceBinding[]>([]);

  // Modals Visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isBindingModalOpen, setIsBindingModalOpen] = useState<boolean>(false);
  const [bindingDefaultVm, setBindingDefaultVm] = useState<string | undefined>(undefined);

  // Core IDE State
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

  // Initial Fetch of Data Mode, Session, GCP Projects, VMs, Repos
  useEffect(() => {
    (async () => {
      try {
        const cfg = await cloudService.getConfig();
        setDataMode(cfg.dataMode);
        await loadCloudData();
        // The simulated broker/readiness pipeline below is demo-only theater
        // (fake timers, fabricated evidence). Never auto-run it in live mode.
        if (cfg.dataMode === 'mock') {
          executeLaunchPipeline(false);
        }
      } catch (err) {
        console.warn('[Kshetra] Failed to load /api/config, defaulting to mock:', err);
        await loadCloudData();
        executeLaunchPipeline(false);
      }
    })();
  }, []);

  const loadCloudData = async () => {
    try {
      const sess = await cloudService.getSession();
      setSession(sess);

      const projData = await cloudService.getGcpProjects();
      setGcpProjects(projData.projects);
      setActiveGcpProjectId(projData.activeProjectId);

      const vmsData = await cloudService.getGcpVms(projData.activeProjectId);
      setGcpVms(vmsData);

      const reposData = await cloudService.getGitHubRepos();
      setGithubRepos(reposData);

      const wsData = await cloudService.getWorkspaces();
      setActiveWorkspaces(wsData);
    } catch (err) {
      console.warn('[Kshetra] Backend data fetch error (using fallback defaults):', err);
    }
  };

  const handleSelectGcpProject = async (projectId: string) => {
    setActiveGcpProjectId(projectId);
    try {
      const vmsData = await cloudService.getGcpVms(projectId);
      setGcpVms(vmsData);
    } catch (err) {
      console.error('Failed to load project VMs:', err);
    }
  };

  const handleRefreshVms = async () => {
    try {
      const vmsData = await cloudService.getGcpVms(activeGcpProjectId);
      setGcpVms(vmsData);
    } catch (err) {
      console.error('Failed to refresh VMs:', err);
    }
  };

  const handleLogin = async (email: string, name?: string, organization?: string) => {
    const updatedSess = await cloudService.login(email, name, organization);
    setSession(updatedSess);
    await loadCloudData();
  };

  const handleLogout = async () => {
    await cloudService.logout();
    setSession({
      isAuthenticated: false,
      user: null,
      connections: {
        github: { connected: false, authorizedReposCount: 0 },
        gcp: { connected: false, discoveredProjectsCount: 0, discoveredVmsCount: 0 },
      },
    });
  };

  const handleOpenWorkspaceOnVm = (vm: GcpVmInstance) => {
    setBindingDefaultVm(vm.name);
    setIsBindingModalOpen(true);
  };

  const handleConfirmBinding = async (repoFullName: string, branch: string, vm: GcpVmInstance) => {
    // 1. Create Workspace Binding on backend
    const binding = await cloudService.createWorkspace(
      repoFullName,
      branch,
      vm.name,
      vm.projectId,
      vm.zone
    );

    // 2. Open workspace & execute readiness verification
    await cloudService.openWorkspace(binding.id);

    // 3. Update lease & telemetry to match the selected VM
    setLease({
      leaseId: `lease-gcp-${vm.name}`,
      nodeId: `node-${vm.id}`,
      generation: 1002,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      provider: {
        id: 'gcp',
        name: 'Google Cloud Platform',
        sku: vm.machineType,
        region: vm.zone,
        instanceId: vm.id,
      },
      cost: {
        hourlyRate: vm.costPerHour,
        currency: 'USD',
        accumulatedUSD: 0.28,
      },
      capabilities: {
        cpuCores: vm.cpuCores,
        ramGB: vm.ramGB,
        diskGB: vm.bootDiskGB,
        arch: 'amd64',
        gpuCount: vm.gpu?.count || 0,
        gpuModel: vm.gpu?.model || 'CPU',
        vramGB: vm.gpu?.vramTotalGB || 0,
        driverVersion: '550.54.14',
        cudaVersion: '12.4',
        cudaCapability: 'sm_90',
        osRelease: vm.osImage,
        kernelVersion: '6.5.0-35-generic',
      },
      status: 'ATTACHED',
    });

    if (vm.gpu) {
      setTelemetry({
        model: `${vm.gpu.count}x ${vm.gpu.model}`,
        vramTotalGB: vm.gpu.vramTotalGB,
        vramUsedGB: Math.round(vm.gpu.vramTotalGB * 0.08),
        gpuUtilPercent: 24,
        memoryUtilPercent: 8,
        temperatureC: 42,
        powerWatts: 340,
        maxPowerWatts: 700 * vm.gpu.count,
        fanSpeedPercent: 40,
        pciBusId: '0000:0F:00.0',
        tensorCoreTflops: 964.8,
        tensorOpsExecuted: 12000,
      });
    }

    // 4. Verify All-Ready
    await executeLaunchPipeline(true);
    setActiveView('workspace');
  };

  // Periodic GPU telemetry variation (calm, real-looking) — demo-only fabrication.
  useEffect(() => {
    if (dataMode !== 'mock') return;
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const utilDelta = (Math.random() - 0.5) * 4;
        const tempDelta = (Math.random() - 0.5) * 0.8;
        const powerDelta = (Math.random() - 0.5) * 12;

        return {
          ...prev,
          gpuUtilPercent: Math.min(100, Math.max(15, Math.round(prev.gpuUtilPercent + utilDelta))),
          temperatureC: Math.min(85, Math.max(40, Math.round(prev.temperatureC + tempDelta))),
          powerWatts: Math.min(prev.maxPowerWatts, Math.max(180, Math.round(prev.powerWatts + powerDelta))),
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [dataMode]);

  const executeLaunchPipeline = async (showModal = true) => {
    if (dataMode !== 'mock') {
      // The broker/readiness pipeline below is 100% fabricated (fake timers,
      // hardcoded "passed" evidence). Never run it in live mode — that's
      // exactly the fake-success failure the data-mode gate exists to prevent.
      setLaunchError('Live execution runtime is not implemented yet (see the phased build plan, Phases 4-6). No workspace can be opened in live mode until a real GCP VM bootstrap + Jupyter path lands.');
      return;
    }
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
      workspaceId: 'ws-ide-kshetra-01',
      tenantId: 'tenant-noahlabs-ai',
      nodeLeaseId: 'lease-gcp-h100',
      generation: 1002,
    };

    const requestId = `req-${Date.now().toString(36)}`;

    try {
      // 1. Acquire Compute from Broker or GCP Target
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
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenBindingModal={() => {
          setBindingDefaultVm(undefined);
          setIsBindingModalOpen(true);
        }}
        session={session}
      />

      {/* 2. Main Body: Activity Bar + Active Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar (48px) */}
        <ActivityBar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isAuthenticated={session.isAuthenticated}
          userEmail={session.user?.email}
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

          {activeView === 'gcp' && (
            <GcpVmExplorer
              projects={gcpProjects}
              activeProjectId={activeGcpProjectId}
              onSelectProject={handleSelectGcpProject}
              vms={gcpVms}
              onRefreshVms={handleRefreshVms}
              onOpenWorkspaceOnVm={handleOpenWorkspaceOnVm}
            />
          )}

          {activeView === 'compute' && (
            <ComputeSelector
              onSelectAndLaunch={(offer) => {
                setSelectedOfferId(offer.id);
                setActiveView('workspace');
                executeLaunchPipeline(true);
              }}
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
        dataMode={dataMode}
        readinessReady={isReadinessReady}
        onOpenTerminal={() => {
          setActiveView('workspace');
          setShowBottomPanel(true);
        }}
        onOpenReadiness={() => {
          setActiveView('workspace');
          setShowInspector(true);
        }}
        onOpenCompute={() => setActiveView('gcp')}
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

      {/* 5. User Authentication & Cloud Session Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        session={session}
        dataMode={dataMode}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* 6. Workspace Binding Wizard Modal (RepositorySelection + ComputeTarget) */}
      <WorkspaceBindingModal
        isOpen={isBindingModalOpen}
        onClose={() => setIsBindingModalOpen(false)}
        repos={githubRepos}
        vms={gcpVms}
        defaultVmName={bindingDefaultVm}
        onConfirmBinding={handleConfirmBinding}
      />
    </div>
  );
}
