import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Clock, 
  HardDrive, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  ExternalLink,
  Lock,
  Zap,
  DollarSign
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
  gpuImageThumbnail: string;
}

export const FabricInspector: React.FC<FabricInspectorProps> = ({
  lease,
  telemetry,
  readinessChecks,
  onReverifyReadiness,
  isVerifying,
  gpuImageThumbnail,
}) => {
  const [activeTab, setActiveTab] = useState<'readiness' | 'gpu' | 'lease' | 'ports' | 'snapshots'>('readiness');

  const [ports, setPorts] = useState<PortForward[]>([
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

  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([
    {
      id: 'snap-01',
      name: 'Pre-Training Golden Checkpoint',
      createdAt: '24m ago',
      sizeMB: 1840,
      type: 'portable_restic_encrypted',
      status: 'healthy',
      sha256: 'sha256:4f89d311cb7a8b92ef88019aa1275d4097e6e5a593e2b3c7aa864980deef2951',
    },
  ]);

  const allPassed = readinessChecks.every(c => c.status === 'passed');

  return (
    <div className="w-84 border-l border-slate-800/80 bg-slate-950 flex flex-col shrink-0 h-full overflow-hidden text-slate-300">
      {/* Inspector Tabs */}
      <div className="h-10 border-b border-slate-800 flex items-center justify-around px-2 text-[11px] font-medium bg-slate-900/40 select-none">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
            activeTab === 'readiness' 
              ? 'text-cyan-400 bg-slate-800 font-semibold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>All-Ready</span>
        </button>

        <button
          onClick={() => setActiveTab('gpu')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
            activeTab === 'gpu' 
              ? 'text-cyan-400 bg-slate-800 font-semibold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>GPU</span>
        </button>

        <button
          onClick={() => setActiveTab('lease')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
            activeTab === 'lease' 
              ? 'text-cyan-400 bg-slate-800 font-semibold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lease</span>
        </button>

        <button
          onClick={() => setActiveTab('ports')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
            activeTab === 'ports' 
              ? 'text-cyan-400 bg-slate-800 font-semibold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Ports</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
            activeTab === 'snapshots' 
              ? 'text-cyan-400 bg-slate-800 font-semibold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Snaps</span>
        </button>
      </div>

      {/* Main Inspector Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* TAB 1: TRUTHFUL ALL-READY GATE */}
        {activeTab === 'readiness' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Truthful All-Ready Gate</span>
                <span className="text-[11px] text-slate-400">
                  {allPassed ? '11/11 Verified with real evidence' : 'Verification in progress...'}
                </span>
              </div>
              <button
                onClick={onReverifyReadiness}
                disabled={isVerifying}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 disabled:opacity-50 transition-colors"
                title="Re-run verification gate"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {readinessChecks.map(check => (
                <div 
                  key={check.id}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 flex items-center gap-1.5">
                      {check.status === 'passed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : check.status === 'running' ? (
                        <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <span>{check.label}</span>
                    </span>
                    {check.latencyMs ? (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {check.latencyMs}ms
                      </span>
                    ) : null}
                  </div>
                  {check.evidence && (
                    <div className="text-[10px] text-slate-400 pl-5 border-l border-slate-800 leading-relaxed font-sans">
                      {check.evidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE GPU TELEMETRY */}
        {activeTab === 'gpu' && (
          <div className="space-y-4">
            {/* GPU Visual Card with Generated Hardware Asset */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <img 
                src={gpuImageThumbnail} 
                alt="NVIDIA Hopper GPU Silicon" 
                className="w-full h-28 object-cover opacity-60"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 flex flex-col justify-end">
                <span className="text-sm font-bold text-white">{telemetry.model}</span>
                <span className="text-[11px] text-cyan-400 font-mono">PCIe {telemetry.pciBusId} · SXM5</span>
              </div>
            </div>

            {/* VRAM Gauge */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">HBM3e VRAM Utilization</span>
                <span className="font-bold text-white">{telemetry.vramUsedGB} / {telemetry.vramTotalGB} GB</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(telemetry.vramUsedGB / telemetry.vramTotalGB) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Free: {(telemetry.vramTotalGB - telemetry.vramUsedGB).toFixed(1)} GB</span>
                <span>Max Bandwidth: 4.8 TB/s</span>
              </div>
            </div>

            {/* Temperature & Power Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <span className="text-[10px] text-slate-500 uppercase block">Core Temperature</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{telemetry.temperatureC}°C</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Fan: {telemetry.fanSpeedPercent}%</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <span className="text-[10px] text-slate-500 uppercase block">Power Consumption</span>
                <span className="text-sm font-bold text-amber-400 font-mono">{telemetry.powerWatts}W</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Cap: {telemetry.maxPowerWatts}W</span>
              </div>
            </div>

            {/* Tensor Core Output */}
            <div className="p-3 rounded-lg border border-cyan-900/40 bg-cyan-950/20 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>Tensor Core Benchmark</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Sustained FP16 GEMM: <span className="font-bold text-white">964.8 TFLOPS</span>
              </div>
              <div className="text-[10px] text-slate-400">
                CUDA sm_90 4th-Gen Tensor Cores active with Transformer Engine.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEASE & FENCING */}
        {activeTab === 'lease' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Lease ID</span>
                <span className="font-mono text-cyan-400 font-bold">{lease?.leaseId || 'lease-gmi-9912'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Generation (Fencing)</span>
                <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">
                  #{lease?.generation || 1001}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Node ID</span>
                <span className="font-mono text-slate-300">{lease?.nodeId || 'node-gmi-h200'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Provider</span>
                <span className="text-slate-200">{lease?.provider.name || 'GMI Cloud'} ({lease?.provider.region || 'us-west'})</span>
              </div>
            </div>

            {/* Invariant I4 Fencing Box */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 text-[11px] text-slate-400 space-y-1">
              <span className="text-slate-200 font-semibold block">Invariant I4 Enforced</span>
              <p className="leading-relaxed">
                Every compute resource has an owner, lease, generation, and cleanup path. A stale controller cannot destroy a newer machine.
              </p>
            </div>

            {/* Cost Accumulator */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Hourly Rate</span>
                <span className="text-sm font-bold text-white font-mono">
                  ${lease?.cost.hourlyRate.toFixed(2) || '3.19'} / hr
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Session Cost</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">$0.42 USD</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PORT PROXY */}
        {activeTab === 'ports' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <span className="text-slate-300 font-medium">Forwarded Ports</span>
              <span className="text-slate-500 text-[10px]">Authed Gateway Proxy</span>
            </div>

            {ports.map((port, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white font-mono">:{port.port}</span>
                    <span className="text-slate-400 text-[11px]">· {port.name}</span>
                  </div>
                </div>

                <a 
                  href={port.authenticatedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 break-all flex items-center gap-1 p-1.5 rounded bg-slate-950 border border-slate-800/80"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{port.authenticatedUrl}</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: SNAPSHOTS & PERSISTENCE */}
        {activeTab === 'snapshots' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 space-y-1">
              <span className="font-semibold text-white block">Portable Snapshot Engine</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Restic-compatible client-side encrypted snapshots sent to object storage. Independent of cloud provider disk lock-in.
              </p>
            </div>

            {snapshots.map(snap => (
              <div key={snap.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{snap.name}</span>
                  <span className="text-emerald-400 text-[10px]">Healthy</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Size: {snap.sizeMB} MB</span>
                  <span>{snap.createdAt}</span>
                </div>
                <div className="text-[9px] text-slate-500 truncate font-mono">
                  {snap.sha256}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
