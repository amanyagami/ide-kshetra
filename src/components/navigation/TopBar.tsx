import React from 'react';
import { 
  Play, 
  Terminal, 
  Layers, 
  Cpu, 
  Cloud, 
  ShieldCheck, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { NodeLease } from '../../types/fabric';

interface TopBarProps {
  activeView: 'workspace' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec';
  setActiveView: (view: 'workspace' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec') => void;
  lease: NodeLease | null;
  readinessReady: boolean;
  onLaunchClick: () => void;
  isLaunching: boolean;
  avatarUrl: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  lease,
  readinessReady,
  onLaunchClick,
  isLaunching,
  avatarUrl,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Zone 1: Single text element wordmark & breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <a 
          href="/" 
          onClick={(e) => { e.preventDefault(); setActiveView('workspace'); }}
          className="text-base font-bold tracking-tight text-white hover:text-cyan-400 transition-colors flex items-center gap-2 shrink-0"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-indigo-500 flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm">
            EF
          </div>
          <span>Execution Fabric</span>
        </a>
        <span className="text-slate-600 text-xs hidden sm:inline" aria-hidden="true">/</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
          <span className="text-slate-300 font-medium">aman@noahlabs.ai</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-mono truncate">gemma-agent-core</span>
          <span className="text-slate-500 hidden md:inline">· main</span>
        </div>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveView('workspace')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeView === 'workspace' 
              ? 'bg-slate-800/80 text-white font-semibold' 
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>Workspace</span>
        </button>

        <button
          onClick={() => setActiveView('compute')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeView === 'compute' 
              ? 'bg-slate-800/80 text-white font-semibold' 
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Compute Fleet</span>
        </button>

        <button
          onClick={() => setActiveView('environment')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeView === 'environment' 
              ? 'bg-slate-800/80 text-white font-semibold' 
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Environment & Build</span>
        </button>

        <button
          onClick={() => setActiveView('providers')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeView === 'providers' 
              ? 'bg-slate-800/80 text-white font-semibold' 
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          <span>Provider Access</span>
        </button>

        <button
          onClick={() => setActiveView('verification')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeView === 'verification' 
              ? 'bg-slate-800/80 text-white font-semibold' 
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Verification & Chaos</span>
        </button>

        <button
          onClick={() => setActiveView('spec')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeView === 'spec' 
              ? 'bg-slate-800/80 text-white font-semibold' 
              : 'hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>Architecture Spec</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions and status badge */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live readiness badge */}
        <div 
          onClick={() => setActiveView('workspace')}
          className={`cursor-pointer px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-2 border transition-all ${
            readinessReady
              ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300'
              : isLaunching
              ? 'bg-cyan-950/60 border-cyan-600/40 text-cyan-300 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            readinessReady 
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
              : isLaunching 
              ? 'bg-cyan-400' 
              : 'bg-amber-400'
          }`} />
          <span className="whitespace-nowrap font-medium">
            {readinessReady ? (
              `${lease?.provider.name || 'GMI Cloud'} · ${lease?.capabilities.gpuModel || 'H200'} (READY)`
            ) : isLaunching ? (
              'VERIFYING ALL READY GATE...'
            ) : (
              'STANDBY · CONFIGURE'
            )}
          </span>
        </div>

        {/* Launch button */}
        <button
          onClick={onLaunchClick}
          disabled={isLaunching}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm ${
            isLaunching
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : readinessReady
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/30'
          }`}
        >
          {isLaunching ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Verifying...</span>
            </>
          ) : readinessReady ? (
            <>
              <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Re-Test Ready</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch GPU Workspace</span>
            </>
          )}
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full border border-slate-700 overflow-hidden bg-slate-800 shrink-0">
          <img 
            src={avatarUrl} 
            alt="Engineer Avatar" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};
