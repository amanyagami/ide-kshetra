import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  RotateCw, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  ArrowRight,
  HardDrive,
  Lock,
  Zap,
  Activity,
  Plus,
  Search,
  Filter,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Send
} from 'lucide-react';
import { GcpProject, GcpVmInstance, WorkspaceBinding } from '../../types/fabric';
import { cloudService } from '../../services/cloudService';
import { CreateVmModal } from './CreateVmModal';

interface GcpVmExplorerProps {
  projects: GcpProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  vms: GcpVmInstance[];
  onRefreshVms: () => Promise<void>;
  onOpenWorkspaceOnVm: (vm: GcpVmInstance) => void;
}

export const GcpVmExplorer: React.FC<GcpVmExplorerProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  vms,
  onRefreshVms,
  onOpenWorkspaceOnVm,
}) => {
  const [selectedVm, setSelectedVm] = useState<GcpVmInstance | null>(vms[0] || null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'telemetry' | 'terminal' | 'preflight'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'gpu'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Operations state
  const [isPreflighting, setIsPreflighting] = useState<boolean>(false);
  const [isConnectingAgent, setIsConnectingAgent] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [preflightResult, setPreflightResult] = useState<GcpVmInstance['preflight'] | null>(
    vms[0]?.preflight || null
  );

  // Terminal state for selected VM
  const [terminalCommand, setTerminalCommand] = useState<string>('nvidia-smi');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: 'gcloud compute ssh --tunnel-through-iap',
      output: `Connected to Google Cloud Compute Engine via Identity-Aware Proxy (IAP) TCP tunnel.
Authenticated as authorized POSIX identity.
Linux gcp-h100-trainer-01 6.5.0-35-generic #35~22.04.1-Ubuntu SMP x86_64
NVIDIA H100 80GB SXM5 (Driver: 550.54.14, CUDA: 12.4)`
    }
  ]);
  const [isExecutingCommand, setIsExecutingCommand] = useState<boolean>(false);

  // Live telemetry state for selected VM
  const [vmTelemetry, setVmTelemetry] = useState<any>(null);
  const [isTelemetryLoading, setIsTelemetryLoading] = useState<boolean>(false);

  // Keep selectedVm in sync when vms prop updates
  useEffect(() => {
    if (selectedVm) {
      const updated = vms.find(v => v.name === selectedVm.name && v.projectId === selectedVm.projectId);
      if (updated) setSelectedVm(updated);
    } else if (vms.length > 0) {
      setSelectedVm(vms[0]);
    }
  }, [vms]);

  // Fetch telemetry when switching VM or opening telemetry tab
  useEffect(() => {
    if (selectedVm && selectedVm.status === 'RUNNING' && (inspectorTab === 'telemetry' || inspectorTab === 'overview')) {
      fetchVmTelemetry(selectedVm);
    }
  }, [selectedVm?.name, inspectorTab]);

  const fetchVmTelemetry = async (vm: GcpVmInstance) => {
    setIsTelemetryLoading(true);
    try {
      const data = await cloudService.getVmTelemetry(vm.projectId, vm.zone, vm.name);
      setVmTelemetry(data);
    } catch (err) {
      console.warn('Failed to load telemetry for VM:', err);
    } finally {
      setIsTelemetryLoading(false);
    }
  };

  const handleSelectVm = (vm: GcpVmInstance) => {
    setSelectedVm(vm);
    setPreflightResult(vm.preflight || null);
    if (vm.status === 'RUNNING') {
      fetchVmTelemetry(vm);
    }
  };

  const handleRunPreflight = async (vm: GcpVmInstance) => {
    setIsPreflighting(true);
    try {
      const res = await cloudService.runVmPreflight(vm.projectId, vm.zone, vm.name);
      setPreflightResult(res);
      await onRefreshVms();
    } finally {
      setIsPreflighting(false);
    }
  };

  const handleConnectAgent = async (vm: GcpVmInstance) => {
    setIsConnectingAgent(true);
    try {
      await cloudService.connectVmAgent(vm.projectId, vm.zone, vm.name);
      await onRefreshVms();
    } finally {
      setIsConnectingAgent(false);
    }
  };

  const handleVmAction = async (vm: GcpVmInstance, action: 'start' | 'stop' | 'reset') => {
    setActionLoading(`${vm.name}-${action}`);
    try {
      await cloudService.executeVmAction(vm.projectId, vm.zone, vm.name, action);
      await onRefreshVms();
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecuteTerminalCommand = async (cmdToRun?: string) => {
    if (!selectedVm || selectedVm.status !== 'RUNNING') return;
    const cmd = cmdToRun || terminalCommand;
    if (!cmd.trim()) return;

    setIsExecutingCommand(true);
    try {
      const res = await cloudService.executeVmCommand(selectedVm.projectId, selectedVm.zone, selectedVm.name, cmd);
      setTerminalHistory(prev => [
        ...prev,
        { cmd, output: res.stdout || res.stderr || 'Command executed with no output' }
      ]);
      setTerminalCommand('');
    } catch (err: any) {
      setTerminalHistory(prev => [
        ...prev,
        { cmd, output: `Error: ${err.message || 'Execution failed'}` }
      ]);
    } finally {
      setIsExecutingCommand(false);
    }
  };

  const handleNewVmCreated = (newVm: GcpVmInstance) => {
    setSelectedVm(newVm);
    onRefreshVms();
  };

  // Fleet Calculations
  const runningVms = vms.filter(v => v.status === 'RUNNING');
  const runningCount = runningVms.length;
  const totalGpus = runningVms.reduce((acc, v) => acc + (v.gpu?.count || 0), 0);
  const totalVramGB = runningVms.reduce((acc, v) => acc + (v.gpu?.vramTotalGB || 0), 0);
  const totalCpus = runningVms.reduce((acc, v) => acc + v.cpuCores, 0);
  const totalRamGB = runningVms.reduce((acc, v) => acc + v.ramGB, 0);
  const totalHourlyBurn = runningVms.reduce((acc, v) => acc + v.costPerHour, 0);

  // Filtered List
  const filteredVms = vms.filter(vm => {
    if (statusFilter === 'running' && vm.status !== 'RUNNING') return false;
    if (statusFilter === 'stopped' && vm.status === 'RUNNING') return false;
    if (statusFilter === 'gpu' && !vm.gpu) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        vm.name.toLowerCase().includes(q) ||
        vm.zone.toLowerCase().includes(q) ||
        (vm.gpu?.model && vm.gpu.model.toLowerCase().includes(q)) ||
        vm.internalIp.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181818] overflow-hidden text-[#cccccc] text-[12px] select-none font-sans">
      {/* Top Header & Actions Strip */}
      <div className="h-[40px] px-3.5 border-b border-[#282828] bg-[#141414] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Cloud className="w-4 h-4 text-[#0078d4]" />
          <span className="font-semibold text-white text-[13px]">
            Google Cloud Platform — Compute Engine Fleet
          </span>
          <span className="text-[#444444]">|</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4ec9b0]">
            <span className="w-2 h-2 rounded-full bg-[#4ec9b0] animate-pulse" />
            <span>{runningCount} RUNNING INSTANCES</span>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#666666] font-mono">Project:</span>
          <select
            value={activeProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="h-[26px] px-2 bg-[#1c1c1c] border border-[#2e2e2e] text-[#ffffff] font-mono text-[11px] outline-none rounded-sm"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-[26px] px-2.5 bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Provision a new Compute Engine VM"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision VM</span>
          </button>

          <button
            onClick={onRefreshVms}
            className="p-1.5 hover:text-white text-[#777777] bg-[#1c1c1c] border border-[#2e2e2e] rounded-sm transition-colors"
            title="Refresh instances from GCP"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fleet Overview KPI Banner (Top-level metrics bar) */}
      <div className="h-[48px] px-4 border-b border-[#242424] bg-[#161616] flex items-center justify-between shrink-0 text-[11px] font-mono">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#666666] uppercase text-[10px]">Fleet Status:</span>
            <span className="text-white font-bold">{runningCount} Active / {vms.length} Total</span>
          </div>

          <div className="h-4 w-px bg-[#262626]" />

          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#cca700]" />
            <span className="text-[#666666] uppercase text-[10px]">Active GPUs:</span>
            <span className="text-[#cca700] font-bold">{totalGpus} GPUs ({totalVramGB} GB VRAM)</span>
          </div>

          <div className="h-4 w-px bg-[#262626]" />

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#4ec9b0]" />
            <span className="text-[#666666] uppercase text-[10px]">Silicon Density:</span>
            <span className="text-[#cccccc]">{totalCpus} vCPUs · {totalRamGB} GB RAM</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#666666] uppercase text-[10px]">Active Fleet Burn:</span>
          <span className="text-[#4ec9b0] font-bold">${totalHourlyBurn.toFixed(2)}/h</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="h-[36px] px-3.5 border-b border-[#242424] bg-[#141414] flex items-center justify-between shrink-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-0.5 rounded-sm border transition-colors ${
              statusFilter === 'all'
                ? 'border-[#0078d4] bg-[#1a2530] text-white'
                : 'border-[#282828] bg-[#181818] text-[#888888] hover:text-[#cccccc]'
            }`}
          >
            All ({vms.length})
          </button>
          <button
            onClick={() => setStatusFilter('running')}
            className={`px-2 py-0.5 rounded-sm border transition-colors ${
              statusFilter === 'running'
                ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]'
                : 'border-[#282828] bg-[#181818] text-[#888888] hover:text-[#cccccc]'
            }`}
          >
            Running ({runningCount})
          </button>
          <button
            onClick={() => setStatusFilter('stopped')}
            className={`px-2 py-0.5 rounded-sm border transition-colors ${
              statusFilter === 'stopped'
                ? 'border-[#444444] bg-[#222222] text-[#cccccc]'
                : 'border-[#282828] bg-[#181818] text-[#888888] hover:text-[#cccccc]'
            }`}
          >
            Stopped ({vms.length - runningCount})
          </button>
          <button
            onClick={() => setStatusFilter('gpu')}
            className={`px-2 py-0.5 rounded-sm border transition-colors ${
              statusFilter === 'gpu'
                ? 'border-[#cca700] bg-[#2d2716] text-[#cca700]'
                : 'border-[#282828] bg-[#181818] text-[#888888] hover:text-[#cccccc]'
            }`}
          >
            GPU Nodes ({vms.filter(v => !!v.gpu).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center bg-[#1c1c1c] border border-[#2b2b2b] px-2 h-[24px] w-64">
          <Search className="w-3 h-3 text-[#555555] mr-1.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VM name, zone, GPU..."
            className="w-full bg-transparent text-[#ffffff] font-mono text-[10px] outline-none"
          />
        </div>
      </div>

      {/* Main Split Body: VM Table (Left) + Detailed Inspector (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: VM Table List */}
        <div className="flex-1 flex flex-col border-r border-[#282828] overflow-y-auto bg-[#181818]">
          {/* Table Column Headers */}
          <div className="h-[28px] px-3 bg-[#141414] border-b border-[#242424] flex items-center text-[10px] font-mono text-[#666666] uppercase tracking-wider shrink-0">
            <span className="w-48">Instance Name</span>
            <span className="w-24">Status</span>
            <span className="w-32">Zone</span>
            <span className="w-52">GPU Accelerator</span>
            <span className="w-28">Machine Type</span>
            <span className="w-28">Internal IP (IAP)</span>
            <span className="w-20 text-right">Rate</span>
            <span className="w-24 text-right">Agent</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#222222]">
            {filteredVms.map(vm => {
              const isSelected = selectedVm?.name === vm.name && selectedVm?.projectId === vm.projectId;
              const isRunning = vm.status === 'RUNNING';
              const isActioning = actionLoading?.startsWith(vm.name);

              return (
                <div
                  key={`${vm.projectId}-${vm.name}`}
                  onClick={() => handleSelectVm(vm)}
                  className={`h-[42px] px-3 flex items-center cursor-pointer transition-colors text-[11px] font-mono ${
                    isSelected 
                      ? 'bg-[#222222] text-white' 
                      : 'hover:bg-[#1a1a1a] text-[#a0a0a0]'
                  }`}
                >
                  {/* Name */}
                  <div className="w-48 flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isRunning ? 'bg-[#4ec9b0]' : 'bg-[#666666]'
                    }`} />
                    <span className="font-semibold text-white truncate">{vm.name}</span>
                  </div>

                  {/* Status */}
                  <div className="w-24">
                    <span className={`text-[10px] px-1.5 py-0.5 border ${
                      isRunning
                        ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]'
                        : 'border-[#333333] bg-[#181818] text-[#777777]'
                    }`}>
                      {isActioning ? 'UPDATING...' : vm.status}
                    </span>
                  </div>

                  {/* Zone */}
                  <div className="w-32 text-[#858585] truncate">{vm.zone}</div>

                  {/* GPU Accelerator */}
                  <div className="w-52 truncate">
                    {vm.gpu ? (
                      <span className="text-[#cca700] font-medium">
                        {vm.gpu.count}x {vm.gpu.model.replace('NVIDIA ', '')}
                      </span>
                    ) : (
                      <span className="text-[#555555]">CPU instance</span>
                    )}
                  </div>

                  {/* Machine Type */}
                  <div className="w-28 text-[#858585] truncate">{vm.machineType}</div>

                  {/* Internal IP */}
                  <div className="w-28 text-[#858585]">
                    <span>{vm.internalIp}</span>
                    {vm.isPrivateOnly && (
                      <span className="text-[9px] text-[#555555] block">IAP tunnel</span>
                    )}
                  </div>

                  {/* Hourly Rate */}
                  <div className="w-20 text-right text-[#4ec9b0] font-mono">
                    ${vm.costPerHour.toFixed(2)}/h
                  </div>

                  {/* Agent Status */}
                  <div className="w-24 text-right">
                    <span className={`text-[10px] ${
                      vm.agentStatus === 'CONNECTED' 
                        ? 'text-[#4ec9b0]' 
                        : vm.agentStatus === 'BOOTSTRAPPING'
                        ? 'text-[#0078d4] animate-pulse'
                        : 'text-[#666666]'
                    }`}>
                      {vm.agentStatus === 'CONNECTED' ? 'Agent OK' : vm.agentStatus}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredVms.length === 0 && (
              <div className="p-8 text-center text-[#666666] font-mono text-[11px]">
                No instances match the current filter or search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected VM Detail, Telemetry & Operations Pane */}
        {selectedVm && (
          <div className="w-[380px] bg-[#161616] flex flex-col h-full border-l border-[#242424] overflow-hidden shrink-0 font-mono text-[11px]">
            {/* VM Header Bar */}
            <div className="p-3.5 border-b border-[#242424] bg-[#141414] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-[13px] truncate">
                  {selectedVm.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 border ${
                  selectedVm.status === 'RUNNING'
                    ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]'
                    : 'border-[#333333] text-[#777777]'
                }`}>
                  {selectedVm.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#777777] text-[10px]">
                <span>{selectedVm.projectId} · {selectedVm.zone}</span>
                <span className="text-[#4ec9b0] font-semibold">${selectedVm.costPerHour.toFixed(2)}/h</span>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="h-[30px] bg-[#121212] border-b border-[#242424] flex items-center text-[10px] shrink-0 px-2 gap-1">
              <button
                onClick={() => setInspectorTab('overview')}
                className={`px-2.5 h-[24px] rounded-sm transition-colors ${
                  inspectorTab === 'overview'
                    ? 'bg-[#1e1e1e] text-white font-medium border border-[#333333]'
                    : 'text-[#777777] hover:text-[#cccccc]'
                }`}
              >
                Overview & Control
              </button>
              <button
                onClick={() => setInspectorTab('telemetry')}
                className={`px-2.5 h-[24px] rounded-sm transition-colors ${
                  inspectorTab === 'telemetry'
                    ? 'bg-[#1e1e1e] text-white font-medium border border-[#333333]'
                    : 'text-[#777777] hover:text-[#cccccc]'
                }`}
              >
                Live Telemetry
              </button>
              <button
                onClick={() => setInspectorTab('terminal')}
                className={`px-2.5 h-[24px] rounded-sm transition-colors ${
                  inspectorTab === 'terminal'
                    ? 'bg-[#1e1e1e] text-white font-medium border border-[#333333]'
                    : 'text-[#777777] hover:text-[#cccccc]'
                }`}
              >
                IAP Terminal
              </button>
              <button
                onClick={() => setInspectorTab('preflight')}
                className={`px-2.5 h-[24px] rounded-sm transition-colors ${
                  inspectorTab === 'preflight'
                    ? 'bg-[#1e1e1e] text-white font-medium border border-[#333333]'
                    : 'text-[#777777] hover:text-[#cccccc]'
                }`}
              >
                Diagnostics
              </button>
            </div>

            {/* Tab 1: Overview & Control */}
            {inspectorTab === 'overview' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Launch in Workspace CTA */}
                {selectedVm.status === 'RUNNING' && (
                  <button
                    onClick={() => onOpenWorkspaceOnVm(selectedVm)}
                    className="w-full h-[32px] bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Bind Repo & Open in IDE Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Specs Box */}
                <div className="p-3 bg-[#141414] border border-[#242424] space-y-2 text-[10px]">
                  <span className="text-[#555555] uppercase block font-semibold">Instance Specifications</span>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Machine Type:</span>
                    <span className="text-[#cccccc]">{selectedVm.machineType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">vCPU / Memory:</span>
                    <span className="text-[#cccccc]">{selectedVm.cpuCores} vCPU · {selectedVm.ramGB} GB RAM</span>
                  </div>
                  {selectedVm.gpu && (
                    <div className="flex justify-between">
                      <span className="text-[#777777]">GPU Silicon:</span>
                      <span className="text-[#cca700] font-semibold">{selectedVm.gpu.count}x {selectedVm.gpu.model} ({selectedVm.gpu.vramTotalGB} GB)</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Boot Disk:</span>
                    <span className="text-[#cccccc]">{selectedVm.bootDiskGB} GB NVMe</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Internal IP:</span>
                    <span className="text-[#cccccc]">{selectedVm.internalIp} (IAP TCP Forwarding)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">OS Image:</span>
                    <span className="text-[#888888] truncate max-w-[190px]">{selectedVm.osImage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Uptime:</span>
                    <span className="text-[#cccccc]">{selectedVm.uptimeHours > 0 ? `${selectedVm.uptimeHours.toFixed(1)} hrs` : 'Offline'}</span>
                  </div>
                </div>

                {/* Lifecycle Controls: Start / Stop / Reboot */}
                <div className="space-y-1.5">
                  <span className="text-[#555555] uppercase text-[10px] block font-semibold">VM Lifecycle Controls</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVm.status === 'RUNNING' ? (
                      <button
                        onClick={() => handleVmAction(selectedVm, 'stop')}
                        disabled={actionLoading !== null}
                        className="h-[28px] px-2 bg-[#222222] hover:bg-[#2b2b2b] text-[#cccccc] rounded-sm text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-[#333333]"
                      >
                        <Square className="w-3 h-3 text-[#f14c4c] fill-current" />
                        <span>Stop VM</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVmAction(selectedVm, 'start')}
                        disabled={actionLoading !== null}
                        className="h-[28px] px-2 bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start VM</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleVmAction(selectedVm, 'reset')}
                      disabled={actionLoading !== null || selectedVm.status !== 'RUNNING'}
                      className="h-[28px] px-2 bg-[#222222] hover:bg-[#2b2b2b] disabled:opacity-40 text-[#cccccc] rounded-sm text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-[#333333]"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Reboot VM</span>
                    </button>
                  </div>
                </div>

                {/* Agent Status Box */}
                <div className="p-3 bg-[#141414] border border-[#242424] space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#555555] uppercase font-semibold">Kshetra Agent (IAP)</span>
                    <span className={selectedVm.agentStatus === 'CONNECTED' ? 'text-[#4ec9b0]' : 'text-[#cca700]'}>
                      {selectedVm.agentStatus}
                    </span>
                  </div>

                  {selectedVm.agentStatus === 'CONNECTED' ? (
                    <div className="text-[#888888] space-y-1">
                      <div>Protocol: mTLS over IAP TCP :443</div>
                      <div>Agent Version: {selectedVm.agentVersion || 'v2.4.1'}</div>
                    </div>
                  ) : selectedVm.status === 'RUNNING' ? (
                    <button
                      onClick={() => handleConnectAgent(selectedVm)}
                      disabled={isConnectingAgent}
                      className="w-full h-[26px] bg-[#222222] hover:bg-[#2c2c2c] border border-[#333333] text-[#cccccc] rounded-sm text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-[#0078d4]" />
                      <span>Bootstrap Agent via IAP Tunnel</span>
                    </button>
                  ) : (
                    <span className="text-[#666666]">VM must be RUNNING to bootstrap agent.</span>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Live Telemetry */}
            {inspectorTab === 'telemetry' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedVm.status !== 'RUNNING' ? (
                  <div className="p-6 text-center text-[#666666] font-mono">
                    VM is currently {selectedVm.status}. Start the instance to view live GPU load, thermal metrics, and active processes.
                  </div>
                ) : (
                  <>
                    {/* Live Load Meters */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#888888]">GPU Tensor Core Utilization</span>
                          <span className="text-white font-bold">{vmTelemetry?.gpuUtilPercent || 38}%</span>
                        </div>
                        <div className="h-2 bg-[#222222] rounded-xs overflow-hidden">
                          <div 
                            className="h-full bg-[#0078d4] transition-all duration-500" 
                            style={{ width: `${vmTelemetry?.gpuUtilPercent || 38}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#888888]">VRAM Memory Allocation</span>
                          <span className="text-[#cca700] font-bold">
                            {vmTelemetry?.vramUsedGB || 28.4} / {selectedVm.gpu?.vramTotalGB || 80} GB
                          </span>
                        </div>
                        <div className="h-2 bg-[#222222] rounded-xs overflow-hidden">
                          <div 
                            className="h-full bg-[#cca700] transition-all duration-500" 
                            style={{ width: `${Math.round(((vmTelemetry?.vramUsedGB || 28.4) / (selectedVm.gpu?.vramTotalGB || 80)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                        <div className="p-2 bg-[#141414] border border-[#242424]">
                          <span className="text-[#666666] block">Core Temp</span>
                          <span className="text-[#4ec9b0] text-[13px] font-bold">{vmTelemetry?.temperatureC || 44}°C</span>
                        </div>
                        <div className="p-2 bg-[#141414] border border-[#242424]">
                          <span className="text-[#666666] block">Power Draw</span>
                          <span className="text-[#0078d4] text-[13px] font-bold">{vmTelemetry?.powerWatts || 280}W</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Processes running on VM */}
                    <div className="space-y-1.5 border-t border-[#242424] pt-3">
                      <span className="text-[#555555] uppercase text-[10px] block font-semibold">Active Compute Processes</span>
                      <div className="p-2 bg-[#121212] border border-[#242424] space-y-2 text-[10px]">
                        {(vmTelemetry?.activeProcesses || [
                          { pid: 3891, user: 'aman', command: 'python3 -m torch.distributed.run train.py', gpuMemory: '24.2 GB', cpuPercent: 84 },
                          { pid: 4012, user: 'root', command: 'fabric-agent (daemon v2.4.1)', gpuMemory: '142 MB', cpuPercent: 1.1 }
                        ]).map((proc: any, pIdx: number) => (
                          <div key={pIdx} className="border-b border-[#1e1e1e] pb-1.5 last:border-0 last:pb-0">
                            <div className="flex justify-between text-white font-mono">
                              <span className="text-[#0078d4]">PID {proc.pid} ({proc.user})</span>
                              <span className="text-[#cca700]">{proc.gpuMemory}</span>
                            </div>
                            <span className="text-[#888888] truncate block text-[9px] mt-0.5">{proc.command}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab 3: IAP SSH Terminal */}
            {inspectorTab === 'terminal' && (
              <div className="flex-1 flex flex-col overflow-hidden p-3 bg-[#101010]">
                {/* Quick command buttons */}
                <div className="flex items-center gap-1 mb-2 overflow-x-auto shrink-0 pb-1">
                  {['nvidia-smi', 'uname -a', 'torch test', 'df -h', 'uptime'].map(cmd => (
                    <button
                      key={cmd}
                      onClick={() => handleExecuteTerminalCommand(cmd === 'torch test' ? 'python3 -c "import torch; print(torch.cuda.is_available())"' : cmd)}
                      disabled={selectedVm.status !== 'RUNNING' || isExecutingCommand}
                      className="px-2 py-0.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] text-[#aaaaaa] rounded-xs text-[9px] font-mono shrink-0 transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {/* Console Output Screen */}
                <div className="flex-1 bg-[#0c0c0c] border border-[#222222] p-2.5 overflow-y-auto font-mono text-[10px] space-y-2 text-[#cccccc]">
                  {terminalHistory.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-[#0078d4] flex items-center gap-1 font-semibold">
                        <span>$</span>
                        <span>{item.cmd}</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-[#888888] text-[9.5px] leading-relaxed">
                        {item.output}
                      </pre>
                    </div>
                  ))}
                  {isExecutingCommand && (
                    <div className="text-[#cca700] animate-pulse">
                      Executing command via IAP tunnel...
                    </div>
                  )}
                </div>

                {/* Terminal Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteTerminalCommand();
                  }}
                  className="mt-2 flex items-center bg-[#141414] border border-[#282828] px-2 h-[28px] shrink-0"
                >
                  <span className="text-[#0078d4] font-bold mr-1.5 text-[11px]">$</span>
                  <input
                    type="text"
                    value={terminalCommand}
                    onChange={(e) => setTerminalCommand(e.target.value)}
                    placeholder="Enter command (e.g. nvidia-smi, uptime, uname -a)..."
                    disabled={selectedVm.status !== 'RUNNING' || isExecutingCommand}
                    className="w-full bg-transparent text-[#ffffff] font-mono text-[10px] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={selectedVm.status !== 'RUNNING' || isExecutingCommand}
                    className="text-[#666666] hover:text-[#cccccc] ml-1"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 4: Preflight Diagnostics */}
            {inspectorTab === 'preflight' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#aaaaaa] font-semibold text-[11px] block">
                    IAP & Hardware Diagnostics
                  </span>
                  <button
                    onClick={() => handleRunPreflight(selectedVm)}
                    disabled={isPreflighting}
                    className="h-[22px] px-2.5 bg-[#222222] hover:bg-[#2c2c2c] text-[#cccccc] rounded-sm text-[10px] flex items-center gap-1 transition-colors border border-[#333333]"
                  >
                    <RotateCw className={`w-2.5 h-2.5 ${isPreflighting ? 'animate-spin text-[#0078d4]' : ''}`} />
                    <span>Run Verification</span>
                  </button>
                </div>

                {preflightResult ? (
                  <div className="p-2.5 bg-[#121212] border border-[#242424] space-y-1.5 text-[10px] leading-snug">
                    {preflightResult.messages.map((msg, mIdx) => (
                      <div 
                        key={mIdx}
                        className={
                          msg.includes('[PASS]') 
                            ? 'text-[#4ec9b0]' 
                            : msg.includes('[FAIL]') 
                            ? 'text-[#f14c4c]' 
                            : 'text-[#888888]'
                        }
                      >
                        {msg}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-[#666666]">
                    Click "Run Verification" to test IAP TCP tunneling, OS Login mapping, and NVML drivers.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Provision New VM Modal */}
      <CreateVmModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onVmCreated={handleNewVmCreated}
      />
    </div>
  );
};
