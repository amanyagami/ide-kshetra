import React from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Key, 
  Terminal, 
  HardDrive 
} from 'lucide-react';
import { EnvironmentSpec, EnvironmentArtifact } from '../../types/fabric';

interface EnvironmentPanelProps {
  spec: EnvironmentSpec;
  artifact: EnvironmentArtifact;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({
  spec,
  artifact,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 space-y-6 text-slate-100 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Environment Compiler & Supply-Chain Security
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Separates source EnvironmentSpecID from signed OCI artifact digest. Environments are built on isolated CPU workers in parallel with compute acquisition.
        </p>
      </div>

      {/* Reproducibility Meter Card */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Supply-Chain Reproducibility Assessment
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {spec.reproducibilityScore}% Fully Pinned
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono">
                Deterministic
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 sm:text-right">
            <span>Detection Source: </span>
            <span className="text-cyan-400 font-semibold">{spec.detectionSource}</span>
            <span className="block text-[11px] text-slate-500">.devcontainer/devcontainer.json (Authoritative)</span>
          </div>
        </div>

        {/* Reproducibility checklist items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {spec.reproducibilityNotes.map((note, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300 leading-relaxed">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Part Artifact Contract Comparison (Section 6.5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EnvironmentSpecID (Source Truth) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>1. EnvironmentSpecID (Source Inputs)</span>
            </span>
            <span className="text-[10px] text-slate-500">Source Fingerprint</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Spec SHA256:</span>
              <span className="text-cyan-300 break-all">{spec.specId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Base Image:</span>
              <span className="text-slate-200">{spec.baseImage}</span>
              <span className="text-slate-400 text-[10px] block truncate">{spec.baseImageDigest}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Python Version:</span>
              <span className="text-slate-200">{spec.pythonVersion}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Hardware Compatibility Target:</span>
              <span className="text-amber-400">{spec.cudaRequirement}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dependency Lockfile:</span>
              <span className="text-emerald-400">{spec.dependencyLockfile}</span>
            </div>
          </div>
        </div>

        {/* EnvironmentArtifact (Built OCI Digest & Cosign) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2. EnvironmentArtifact (Signed OCI)</span>
            </span>
            <span className="text-[10px] text-emerald-400">Cosign Signed ✓</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Immutable Image Digest:</span>
              <span className="text-emerald-300 break-all">{artifact.imageDigest}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Cryptographic Signature:</span>
              <span className="text-slate-300 break-all">{artifact.signature}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SBOM Provenance (SLSA v1.0):</span>
              <span className="text-slate-300 truncate block">{artifact.provenance}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Build Plane Worker:</span>
              <span className="text-slate-200">Dedicated Isolated CPU Worker (BuildKit)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Build Time / Cache Layer:</span>
              <span className="text-cyan-400">{artifact.buildTimeSec}s ({artifact.cacheLayer} Registry Cache Hit)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Scan Results (Trivy & Secret Detection) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Trivy Vulnerability & Secret Scanning Report</span>
          </span>
          <span className="text-emerald-400 font-mono text-[11px]">
            Policy Passed: 0 High/Critical CVEs
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Critical CVEs</span>
            <span className="text-lg font-bold text-emerald-400">0</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">High CVEs</span>
            <span className="text-lg font-bold text-emerald-400">0</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Hardcoded Secrets</span>
            <span className="text-lg font-bold text-emerald-400">0</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Layer Cache</span>
            <span className="text-lg font-bold text-cyan-400">{artifact.cacheLayer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
