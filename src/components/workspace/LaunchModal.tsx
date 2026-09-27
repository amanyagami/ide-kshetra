import React from 'react';
import { 
  X, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Zap,
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Launch Pipeline & Truthful All-Ready Gate
              </h2>
              <span className="text-[11px] text-slate-400">
                Idempotent compute acquisition and comprehensive 11-step readiness verification
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          {/* Status summary */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                error
                  ? 'bg-rose-500'
                  : isAllReady
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isLaunching
                  ? 'bg-cyan-400 animate-ping'
                  : 'bg-amber-400'
              }`} />
              <div>
                <span className="font-semibold text-white text-xs block">
                  {error 
                    ? 'Acquisition Interrupted by Typed Error' 
                    : isAllReady 
                    ? 'All-Ready Gate 100% Verified' 
                    : isLaunching 
                    ? 'Executing Pipeline Steps in Parallel...' 
                    : 'Ready to Launch'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {error ? error : `${passedCount} of ${readinessChecks.length} criteria satisfied`}
                </span>
              </div>
            </div>

            {isAllReady && (
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                TRUTHFUL READY
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                error ? 'bg-rose-500' : 'bg-cyan-400'
              }`}
              style={{ width: `${(passedCount / readinessChecks.length) * 100}%` }}
            />
          </div>

          {/* Live pipeline trace events */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Real-Time Trace & Telemetry Stream (Invariant I12)
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-[11px] text-slate-300">
              {events.length === 0 ? (
                <div className="text-slate-600">Waiting for pipeline trigger...</div>
              ) : (
                events.map(evt => (
                  <div key={evt.id} className="leading-relaxed">
                    <span className="text-slate-500">[{evt.timestamp.split('T')[1].slice(0, 8)}] </span>
                    <span className={`font-bold ${
                      evt.source === 'broker' ? 'text-cyan-400' :
                      evt.source === 'agent' ? 'text-emerald-400' :
                      evt.source === 'scheduler' ? 'text-indigo-400' : 'text-purple-400'
                    }`}>[{evt.source.toUpperCase()}] </span>
                    <span className={
                      evt.level === 'error' ? 'text-rose-400 font-bold' :
                      evt.level === 'warn' ? 'text-amber-400' :
                      evt.level === 'success' ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                    }>
                      {evt.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Verification Checklist Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Readiness Evidence Gate
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {readinessChecks.slice(0, 6).map(c => (
                <div key={c.id} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="truncate text-slate-300">{c.label}</span>
                  {c.status === 'passed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : c.status === 'running' ? (
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <span className="text-slate-600 text-[10px]">·</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Provider: GMI Cloud · NVIDIA H200 SXM · $3.19/hr
          </span>

          <div className="flex items-center gap-2">
            {!isAllReady ? (
              <button
                onClick={onLaunch}
                disabled={isLaunching}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-sans text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                {isLaunching ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Evidence...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Launch Pipeline</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => { onReadyComplete(); onClose(); }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
