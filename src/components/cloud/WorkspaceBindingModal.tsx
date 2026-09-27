import React, { useState } from 'react';
import { 
  X, 
  Github, 
  Cloud, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  FolderGit2, 
  GitBranch, 
  Cpu 
} from 'lucide-react';
import { GcpVmInstance, GitHubRepo } from '../../types/fabric';

interface WorkspaceBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: GitHubRepo[];
  vms: GcpVmInstance[];
  defaultVmName?: string;
  onConfirmBinding: (repoFullName: string, branch: string, vm: GcpVmInstance) => Promise<void>;
}

export const WorkspaceBindingModal: React.FC<WorkspaceBindingModalProps> = ({
  isOpen,
  onClose,
  repos,
  vms,
  defaultVmName,
  onConfirmBinding,
}) => {
  const runningVms = vms.filter(v => v.status === 'RUNNING');
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>(
    repos[0]?.fullName || 'amanyagami/ide-kshetra'
  );
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [selectedVmName, setSelectedVmName] = useState<string>(
    defaultVmName || runningVms[0]?.name || vms[0]?.name || ''
  );
  const [isOpening, setIsOpening] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRepo = repos.find(r => r.fullName === selectedRepoFullName) || repos[0];
  const targetVm = vms.find(v => v.name === selectedVmName) || runningVms[0] || vms[0];

  const handleLaunch = async () => {
    if (!targetVm) return;
    setIsOpening(true);
    try {
      await onConfirmBinding(selectedRepoFullName, selectedBranch, targetVm);
      onClose();
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/70 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#1e1e1e] border border-[#2b2b2b] shadow-2xl flex flex-col text-[#cccccc] text-[12px]">
        {/* Header */}
        <div className="h-[36px] px-3.5 border-b border-[#282828] bg-[#181818] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-[12px]">
              Bind Repository to Cloud VM (Workspace Contract)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-white text-[#666666] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 font-mono text-[11px]">
          {/* Formula Callout */}
          <div className="p-2.5 bg-[#141414] border border-[#242424] text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-[#569cd6]">RepositorySelection</span>
              <span className="text-[#858585]">+</span>
              <span className="text-[#4ec9b0]">ComputeTarget</span>
              <span className="text-[#858585]">=</span>
              <span className="text-[#ce9178] font-bold">WorkspaceBinding</span>
            </div>
          </div>

          {/* 1. Repository Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#777777] uppercase block font-semibold flex items-center gap-1.5">
              <Github className="w-3 h-3 text-[#cccccc]" />
              <span>1. GitHub Repository (Authorized via App)</span>
            </label>
            <select
              value={selectedRepoFullName}
              onChange={(e) => {
                setSelectedRepoFullName(e.target.value);
                const repo = repos.find(r => r.fullName === e.target.value);
                if (repo) setSelectedBranch(repo.defaultBranch);
              }}
              className="w-full h-[28px] px-2 bg-[#141414] border border-[#2b2b2b] text-white text-[11px] outline-none rounded-sm"
            >
              {repos.map(r => (
                <option key={r.id} value={r.fullName}>
                  {r.fullName} ({r.isPrivate ? 'private' : 'public'})
                </option>
              ))}
            </select>
          </div>

          {/* Branch Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#777777] uppercase block font-semibold flex items-center gap-1.5">
              <GitBranch className="w-3 h-3 text-[#569cd6]" />
              <span>Branch</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-[28px] px-2 bg-[#141414] border border-[#2b2b2b] text-white text-[11px] outline-none rounded-sm"
            >
              {currentRepo?.branches.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Compute Target (GCP Running VM) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#777777] uppercase block font-semibold flex items-center gap-1.5">
              <Cloud className="w-3 h-3 text-[#0078d4]" />
              <span>2. Compute Engine VM Target</span>
            </label>
            <select
              value={selectedVmName}
              onChange={(e) => setSelectedVmName(e.target.value)}
              className="w-full h-[28px] px-2 bg-[#141414] border border-[#2b2b2b] text-white text-[11px] outline-none rounded-sm"
            >
              {runningVms.map(v => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.zone}) - {v.gpu ? `${v.gpu.count}x ${v.gpu.model}` : v.machineType}
                </option>
              ))}
            </select>
          </div>

          {/* VM Preview summary */}
          {targetVm && (
            <div className="p-2.5 bg-[#161616] border border-[#262626] space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#666666]">Target Internal IP:</span>
                <span className="text-[#cccccc]">{targetVm.internalIp} (IAP TCP tunnel)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Machine & Accel:</span>
                <span className="text-[#cca700]">{targetVm.machineType} · {targetVm.gpu ? targetVm.gpu.model : 'CPU'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Git Auth:</span>
                <span className="text-[#4ec9b0]">Short-lived installation token (no PAT stored)</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleLaunch}
              disabled={isOpening || !targetVm}
              className="w-full h-[32px] bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
            >
              {isOpening ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Cloning Repo & Verifying All-Ready Gate...</span>
                </>
              ) : (
                <>
                  <span>Open Workspace & Verify All-Ready</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
