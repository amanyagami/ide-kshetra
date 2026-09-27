import React from 'react';
import { 
  X, 
  RotateCw, 
  Check, 
  Play, 
  ArrowRight
} from 'lucide-react';
import { TraceEvent, ReadinessCheck } from '../../types/fabric';

interface LaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLaunching: boolean;
  events: TraceEvent[];
  readinessChecks: ReadinessCheck[];
  error: string | null;
  onLaunch: () => void;
  onReadyComplete: () => void;
}

export const LaunchModal: React.FC<LaunchModalProps> = ({
  isOpen,
  onClose,
  isLaunching,
  events,
  readinessChecks,
  error,
  onLaunch,
  onReadyComplete,
}) => {
  if (!isOpen) return null;

  const passedCount = readinessChecks.filter(c => c.status === 'passed').length;
  const isAllReady = passedCount === readinessChecks.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/70 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#1e1e1e] border border-[#2b2b2b] shadow-2xl flex flex-col max-h-[80vh] text-[#cccccc] text-[12px]">
        {/* Header */}
        <div className="h-[36px] px-3 border-b border-[#282828] bg-[#181818] flex items-center justify-between">
          <span className="font-semibold text-[#ffffff] text-[12px]">
            Launch Pipeline & Truthful All-Ready Gate
          </span>

          <button
            onClick={onClose}
            className="p-1 hover:text-white text-[#666666] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 font-mono text-[11px]">
          {/* Status Bar */}
          <div className="p-2.5 bg-[#141414] border border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                error
                  ? 'bg-[#f14c4c]'
                  : isAllReady
                  ? 'bg-[#4ec9b0]'
                  : isLaunching
                  ? 'bg-[#0078d4] animate-pulse'
                  : 'bg-[#cca700]'
              }`} />
              <div>
                <span className="font-semibold text-white block">
                  {error 
                    ? 'Acquisition Interrupted' 
                    : isAllReady 
                    ? 'All-Ready Gate 100% Verified' 
                    : isLaunching 
                    ? 'Verifying Pipeline Steps...' 
                    : 'Ready to Launch'}
                </span>
                <span className="text-[10px] text-[#777777]">
                  {error ? error : `${passedCount} of ${readinessChecks.length} criteria satisfied`}
                </span>
              </div>
            </div>

            {isAllReady && (
              <span className="text-[#4ec9b0] text-[10px] font-bold">
                READY
              </span>
            )}
          </div>

          {/* Linear Progress */}
          <div className="w-full bg-[#141414] h-[3px]">
            <div 
              className={`h-full transition-all duration-300 ${
                error ? 'bg-[#f14c4c]' : 'bg-[#0078d4]'
              }`}
              style={{ width: `${(passedCount / readinessChecks.length) * 100}%` }}
            />
          </div>

          {/* Trace Log Box */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#666666] uppercase tracking-wider block">
              Trace Telemetry Stream (Invariant I12)
            </span>
            <div className="p-2 bg-[#141414] border border-[#242424] max-h-44 overflow-y-auto space-y-0.5 text-[10px] leading-relaxed select-text">
              {events.length === 0 ? (
                <div className="text-[#555555]">Waiting for pipeline trigger...</div>
              ) : (
                events.map(evt => (
                  <div key={evt.id}>
                    <span className="text-[#555555]">[{evt.timestamp.split('T')[1].slice(0, 8)}] </span>
                    <span className="text-[#569cd6]">[{evt.source.toUpperCase()}] </span>
                    <span className={
                      evt.level === 'error' ? 'text-[#f14c4c] font-bold' :
                      evt.level === 'warn' ? 'text-[#cca700]' :
                      evt.level === 'success' ? 'text-[#4ec9b0]' : 'text-[#888888]'
                    }>
                      {evt.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {readinessChecks.slice(0, 6).map(c => (
              <div key={c.id} className="p-1.5 bg-[#141414] border border-[#222222] flex items-center justify-between gap-1.5">
                <span className="truncate text-[#888888]">{c.label}</span>
                {c.status === 'passed' ? (
                  <Check className="w-3.5 h-3.5 text-[#4ec9b0] stroke-[2.5] shrink-0" />
                ) : c.status === 'running' ? (
                  <RotateCw className="w-3 h-3 text-[#0078d4] animate-spin shrink-0" />
                ) : (
                  <span className="text-[#444444]">·</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-[40px] px-3 border-t border-[#282828] bg-[#181818] flex items-center justify-between text-[11px]">
          <span className="text-[#555555] font-mono text-[10px]">
            GMI Cloud · H200 SXM · $3.19/h
          </span>

          <div className="flex items-center gap-1.5">
            {!isAllReady ? (
              <button
                onClick={onLaunch}
                disabled={isLaunching}
                className="h-[24px] px-3 bg-[#0078d4] hover:bg-[#006bbd] disabled:opacity-40 text-white rounded-sm text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                {isLaunching ? (
                  <>
                    <RotateCw className="w-3 h-3 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Start Pipeline</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => { onReadyComplete(); onClose(); }}
                className="h-[24px] px-3 bg-[#242424] hover:bg-[#2e2e2e] border border-[#333333] text-[#ffffff] rounded-sm text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
