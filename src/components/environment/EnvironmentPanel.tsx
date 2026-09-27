import React from 'react';
import { CheckCircle2, ShieldCheck, FileCode } from 'lucide-react';
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
      {/* Header */}
      <div className="border-b border-[#282828] pb-2">
        <h1 className="text-[13px] font-semibold text-[#ffffff]">
          Environment Compiler & Supply-Chain Security
        </h1>
        <p className="text-[11px] text-[#777777] mt-0.5">
          Separates source EnvironmentSpecID from signed OCI artifact digest. Built on isolated CPU workers in parallel with compute acquisition.
        </p>
      </div>

      {/* Reproducibility Assessment */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide">
              Reproducibility Score:
            </span>
            <span className="text-sm font-bold font-mono text-[#4ec9b0]">
              {spec.reproducibilityScore}% Fully Pinned
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#666666]">
            Source: <strong className="text-[#a0a0a0]">{spec.detectionSource}</strong> (.devcontainer/devcontainer.json)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {spec.reproducibilityNotes.map((note, idx) => (
            <div key={idx} className="p-2 border border-[#222222] bg-[#141414] flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ec9b0] shrink-0 mt-0.5" />
              <span className="text-[#a0a0a0] leading-snug">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Part Separation: SpecID vs Signed OCI Artifact (Section 6.5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
        {/* EnvironmentSpecID */}
        <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
          <div className="flex items-center justify-between text-[#858585] border-b border-[#242424] pb-1">
            <span className="font-semibold text-[#ffffff]">1. EnvironmentSpecID (Source Inputs)</span>
            <span>Source Truth</span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div>
              <span className="text-[#555555] block">SPEC SHA256:</span>
              <span className="text-[#cccccc] break-all">{spec.specId}</span>
            </div>
            <div>
              <span className="text-[#555555] block">BASE IMAGE DIGEST:</span>
              <span className="text-[#cccccc] break-all">{spec.baseImageDigest}</span>
            </div>
            <div>
              <span className="text-[#555555] block">PYTHON:</span>
              <span className="text-[#cccccc]">{spec.pythonVersion}</span>
            </div>
            <div>
              <span className="text-[#555555] block">CUDA TARGET:</span>
              <span className="text-[#cca700]">{spec.cudaRequirement}</span>
            </div>
            <div>
              <span className="text-[#555555] block">LOCKFILE:</span>
              <span className="text-[#4ec9b0]">{spec.dependencyLockfile}</span>
            </div>
          </div>
        </div>

        {/* EnvironmentArtifact */}
        <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
          <div className="flex items-center justify-between text-[#858585] border-b border-[#242424] pb-1">
            <span className="font-semibold text-[#ffffff]">2. EnvironmentArtifact (Signed OCI)</span>
            <span className="text-[#4ec9b0]">Cosign Signed</span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div>
              <span className="text-[#555555] block">IMAGE DIGEST:</span>
              <span className="text-[#4ec9b0] break-all">{artifact.imageDigest}</span>
            </div>
            <div>
              <span className="text-[#555555] block">SIGNATURE:</span>
              <span className="text-[#858585] break-all">{artifact.signature}</span>
            </div>
            <div>
              <span className="text-[#555555] block">PROVENANCE:</span>
              <span className="text-[#858585] truncate block">{artifact.provenance}</span>
            </div>
            <div>
              <span className="text-[#555555] block">BUILD PLANE:</span>
              <span className="text-[#cccccc]">Isolated CPU Worker (BuildKit)</span>
            </div>
            <div>
              <span className="text-[#555555] block">BUILD TIME & CACHE:</span>
              <span className="text-[#0078d4]">{artifact.buildTimeSec}s ({artifact.cacheLayer} Cache Hit)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Scanning Report (Trivy) */}
      <div className="p-3 border border-[#282828] bg-[#181818] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#858585]">
          <span>TRIVY VULNERABILITY & SECRET SCAN REPORT</span>
          <span className="text-[#4ec9b0] font-mono text-[10px]">Policy Passed</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#555555] block">CRITICAL CVE</span>
            <span className="text-sm font-bold text-[#4ec9b0]">0</span>
          </div>
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#555555] block">HIGH CVE</span>
            <span className="text-sm font-bold text-[#4ec9b0]">0</span>
          </div>
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#555555] block">LEAKED SECRETS</span>
            <span className="text-sm font-bold text-[#4ec9b0]">0</span>
          </div>
          <div className="p-2 bg-[#141414] border border-[#222222]">
            <span className="text-[10px] text-[#555555] block">CACHE LAYER</span>
            <span className="text-sm font-bold text-[#0078d4]">{artifact.cacheLayer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
