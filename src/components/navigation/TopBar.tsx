import React from 'react';
import { 
  Play, 
  RotateCw, 
  Search, 
  PanelLeft, 
  PanelBottom, 
  PanelRight, 
  Cloud, 
  FolderGit2, 
  UserCheck 
} from 'lucide-react';
import { NodeLease, UserSession } from '../../types/fabric';

interface TopBarProps {
  activeView: 'workspace' | 'gcp' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec';
  setActiveView: (view: 'workspace' | 'gcp' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec') => void;
  lease: NodeLease | null;
  readinessReady: boolean;
  onLaunchClick: () => void;
  isLaunching: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showBottomPanel: boolean;
  onToggleBottomPanel: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onOpenAuthModal: () => void;
  onOpenBindingModal: () => void;
  session: UserSession;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  lease,
  readinessReady,
  onLaunchClick,
  isLaunching,
  showSidebar,
  onToggleSidebar,
  showBottomPanel,
  onToggleBottomPanel,
  showInspector,
  onToggleInspector,
  onOpenAuthModal,
  onOpenBindingModal,
  session,
}) => {
  return (
    <header className="h-[35px] bg-[#141414] border-b border-[#282828] px-2.5 flex items-center justify-between select-none text-[12px] text-[#8c8c8c] shrink-0 z-20">
      {/* Left: Window Controls / App Wordmark & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div 
          onClick={() => setActiveView('workspace')}
          className="flex items-center gap-2 text-[#cccccc] font-medium shrink-0 cursor-pointer"
        >
          <span className="w-3.5 h-3.5 rounded-sm bg-[#242424] border border-[#333333] flex items-center justify-center text-[9px] font-mono text-[#0078d4] font-bold">
            EF
          </span>
          <span className="text-[12px] tracking-tight text-[#d4d4d4] font-semibold">Kshetra</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[#5a5a5a] text-[11px] truncate">
          <span className="text-[#8c8c8c] hover:text-white cursor-pointer" onClick={onOpenAuthModal}>
            {session.user ? session.user.email : 'Sign in'}
          </span>
          <span>/</span>
          <span className="text-[#a0a0a0]">amanyagami/ide-kshetra</span>
          <span>/</span>
          <span className="text-[#d4d4d4]">main</span>
        </div>

        {/* Quick Nav Shortcut to GCP VMs */}
        <button
          onClick={() => setActiveView('gcp')}
          className={`h-[22px] px-2 rounded-sm text-[11px] flex items-center gap-1 border transition-colors ${
            activeView === 'gcp'
              ? 'bg-[#1e1e1e] border-[#0078d4] text-white'
              : 'bg-[#181818] border-[#2b2b2b] text-[#8c8c8c] hover:text-[#cccccc]'
          }`}
          title="View and connect Google Cloud Platform running VMs"
        >
          <Cloud className="w-3 h-3 text-[#0078d4]" />
          <span>GCP VMs ({session.connections.gcp.discoveredVmsCount})</span>
        </button>

        {/* Bind Workspace Wizard Shortcut */}
        <button
          onClick={onOpenBindingModal}
          className="h-[22px] px-2 rounded-sm bg-[#181818] hover:bg-[#222222] border border-[#2b2b2b] text-[#8c8c8c] hover:text-[#cccccc] text-[11px] flex items-center gap-1 transition-colors"
          title="Bind GitHub Repo + GCP VM = Workspace"
        >
          <FolderGit2 className="w-3 h-3 text-[#4ec9b0]" />
          <span>Bind Workspace</span>
        </button>
      </div>

      {/* Center: Command Palette / Search Trigger */}
      <div className="flex-1 max-w-sm mx-4 hidden lg:block">
        <div 
          onClick={onOpenBindingModal}
          className="w-full h-[22px] bg-[#1e1e1e] hover:bg-[#252525] border border-[#2b2b2b] rounded-sm px-2 flex items-center gap-1.5 text-[11px] text-[#6e6e6e] cursor-pointer transition-colors"
        >
          <Search className="w-3 h-3 text-[#666666] shrink-0" />
          <span className="truncate">amanyagami/ide-kshetra on gcp-h100-trainer-01 (⌘P)</span>
        </div>
      </div>

      {/* Right: Status, Launch CTA & Layout Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* User Identity / Session Badge */}
        <button
          onClick={onOpenAuthModal}
          className="h-[22px] px-2 rounded-sm bg-[#181818] border border-[#2b2b2b] hover:border-[#383838] flex items-center gap-1.5 text-[11px] text-[#aaaaaa] transition-colors"
          title="Manage user session & cloud connection credentials"
        >
          <UserCheck className="w-3 h-3 text-[#0078d4]" />
          <span className="truncate max-w-[110px] hidden sm:inline">
            {session.user ? session.user.email.split('@')[0] : 'Sign In'}
          </span>
        </button>

        {/* Status chip */}
        <div 
          onClick={() => setActiveView('workspace')}
          className="h-[22px] px-2 rounded-sm bg-[#1a1a1a] border border-[#2b2b2b] flex items-center gap-1.5 text-[11px] font-mono text-[#a0a0a0] cursor-pointer hover:border-[#383838] transition-colors"
          title="Click to view workspace readiness"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            readinessReady ? 'bg-[#4ec9b0]' : isLaunching ? 'bg-[#0078d4] animate-pulse' : 'bg-[#cca700]'
          }`} />
          <span className="truncate">
            {readinessReady 
              ? `${lease?.provider.name || 'GCP VM'} · Ready`
              : isLaunching 
              ? 'Verifying...' 
              : 'Standby'}
          </span>
        </div>

        {/* Primary Action Button (Launch / Re-Test) */}
        <button
          onClick={onLaunchClick}
          disabled={isLaunching}
          className={`h-[22px] px-2.5 rounded-sm text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
            isLaunching
              ? 'bg-[#252525] text-[#6e6e6e] cursor-not-allowed'
              : readinessReady
              ? 'bg-[#242424] hover:bg-[#2e2e2e] text-[#cccccc] border border-[#333333]'
              : 'bg-[#0078d4] hover:bg-[#006bbd] text-white'
          }`}
        >
          {isLaunching ? (
            <>
              <RotateCw className="w-3 h-3 animate-spin text-[#8c8c8c]" />
              <span>Verifying</span>
            </>
          ) : readinessReady ? (
            <>
              <RotateCw className="w-3 h-3 text-[#8c8c8c]" />
              <span>Re-Test</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Launch</span>
            </>
          )}
        </button>

        {/* Layout Toggles */}
        <div className="flex items-center border-l border-[#282828] pl-2 gap-0.5 text-[#6e6e6e]">
          <button
            onClick={onToggleSidebar}
            className={`p-1 hover:text-[#cccccc] rounded-sm transition-colors ${showSidebar ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}
            title="Toggle Primary Sidebar (Ctrl+B)"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleBottomPanel}
            className={`p-1 hover:text-[#cccccc] rounded-sm transition-colors ${showBottomPanel ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}
            title="Toggle Bottom Terminal (Ctrl+`)"
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleInspector}
            className={`p-1 hover:text-[#cccccc] rounded-sm transition-colors ${showInspector ? 'text-[#a0a0a0]' : 'text-[#4d4d4d]'}`}
            title="Toggle Right Inspector"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
