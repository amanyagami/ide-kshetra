import React from 'react';
import { 
  Files, 
  Cpu, 
  Layers, 
  Server, 
  ShieldCheck, 
  FileCode2, 
  Settings, 
  UserCircle2 
} from 'lucide-react';

interface ActivityBarProps {
  activeView: 'workspace' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec';
  setActiveView: (view: 'workspace' | 'compute' | 'environment' | 'providers' | 'verification' | 'spec') => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  setActiveView,
}) => {
  const navItems: { id: ActivityBarProps['activeView']; label: string; icon: React.ReactNode }[] = [
    { id: 'workspace', label: 'Explorer (Ctrl+Shift+E)', icon: <Files className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'compute', label: 'Compute Fleet & Broker', icon: <Cpu className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'environment', label: 'Environment & BuildKit', icon: <Layers className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'providers', label: 'Cloud Providers & WIF', icon: <Server className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'verification', label: 'Verification & Chaos Suite', icon: <ShieldCheck className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'spec', label: 'Architecture & Protobuf Spec', icon: <FileCode2 className="w-5 h-5 stroke-[1.5]" /> },
  ];

  return (
    <aside className="w-[48px] bg-[#141414] border-r border-[#242424] flex flex-col justify-between items-center py-1 select-none shrink-0 z-10">
      {/* Top primary activity icons */}
      <div className="flex flex-col items-center w-full gap-1">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full h-11 flex items-center justify-center relative transition-colors ${
                isActive
                  ? 'text-[#ffffff] bg-[#181818]'
                  : 'text-[#666666] hover:text-[#999999]'
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#0078d4]" />
              )}
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center w-full gap-1 text-[#666666]">
        <button
          onClick={() => setActiveView('providers')}
          className="w-full h-10 flex items-center justify-center hover:text-[#999999] transition-colors"
          title="Account: aman@noahlabs.ai"
        >
          <UserCircle2 className="w-5 h-5 stroke-[1.5]" />
        </button>
        <button
          onClick={() => setActiveView('spec')}
          className="w-full h-10 flex items-center justify-center hover:text-[#999999] transition-colors"
          title="Settings & Invariants"
        >
          <Settings className="w-5 h-5 stroke-[1.5]" />
        </button>
      </div>
    </aside>
  );
};
