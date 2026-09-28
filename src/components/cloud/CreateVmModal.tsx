import React, { useState } from 'react';
import {
  X,
  Plus,
  Server,
  Cpu,
  HardDrive,
  Cloud,
  RotateCw,
} from 'lucide-react';
import { GcpProject, GcpVmInstance } from '../../types/fabric';
import { cloudService } from '../../services/cloudService';

interface CreateVmModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: GcpProject[];
  activeProjectId: string;
  onVmCreated: (newVm: GcpVmInstance) => void;
}

export const CreateVmModal: React.FC<CreateVmModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onVmCreated,
}) => {
  const [projectId, setProjectId] = useState<string>(activeProjectId);
  const [name, setName] = useState<string>('gcp-h100-cluster-node-02');
  const [zone, setZone] = useState<string>('us-central1-a');
  const [tier, setTier] = useState<string>('h100');
  const [diskGB, setDiskGB] = useState<number>(200);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // costPerHour values are rough estimates for the picker UI only — never
  // presented as billed cost (plan Section 26: estimate vs actual billing).
  // acceleratorType slugs should be verified against
  // `gcloud compute accelerator-types list` for the target region before
  // first real use — GCP will reject an incorrect slug at creation time.
  const tiers: Record<string, {
    label: string;
    machineType: string;
    acceleratorType?: string;
    gpuCount: number;
    cpuCores: number;
    ramGB: number;
    costPerHour: number;
  }> = {
    h100: {
      label: '8x NVIDIA H100 SXM5 (640 GB VRAM)',
      machineType: 'a3-highgpu-8g',
      acceleratorType: 'nvidia-h100-80gb',
      gpuCount: 8,
      cpuCores: 208,
      ramGB: 1872,
      costPerHour: 24.80,
    },
    l4: {
      label: '4x NVIDIA L4 (96 GB VRAM)',
      machineType: 'g2-standard-48',
      acceleratorType: 'nvidia-l4',
      gpuCount: 4,
      cpuCores: 48,
      ramGB: 192,
      costPerHour: 4.60,
    },
    a100: {
      label: '1x NVIDIA A100 SXM4 (80 GB VRAM)',
      machineType: 'a2-highgpu-1g',
      acceleratorType: 'nvidia-tesla-a100',
      gpuCount: 1,
      cpuCores: 12,
      ramGB: 85,
      costPerHour: 3.67,
    },
    cpu: {
      label: '16 vCPU C3 High-Performance (CPU only)',
      machineType: 'c3-standard-16',
      gpuCount: 0,
      cpuCores: 16,
      ramGB: 64,
      costPerHour: 0.82,
    },
  };

  const selectedTier = tiers[tier] || tiers.a100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setError(null);

    try {
      const newVm = await cloudService.createGcpInstance(projectId, {
        name,
        zone,
        machineType: selectedTier.machineType,
        sourceImage: 'projects/ml-images/global/images/family/common-cu124',
        diskSizeGb: diskGB,
        acceleratorType: selectedTier.acceleratorType,
        acceleratorCount: selectedTier.acceleratorType ? selectedTier.gpuCount : undefined,
      });

      onVmCreated(newVm);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to provision instance');
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#1e1e1e] border border-[#2b2b2b] shadow-2xl flex flex-col text-[#cccccc] text-[12px]">
        <div className="h-[36px] px-3.5 border-b border-[#282828] bg-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[#0078d4]" />
            <span className="font-semibold text-white text-[12px]">Create New Machine</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-[#666666] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2 bg-[#2a1414] border border-[#5a2323] text-[#f14c4c] text-[11px]">{error}</div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-[#777777] uppercase font-mono block">Project</label>
            <div className="flex items-center bg-[#141414] border border-[#2b2b2b] px-2 h-[28px]">
              <Cloud className="w-3.5 h-3.5 text-[#555555] mr-2 shrink-0" />
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-transparent text-white font-mono text-[11px] outline-none">
                {projects.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-[#777777] uppercase font-mono block">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#141414] border border-[#2b2b2b] px-2 h-[28px] text-white font-mono text-[11px] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#777777] uppercase font-mono block">Zone</label>
              <input type="text" required value={zone} onChange={(e) => setZone(e.target.value)} className="w-full bg-[#141414] border border-[#2b2b2b] px-2 h-[28px] text-white font-mono text-[11px] outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#777777] uppercase font-mono block">GPU / Machine Tier</label>
            <div className="space-y-1.5">
              {Object.entries(tiers).map(([key, t]) => (
                <label key={key} className={`flex items-center gap-2 p-2 border cursor-pointer ${tier === key ? 'border-[#0078d4] bg-[#0d1b2a]' : 'border-[#242424] bg-[#141414]'}`}>
                  <input type="radio" name="tier" checked={tier === key} onChange={() => setTier(key)} className="accent-[#0078d4]" />
                  <Cpu className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[11px]">{t.label}</div>
                    <div className="text-[#666666] text-[10px]">{t.machineType} · ~${t.costPerHour.toFixed(2)}/hr (estimate)</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#777777] uppercase font-mono block">Boot disk (GB)</label>
            <div className="flex items-center bg-[#141414] border border-[#2b2b2b] px-2 h-[28px]">
              <HardDrive className="w-3.5 h-3.5 text-[#555555] mr-2 shrink-0" />
              <input type="number" min={50} value={diskGB} onChange={(e) => setDiskGB(Number(e.target.value))} className="w-full bg-transparent text-white font-mono text-[11px] outline-none" />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isProvisioning} className="w-full h-[32px] bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60">
              {isProvisioning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isProvisioning ? 'Provisioning real instance...' : 'Create & Provision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
