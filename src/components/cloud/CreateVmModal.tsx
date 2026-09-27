import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Server, 
  Cpu, 
  HardDrive, 
  Cloud, 
  ShieldCheck, 
  RotateCw,
  CheckCircle2
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
  const [name, setName] = useState<string>('gcp-h200-cluster-node-02');
  const [zone, setZone] = useState<string>('us-central1-a');
  const [tier, setTier] = useState<string>('h200');
  const [diskGB, setDiskGB] = useState<number>(1000);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const tiers: Record<string, {
    label: string;
    machineType: string;
    gpuModel: string;
    gpuCount: number;
    vramTotalGB: number;
    cpuCores: number;
    ramGB: number;
    costPerHour: number;
  }> = {
    h200: {
      label: '8x NVIDIA H200 SXM5 (1,128 GB VRAM)',
      machineType: 'a3-megagpu-8g',
      gpuModel: 'NVIDIA H200 141GB SXM5',
      gpuCount: 8,
      vramTotalGB: 1128,
      cpuCores: 208,
      ramGB: 1872,
      costPerHour: 32.40,
    },
    h100: {
      label: '8x NVIDIA H100 SXM5 (640 GB VRAM)',
      machineType: 'a3-highgpu-8g',
      gpuModel: 'NVIDIA H100 80GB SXM5',
      gpuCount: 8,
      vramTotalGB: 640,
      cpuCores: 208,
      ramGB: 1872,
      costPerHour: 24.80,
    },
    l4: {
      label: '4x NVIDIA L4 (96 GB VRAM)',
      machineType: 'g2-standard-48',
      gpuModel: 'NVIDIA L4 24GB',
      gpuCount: 4,
      vramTotalGB: 96,
      cpuCores: 48,
      ramGB: 192,
      costPerHour: 4.60,
    },
    a100: {
      label: '1x NVIDIA A100 SXM4 (80 GB VRAM)',
      machineType: 'a2-highgpu-1g',
      gpuModel: 'NVIDIA A100 80GB SXM4',
      gpuCount: 1,
      vramTotalGB: 80,
      cpuCores: 12,
      ramGB: 85,
      costPerHour: 3.67,
    },
    cpu: {
      label: '16 vCPU C3 High-Performance (CPU Only)',
      machineType: 'c3-standard-16',
      gpuModel: '',
      gpuCount: 0,
      vramTotalGB: 0,
      cpuCores: 16,
      ramGB: 64,
      costPerHour: 0.82,
    },
  };

  const selectedTier = tiers[tier] || tiers.h200;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setError(null);

    try {
      const newVm = await cloudService.createVm({
        name,
        projectId,
        zone,
        machineType: selectedTier.machineType,
        gpuModel: selectedTier.gpuModel || undefined,
        gpuCount: selectedTier.gpuCount || undefined,
        vramTotalGB: selectedTier.vramTotalGB || undefined,
        cpuCores: selectedTier.cpuCores,
        ramGB: selectedTier.ramGB,
        bootDiskGB: diskGB,
        costPerHour: selectedTier.costPerHour,
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
    <div className="fixed inset-0 z-50 bg-[#000000]/70 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#1e1e1e] border border-[#2b2b2b] shadow-2xl flex flex-col text-[#cccccc] text-[12px]">
        {/* Header */}
        <div className="h-[36px] px-3.5 border-b border-[#282828] bg-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[#0078d4]" />
            <span className="font-semibold text-white text-[12px]">
              Provision Compute Engine GPU Instance
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
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-[#2d1414] border border-[#552222] text-[#f14c4c] text-[11px] font-mono">
              {error}
            </div>
          )}

          {/* Instance Name */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#777777] uppercase font-mono block">Instance Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. gcp-h200-cluster-node-02"
              className="w-full bg-[#141414] border border-[#2b2b2b] px-2.5 h-[28px] text-[#ffffff] font-mono text-[11px] outline-none"
            />
          </div>

          {/* Project & Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-[#777777] uppercase font-mono block">Target Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#141414] border border-[#2b2b2b] px-2 h-[28px] text-[#ffffff] font-mono text-[11px] outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#777777] uppercase font-mono block">Deployment Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-[#141414] border border-[#2b2b2b] px-2 h-[28px] text-[#ffffff] font-mono text-[11px] outline-none"
              >
                <option value="us-central1-a">us-central1-a (Iowa)</option>
                <option value="us-west1-b">us-west1-b (Oregon)</option>
                <option value="us-east4-c">us-east4-c (N. Virginia)</option>
              </select>
            </div>
          </div>

          {/* Accelerator & Machine Tier */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#777777] uppercase font-mono block">Compute Tier & Accelerator</label>
            <div className="space-y-1.5">
              {Object.entries(tiers).map(([tKey, tVal]) => (
                <div
                  key={tKey}
                  onClick={() => setTier(tKey)}
                  className={`p-2 border flex items-center justify-between cursor-pointer transition-colors text-[11px] ${
                    tier === tKey
                      ? 'border-[#0078d4] bg-[#222222] text-white'
                      : 'border-[#262626] bg-[#161616] text-[#888888] hover:border-[#333333]'
                  }`}
                >
                  <div>
                    <span className="font-semibold block text-[11px]">{tVal.label}</span>
                    <span className="text-[10px] text-[#666666] font-mono">{tVal.machineType} · {tVal.cpuCores} vCPU · {tVal.ramGB} GB RAM</span>
                  </div>
                  <span className="text-[#4ec9b0] font-mono font-semibold">${tVal.costPerHour.toFixed(2)}/h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disk */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#777777] uppercase font-mono block">Boot Disk NVMe Size (GB)</label>
            <input
              type="number"
              value={diskGB}
              onChange={(e) => setDiskGB(parseInt(e.target.value, 10) || 500)}
              className="w-full bg-[#141414] border border-[#2b2b2b] px-2.5 h-[28px] text-[#ffffff] font-mono text-[11px] outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="h-[28px] px-3 bg-[#242424] hover:bg-[#2c2c2c] text-[#cccccc] rounded-sm text-[11px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProvisioning}
              className="h-[28px] px-4 bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isProvisioning ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Booting Instance in GCP...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Provision & Launch VM</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
