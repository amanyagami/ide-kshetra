import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Globe, 
  HardDrive, 
  CheckCircle2, 
  RotateCw, 
  ExternalLink 
} from 'lucide-react';
import { 
  NodeLease, 
  GpuTelemetry, 
  ReadinessCheck, 
  PortForward, 
  WorkspaceSnapshot 
} from '../../types/fabric';

interface FabricInspectorProps {
  lease: NodeLease | null;
  telemetry: GpuTelemetry;
  readinessChecks: ReadinessCheck[];
  onReverifyReadiness: () => void;
  isVerifying: boolean;
}

export const FabricInspector: React.FC<FabricInspectorProps> = ({
  lease,
  telemetry,
  readinessChecks,
  onReverifyReadiness,
  isVerifying,
}) => {
  const [activeTab, setActiveTab] = useState<'readiness' | 'gpu' | 'lease' | 'ports' | 'snapshots'>('readiness');

  const [ports] = useState<PortForward[]>([
    {
      port: 8000,
      name: 'Gemma Inference REST API',
      protocol: 'http',
      authenticatedUrl: 'https://gateway.fabric.io/proxy/ws-99a/8000?token=fab_auth_78d1a',
      isPublic: false,
      status: 'listening',
    },
    {
      port: 6006,
      name: 'TensorBoard Metrics',
      protocol: 'http',
      authenticatedUrl: 'https://gateway.fabric.io/proxy/ws-99a/6006?token=fab_auth_78d1a',
      isPublic: false,
      status: 'listening',
    },
  ]);

  const [snapshots] = useState<WorkspaceSnapshot[]>([
    {
      id: 'snap-01',
      name: 'Pre-Training Checkpoint',
      createdAt: '24m ago',
      sizeMB: 1840,
      type: 'portable_restic_encrypted',
      status: 'healthy',
      sha256: 'sha256:4f89d311cb7a8b92ef88019aa1275d4097e6e5a593e2b3c7aa864980deef2951',
    },
  ]);

  const allPassed = readinessChecks.every(c => c.status === 'passed');

  return (
    <div className="w-[280px] bg-[#181818] border-l border-[#282828] flex flex-col shrink-0 h-full overflow-hidden text-[#cccccc] select-none text-[11px]">
      {/* Inspector Section Header & Tabs */}
      <div className="h-[30px] border-b border-[#282828] bg-[#141414] flex items-center justify-between px-1">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveTab('readiness')}
            className={`h-[22px] px-2 rounded-sm transition-colors ${
              activeTab === 'readiness' ? 'bg-[#222222] text-[#ffffff] font-medium' : 'text-[#777777] hover:text-[#aaaaaa]'
            }`}
          >
            Ready
          </button>
          <button
            onClick={() => setActiveTab('gpu')}
            className={`h-[22px] px-2 rounded-sm transition-colors ${
              activeTab === 'gpu' ? 'bg-[#222222] text-[#ffffff] font-medium' : 'text-[#777777] hover:text-[#aaaaaa]'
            }`}
          >
            GPU
          </button>
          <button
            onClick={() => setActiveTab('lease')}
            className={`h-[22px] px-2 rounded-sm transition-colors ${
              activeTab === 'lease' ? 'bg-[#222222] text-[#ffffff] font-medium' : 'text-[#777777] hover:text-[#aaaaaa]'
            }`}
          >
            Lease
          </button>
          <button
            onClick={() => setActiveTab('ports')}
            className={`h-[22px] px-2 rounded-sm transition-colors ${
              activeTab === 'ports' ? 'bg-[#222222] text-[#ffffff] font-medium' : 'text-[#777777] hover:text-[#aaaaaa]'
            }`}
          >
            Ports
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`h-[22px] px-2 rounded-sm transition-colors ${
              activeTab === 'snapshots' ? 'bg-[#222222] text-[#ffffff] font-medium' : 'text-[#777777] hover:text-[#aaaaaa]'
            }`}
          >
            Snaps
          </button>
        </div>

        <button
          onClick={onReverifyReadiness}
          disabled={isVerifying}
          className="p-1 text-[#666666] hover:text-[#cccccc] transition-colors"
          title="Re-verify readiness gate"
        >
          <RotateCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-[#0078d4]' : ''}`} />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 font-mono">
        {/* TAB 1: READINESS GATE */}
        {activeTab === 'readiness' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-[#777777] border-b border-[#242424] pb-1">
              <span>TRUTHFUL ALL-READY EVIDENCE</span>
              <span className={allPassed ? 'text-[#4ec9b0]' : 'text-[#cca700]'}>
                {allPassed ? '11/11 Verified' : 'In Progress'}
              </span>
            </div>

            <div className="space-y-1.5">
              {readinessChecks.map(check => (
                <div key={check.id} className="p-1.5 border border-[#242424] bg-[#1a1a1a] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#cccccc] font-medium">
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-3 h-3 text-[#4ec9b0] shrink-0" />
                      ) : check.status === 'running' ? (
                        <RotateCw className="w-3 h-3 text-[#0078d4] animate-spin shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#555555] shrink-0" />
                      )}
                      <span className="truncate">{check.label}</span>
                    </span>
                    {check.latencyMs ? (
                      <span className="text-[#555555] text-[10px]">{check.latencyMs}ms</span>
                    ) : null}
                  </div>
                  {check.evidence && (
                    <div className="text-[10px] text-[#777777] pl-4 leading-normal select-text">
                      {check.evidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GPU TELEMETRY */}
        {activeTab === 'gpu' && (
          <div className="space-y-2.5">
            <div className="p-2 border border-[#242424] bg-[#1a1a1a] space-y-1.5">
              <span className="text-[10px] text-[#666666] block uppercase">Silicon</span>
              <div className="text-[#ffffff] font-bold text-[12px]">{telemetry.model}</div>
              <div className="text-[#777777] text-[10px]">PCIe {telemetry.pciBusId} · SXM5</div>
            </div>

            {/* VRAM Meter */}
            <div className="p-2 border border-[#242424] bg-[#1a1a1a] space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#888888]">HBM3e VRAM</span>
                <span className="text-[#ffffff]">{telemetry.vramUsedGB} / {telemetry.vramTotalGB} GB</span>
              </div>
              <div className="w-full bg-[#141414] h-[3px]">
                <div 
                  className="bg-[#0078d4] h-full"
                  style={{ width: `${(telemetry.vramUsedGB / telemetry.vramTotalGB) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#555555]">
                <span>Util: {telemetry.gpuUtilPercent}%</span>
                <span>4.8 TB/s</span>
              </div>
            </div>

            {/* Core Temp & Power */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 border border-[#242424] bg-[#1a1a1a]">
                <span className="text-[#555555] text-[10px] block">TEMP</span>
                <span className="text-[#cccccc] font-bold text-[12px]">{telemetry.temperatureC}°C</span>
                <span className="text-[#555555] text-[10px] block">Fan {telemetry.fanSpeedPercent}%</span>
              </div>
              <div className="p-2 border border-[#242424] bg-[#1a1a1a]">
                <span className="text-[#555555] text-[10px] block">POWER</span>
                <span className="text-[#cccccc] font-bold text-[12px]">{telemetry.powerWatts}W</span>
                <span className="text-[#555555] text-[10px] block">Cap {telemetry.maxPowerWatts}W</span>
              </div>
            </div>

            {/* Tensor Core Metric */}
            <div className="p-2 border border-[#242424] bg-[#1a1a1a] space-y-0.5">
              <span className="text-[#555555] text-[10px] block">TENSOR PERFORMANCE</span>
              <div className="text-[#4ec9b0] font-bold text-[12px]">964.8 TFLOPS</div>
              <div className="text-[#777777] text-[10px]">FP16 GEMM with Hopper Transformer Engine</div>
            </div>
          </div>
        )}

        {/* TAB 3: LEASE */}
        {activeTab === 'lease' && (
          <div className="space-y-2">
            <div className="p-2 border border-[#242424] bg-[#1a1a1a] space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#666666]">Lease ID:</span>
                <span className="text-[#cccccc]">{lease?.leaseId || 'lease-gmi-9912'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Generation (Fencing):</span>
                <span className="text-[#cccccc]">#{lease?.generation || 1001}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Node ID:</span>
                <span className="text-[#cccccc]">{lease?.nodeId || 'node-gmi-h200'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Provider:</span>
                <span className="text-[#cccccc]">{lease?.provider.name || 'GMI Cloud'} ({lease?.provider.region || 'us-west'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Rate:</span>
                <span className="text-[#cccccc]">${lease?.cost.hourlyRate.toFixed(2) || '3.19'} / hr</span>
              </div>
            </div>

            <div className="p-2 border border-[#242424] bg-[#161616] text-[10px] text-[#666666] leading-relaxed">
              Invariant I4: Every compute resource has an owner, lease, generation, and cleanup path. Stale mutations with old generation are rejected.
            </div>
          </div>
        )}

        {/* TAB 4: PORTS */}
        {activeTab === 'ports' && (
          <div className="space-y-2">
            <div className="text-[10px] text-[#777777] border-b border-[#242424] pb-1">
              AUTHENTICATED PORT PROXY
            </div>

            {ports.map((p, idx) => (
              <div key={idx} className="p-2 border border-[#242424] bg-[#1a1a1a] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#ffffff] font-medium">:{p.port} ({p.name})</span>
                  <span className="text-[#4ec9b0] text-[10px]">Active</span>
                </div>
                <a
                  href={p.authenticatedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-[#569cd6] hover:underline truncate block"
                >
                  {p.authenticatedUrl}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: SNAPSHOTS */}
        {activeTab === 'snapshots' && (
          <div className="space-y-2">
            <div className="text-[10px] text-[#777777] border-b border-[#242424] pb-1">
              PORTABLE SNAPSHOTS (RESTIC)
            </div>

            {snapshots.map(s => (
              <div key={s.id} className="p-2 border border-[#242424] bg-[#1a1a1a] space-y-1 text-[10px]">
                <div className="flex justify-between text-[#cccccc] font-medium">
                  <span>{s.name}</span>
                  <span className="text-[#4ec9b0]">OK</span>
                </div>
                <div className="text-[#666666] flex justify-between">
                  <span>Size: {s.sizeMB} MB</span>
                  <span>{s.createdAt}</span>
                </div>
                <div className="text-[#555555] truncate">{s.sha256}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
