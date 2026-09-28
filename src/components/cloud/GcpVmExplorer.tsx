import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { GcpProject, GcpVmInstance, WorkspaceBinding } from '../../types/fabric';
import { cloudService } from '../../services/cloudService';

interface GcpVmExplorerProps {
  projects: GcpProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  vms: GcpVmInstance[];
  onRefreshVms: () => Promise<void>;
  onOpenWorkspaceOnVm: (vm: GcpVmInstance) => void;
  onCreateVm?: () => void;
}

export const GcpVmExplorer: React.FC<GcpVmExplorerProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  vms,
  onRefreshVms,
  onOpenWorkspaceOnVm,
  onCreateVm,
}) => {
  const [selectedVm, setSelectedVm] = useState<GcpVmInstance | null>(vms[0] || null);
  const [isPreflighting, setIsPreflighting] = useState<boolean>(false);
  const [isConnectingAgent, setIsConnectingAgent] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [preflightResult, setPreflightResult] = useState<GcpVmInstance['preflight'] | null>(
    vms[0]?.preflight || null
  );

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleSelectVm = (vm: GcpVmInstance) => {
    setSelectedVm(vm);
    setPreflightResult(vm.preflight || null);
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

  const runningCount = vms.filter(v => v.status === 'RUNNING').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden text-[#cccccc] text-[12px] select-none">
      {/* Header Bar */}
      <div className="h-[36px] px-3.5 border-b border-[#282828] bg-[#181818] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Cloud className="w-3.5 h-3.5 text-[#0078d4]" />
          <span className="font-semibold text-white text-[12px]">
            Google Cloud Platform — Existing Compute Engine VMs
          </span>
          <span className="text-[#666666]">|</span>
          <span className="text-[11px] font-mono text-[#858585]">
            instances.aggregatedList ({runningCount} RUNNING)
          </span>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#666666] font-mono">GCP Project:</span>
          <select
            value={activeProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="h-[24px] px-2 bg-[#141414] border border-[#2b2b2b] text-[#ffffff] font-mono text-[11px] outline-none rounded-sm"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>

          <button
            onClick={onRefreshVms}
            className="p-1 hover:text-white text-[#777777] rounded-sm transition-colors"
            title="Refresh instances"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          {onCreateVm && (
            <button
              onClick={onCreateVm}
              className="h-[24px] px-2 flex items-center gap-1 bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] font-medium transition-colors"
              title="Create a new machine"
            >
              <Plus className="w-3 h-3" />
              <span>New Machine</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: VM List & VM Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: VM Table List */}
        <div className="flex-1 flex flex-col border-r border-[#282828] overflow-y-auto">
          {/* Table Column Headers */}
          <div className="h-[24px] px-3 bg-[#141414] border-b border-[#242424] flex items-center text-[10px] font-mono text-[#666666] uppercase tracking-wider">
            <span className="w-48">Instance Name</span>
            <span className="w-24">Status</span>
            <span className="w-32">Zone</span>
            <span className="w-48">GPU Accelerator</span>
            <span className="w-28">Machine Type</span>
            <span className="w-28">Internal IP (IAP)</span>
            <span className="w-24 text-right">Agent</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#242424]">
            {vms.map(vm => {
              const isSelected = selectedVm?.name === vm.name;
              const isRunning = vm.status === 'RUNNING';

              return (
                <div
                  key={vm.id}
                  onClick={() => handleSelectVm(vm)}
                  className={`h-[40px] px-3 flex items-center cursor-pointer transition-colors text-[11px] font-mono ${
                    isSelected 
                      ? 'bg-[#252526] text-white' 
                      : 'hover:bg-[#1a1a1a] text-[#a0a0a0]'
                  }`}
                >
                  {/* Name */}
                  <div className="w-48 flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                      {vm.status}
                    </span>
                  </div>

                  {/* Zone */}
                  <div className="w-32 text-[#858585] truncate">{vm.zone}</div>

                  {/* GPU Accelerator */}
                  <div className="w-48 truncate">
                    {vm.gpu ? (
                      <span className="text-[#cca700] font-medium">
                        {vm.gpu.count}x {vm.gpu.model.replace('NVIDIA ', '')}
                      </span>
                    ) : (
                      <span className="text-[#555555]">CPU only</span>
                    )}
                  </div>

                  {/* Machine Type */}
                  <div className="w-28 text-[#858585] truncate">{vm.machineType}</div>

                  {/* Internal IP */}
                  <div className="w-28 text-[#858585]">
                    <span>{vm.internalIp}</span>
                    {vm.isPrivateOnly && (
                      <span className="text-[9px] text-[#555555] block">IAP only</span>
                    )}
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
          </div>
        </div>

        {/* Right: Selected VM Detail, Preflight & Actions */}
        {selectedVm && (
          <div className="w-[340px] bg-[#181818] flex flex-col h-full overflow-y-auto p-4 space-y-4 shrink-0 font-mono text-[11px]">
            {/* VM Title & Primary Action */}
            <div className="space-y-1 border-b border-[#282828] pb-3">
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
              <span className="text-[#777777] text-[10px] block">
                {selectedVm.projectId} · {selectedVm.zone}
              </span>
            </div>

            {/* Launch on this VM CTA */}
            {selectedVm.status === 'RUNNING' && (
              <button
                onClick={() => onOpenWorkspaceOnVm(selectedVm)}
                className="w-full h-[32px] bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Bind Repo & Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Hardware Specifications */}
            <div className="p-2.5 bg-[#141414] border border-[#242424] space-y-1.5 text-[10px]">
              <span className="text-[#555555] uppercase block font-semibold">Instance Specifications</span>
              <div className="flex justify-between">
                <span className="text-[#777777]">Machine Type:</span>
                <span className="text-[#cccccc]">{selectedVm.machineType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777]">vCPU / RAM:</span>
                <span className="text-[#cccccc]">{selectedVm.cpuCores} vCPU · {selectedVm.ramGB} GB RAM</span>
              </div>
              {selectedVm.gpu && (
                <div className="flex justify-between">
                  <span className="text-[#777777]">GPU Accelerator:</span>
                  <span className="text-[#cca700]">{selectedVm.gpu.count}x {selectedVm.gpu.model} ({selectedVm.gpu.vramTotalGB} GB)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#777777]">Boot Disk:</span>
                <span className="text-[#cccccc]">{selectedVm.bootDiskGB} GB NVMe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777]">Internal IP:</span>
                <span className="text-[#cccccc]">{selectedVm.internalIp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777]">Cost Rate:</span>
                <span className="text-[#4ec9b0]">${selectedVm.costPerHour.toFixed(2)}/h</span>
              </div>
            </div>

            {/* VM State Controls: Start / Stop / Reset */}
            <div className="space-y-1">
              <span className="text-[#555555] uppercase text-[10px] block font-semibold">Lifecycle Controls</span>
              <div className="grid grid-cols-2 gap-1.5">
                {selectedVm.status === 'RUNNING' ? (
                  <button
                    onClick={() => handleVmAction(selectedVm, 'stop')}
                    disabled={actionLoading !== null}
                    className="h-[24px] px-2 bg-[#252525] hover:bg-[#2d2d2d] text-[#cccccc] rounded-sm text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Square className="w-2.5 h-2.5 text-[#f14c4c] fill-current" />
                    <span>Stop VM</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleVmAction(selectedVm, 'start')}
                    disabled={actionLoading !== null}
                    className="h-[24px] px-2 bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Start VM</span>
                  </button>
                )}

                <button
                  onClick={() => handleVmAction(selectedVm, 'reset')}
                  disabled={actionLoading !== null || selectedVm.status !== 'RUNNING'}
                  className="h-[24px] px-2 bg-[#252525] hover:bg-[#2d2d2d] disabled:opacity-40 text-[#cccccc] rounded-sm text-[10px] flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>Reboot VM</span>
                </button>
              </div>
            </div>

            {/* IAP & OS Login Preflight Test */}
            <div className="space-y-2 border-t border-[#242424] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[#aaaaaa] font-semibold text-[11px] block">
                  IAP & OS Login Preflight
                </span>
                <button
                  onClick={() => handleRunPreflight(selectedVm)}
                  disabled={isPreflighting}
                  className="h-[20px] px-2 bg-[#242424] hover:bg-[#2e2e2e] text-[#cccccc] rounded-sm text-[10px] flex items-center gap-1 transition-colors"
                >
                  <RotateCw className={`w-2.5 h-2.5 ${isPreflighting ? 'animate-spin text-[#0078d4]' : ''}`} />
                  <span>Run Preflight</span>
                </button>
              </div>

              {preflightResult && (
                <div className="p-2 bg-[#141414] border border-[#242424] space-y-1 text-[10px] leading-snug">
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
              )}
            </div>

            {/* Agent Bootstrap Section */}
            <div className="space-y-1.5 border-t border-[#242424] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[#aaaaaa] font-semibold text-[11px]">Kshetra Agent</span>
                <span className={selectedVm.agentStatus === 'CONNECTED' ? 'text-[#4ec9b0]' : 'text-[#cca700]'}>
                  {selectedVm.agentStatus}
                </span>
              </div>

              {selectedVm.agentStatus !== 'CONNECTED' && selectedVm.status === 'RUNNING' && (
                <button
                  onClick={() => handleConnectAgent(selectedVm)}
                  disabled={isConnectingAgent}
                  className="w-full h-[26px] bg-[#242424] hover:bg-[#2e2e2e] border border-[#333333] text-[#cccccc] rounded-sm text-[10px] flex items-center justify-center gap-1 transition-colors"
                >
                  <Zap className="w-3 h-3 text-[#0078d4]" />
                  <span>Bootstrap Agent via IAP Tunnel</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
