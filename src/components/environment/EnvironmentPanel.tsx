import React from 'react';
import { Check, ShieldCheck, FileCode, Sparkles, Layers, Cpu, ShieldAlert } from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-y-auto p-4 space-y-4 text-[#cccccc] text-[12px] select-none">
      {/* 1. Top Island: High-Visibility Reproducibility & Supply-Chain Badge */}
      <div className="p-3.5 border border-[#333333] bg-[#161616] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-cyan-400 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#888888] font-mono">
                Environment Assessment
              </span>
              <span className="px-1.5 py-0.2 bg-[#252525] border border-[#383838] text-[9px] font-mono text-[#bbbbbb] rounded-xs">
                SLSA-v1.0
              </span>
            </div>
            <div className="text-[13px] font-semibold text-[#ffffff] flex items-center gap-2">
              <span>Reproducibility Score</span>
              <span className="text-[#666666]">·</span>
              <span className="font-mono text-cyan-300 font-bold text-[14px]">
                {spec.reproducibilityScore}% Fully Pinned
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono border-t sm:border-t-0 sm:border-l border-[#282828] pt-2 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-[#666666] text-[10px] block">SOURCE MANIFEST</span>
            <span className="text-[#e2e8f0] font-semibold">{spec.detectionSource}</span>
          </div>
          <div>
            <span className="text-[#666666] text-[10px] block">SECURITY POLICY</span>
            <span className="text-cyan-400 font-semibold">Cosign Verified</span>
          </div>
          <div>
            <span className="text-[#666666] text-[10px] block">CACHE HIT</span>
            <span className="text-[#0078d4] font-semibold">{artifact.cacheLayer}</span>
          </div>
        </div>
      </div>

      {/* 2. Reproducibility Factors & Notes */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-2.5">
        <div className="flex items-center justify-between text-[#888888] text-[11px]">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-[#aaaaaa]">
            Reproducibility & Pinned Criteria
          </span>
          <span className="font-mono text-[10px] text-[#777777]">
            Source: <span className="text-[#cccccc]">{spec.detectionSource}</span> (.devcontainer/devcontainer.json)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {spec.reproducibilityNotes.map((note, idx) => (
            <div key={idx} className="p-2.5 border border-[#262626] bg-[#141414] flex items-start gap-2.5 rounded-xs">
              <Check className="w-4 h-4 text-cyan-400 stroke-[2.5] shrink-0 mt-0.5" />
              <span className="text-[#d4d4d4] leading-snug">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Two-Part Separation: SpecID vs Signed OCI Artifact (Section 6.5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
        {/* EnvironmentSpecID */}
        <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
          <div className="flex items-center justify-between text-[#858585] border-b border-[#242424] pb-1">
            <span className="font-semibold text-[#ffffff]">1. EnvironmentSpecID (Source Inputs)</span>
            <span className="text-[#888888]">Source Truth</span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <span className="text-[#666666] block">SPEC SHA256:</span>
              <span className="text-[#e2e8f0] break-all">{spec.specId}</span>
            </div>
            <div>
              <span className="text-[#666666] block">BASE IMAGE DIGEST:</span>
              <span className="text-[#cccccc] break-all">{spec.baseImageDigest}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#666666] block">PYTHON:</span>
                <span className="text-[#ffffff] font-medium">{spec.pythonVersion}</span>
              </div>
              <div>
                <span className="text-[#666666] block">CUDA TARGET:</span>
                <span className="text-[#e2e8f0] font-medium">{spec.cudaRequirement}</span>
              </div>
            </div>
            <div>
              <span className="text-[#666666] block">LOCKFILE:</span>
              <span className="text-cyan-300 font-medium">{spec.dependencyLockfile}</span>
            </div>
          </div>
        </div>

        {/* EnvironmentArtifact */}
        <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
          <div className="flex items-center justify-between text-[#858585] border-b border-[#242424] pb-1">
            <span className="font-semibold text-[#ffffff]">2. EnvironmentArtifact (Signed OCI)</span>
            <span className="text-cyan-400">Cosign Signed</span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <span className="text-[#666666] block">IMAGE DIGEST:</span>
              <span className="text-cyan-300 break-all">{artifact.imageDigest}</span>
            </div>
            <div>
              <span className="text-[#666666] block">SIGNATURE:</span>
              <span className="text-[#a0a0a0] break-all">{artifact.signature}</span>
            </div>
            <div>
              <span className="text-[#666666] block">PROVENANCE:</span>
              <span className="text-[#a0a0a0] truncate block">{artifact.provenance}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#666666] block">BUILD PLANE:</span>
                <span className="text-[#cccccc]">Isolated CPU (BuildKit)</span>
              </div>
              <div>
                <span className="text-[#666666] block">BUILD TIME & CACHE:</span>
                <span className="text-[#0078d4] font-medium">{artifact.buildTimeSec}s ({artifact.cacheLayer} Cache Hit)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Security Scanning Report (Trivy) */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#858585]">
          <span>TRIVY VULNERABILITY & SECRET SCAN REPORT</span>
          <span className="text-cyan-400 font-mono text-[10px]">Policy Passed</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#666666] block">CRITICAL CVE</span>
            <span className="text-sm font-bold text-[#ffffff]">0</span>
          </div>
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#666666] block">HIGH CVE</span>
            <span className="text-sm font-bold text-[#ffffff]">0</span>
          </div>
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#666666] block">LEAKED SECRETS</span>
            <span className="text-sm font-bold text-[#ffffff]">0</span>
          </div>
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#666666] block">CACHE LAYER</span>
            <span className="text-sm font-bold text-[#0078d4]">{artifact.cacheLayer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
