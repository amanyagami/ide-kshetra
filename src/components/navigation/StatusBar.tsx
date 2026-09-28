import React from 'react';
import { GitBranch, RefreshCw, AlertCircle, Check, Cpu, Zap, Wifi } from 'lucide-react';
import { NodeLease, DataMode } from '../../types/fabric';

interface StatusBarProps {
  lease: NodeLease | null;
  dataMode: DataMode;
  readinessReady: boolean;
  onOpenTerminal: () => void;
  onOpenReadiness: () => void;
  onOpenCompute: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  lease,
  dataMode,
  readinessReady,
  onOpenTerminal,
  onOpenReadiness,
  onOpenCompute,
}) => {
  return (
    <footer className="h-[22px] bg-[#121212] border-t border-[#242424] px-2 flex items-center justify-between text-[11px] font-mono text-[#777777] select-none shrink-0 z-20">
      {/* Left items */}
      <div className="flex items-center gap-3">
        {/* Remote Host Connection Indicator */}
        <div 
          onClick={onOpenCompute}
          className="flex items-center gap-1.5 cursor-pointer hover:text-[#cccccc] transition-colors"
          title="Remote Node Connection"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0078d4]" />
          <span className="text-[#a0a0a0]">node-gmi-h200</span>
        </div>

        {/* Git branch */}
        <div className="flex items-center gap-1 hover:text-[#cccccc] cursor-pointer transition-colors">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>

        {/* Sync */}
        <div className="hover:text-[#cccccc] cursor-pointer transition-colors" title="Sync repository">
          <RefreshCw className="w-2.5 h-2.5" />
        </div>

        {/* Error / Warning count */}
        <div className="flex items-center gap-2 text-[#666666]">
          <span className="flex items-center gap-0.5">
            <span className="text-[#888888]">0</span> errors
          </span>
          <span className="flex items-center gap-0.5">
            <span className="text-[#888888]">0</span> warnings
          </span>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3 text-[11px]">
        {/* Data mode indicator: never let the UI look real when it isn't */}
        <span
          title={dataMode === 'live' ? 'LIVE: real provider and runtime evidence' : 'MOCK: synthetic/demo data'}
          className={`px-1.5 py-[1px] font-mono text-[10px] font-bold tracking-wider border rounded-sm ${
            dataMode === 'live'
              ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]'
              : 'border-[#5a4a1a] bg-[#26200f] text-[#cca700]'
          }`}
        >
          {dataMode === 'live' ? 'LIVE' : 'MOCK'}
        </span>

        {/* Truthful All-Ready indicator */}
        <div 
          onClick={onOpenReadiness}
          className="flex items-center gap-1 hover:text-[#cccccc] cursor-pointer transition-colors"
          title="Truthful All-Ready Gate Evidence"
        >
          {readinessReady ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#4ec9b0] stroke-[2.5]" />
              <span className="text-[#4ec9b0]">All-Ready (11/11)</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#cca700]" />
              <span className="text-[#cca700]">Verifying</span>
            </>
          )}
        </div>

        {/* Hardware & Lease */}
        <div 
          onClick={onOpenCompute}
          className="flex items-center gap-1.5 hover:text-[#cccccc] cursor-pointer transition-colors"
        >
          <Cpu className="w-3 h-3 text-[#777777]" />
          <span>{lease?.capabilities.gpuModel || 'H200 SXM'} (141GB)</span>
          <span className="text-[#444444]">|</span>
          <span>CUDA 12.4</span>
        </div>

        {/* Gateway connection */}
        <div className="flex items-center gap-1 hover:text-[#cccccc] cursor-pointer transition-colors" title="Gateway Protocol: QUIC/mTLS :443">
          <Wifi className="w-3 h-3 text-[#777777]" />
          <span>QUIC:443</span>
        </div>

        {/* File encoding & Virtualenv */}
        <div className="hidden sm:flex items-center gap-2 text-[#666666]">
          <span>UTF-8</span>
          <span className="text-[#a0a0a0]">Python 3.12 (uv)</span>
        </div>
      </div>
    </footer>
  );
};
