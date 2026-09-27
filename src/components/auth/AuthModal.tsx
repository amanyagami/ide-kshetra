import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  LogIn, 
  LogOut, 
  Mail, 
  ShieldCheck, 
  Github, 
  Cloud, 
  CheckCircle2, 
  Building2, 
  Key 
} from 'lucide-react';
import { UserSession } from '../../types/fabric';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onLogin: (email: string, name?: string, organization?: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  session,
  onLogin,
  onLogout,
}) => {
  const [email, setEmail] = useState<string>(session.user?.email || 'aman@noahlabs.ai');
  const [name, setName] = useState<string>(session.user?.name || 'Aman (NoahLabs)');
  const [org, setOrg] = useState<string>(session.user?.organization || 'noahlabs.ai');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, name, org);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await onLogout();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/70 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#1e1e1e] border border-[#2b2b2b] shadow-2xl flex flex-col text-[#cccccc] text-[12px]">
        {/* Header */}
        <div className="h-[36px] px-3.5 border-b border-[#282828] bg-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-[#0078d4]" />
            <span className="font-semibold text-white text-[12px]">
              User Session & Cloud Authorization
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-white text-[#666666] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {session.isAuthenticated && session.user ? (
            <div className="space-y-3.5">
              {/* Active Profile Info */}
              <div className="p-3 bg-[#161616] border border-[#262626] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#333333] overflow-hidden bg-[#222222] shrink-0">
                  <img 
                    src={session.user.avatarUrl} 
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-[13px] truncate">
                      {session.user.name}
                    </span>
                    <span className="text-[10px] text-[#4ec9b0] font-mono">
                      ACTIVE
                    </span>
                  </div>
                  <span className="text-[#888888] text-[11px] block truncate font-mono">
                    {session.user.email}
                  </span>
                  <span className="text-[#666666] text-[10px] block mt-0.5">
                    Org: {session.user.organization} · Role: {session.user.role}
                  </span>
                </div>
              </div>

              {/* Two Independent Connections Status */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider block">
                  Connected Cloud Systems (Section 1)
                </span>

                {/* Connection B: Google Cloud */}
                <div className="p-2.5 bg-[#141414] border border-[#242424] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-[#0078d4]" />
                    <div>
                      <span className="text-[#ffffff] font-medium block">Google Cloud Platform</span>
                      <span className="text-[10px] text-[#888888]">
                        {session.connections.gcp.connected 
                          ? `${session.connections.gcp.discoveredProjectsCount} projects · ${session.connections.gcp.discoveredVmsCount} VMs discovered`
                          : 'Not authorized'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                    session.connections.gcp.connected
                      ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]'
                      : 'border-[#333333] text-[#777777]'
                  }`}>
                    {session.connections.gcp.connected ? 'WIF Active' : 'Disconnected'}
                  </span>
                </div>

                {/* Connection A: GitHub App */}
                <div className="p-2.5 bg-[#141414] border border-[#242424] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-[#cccccc]" />
                    <div>
                      <span className="text-[#ffffff] font-medium block">GitHub App (@amanyagami)</span>
                      <span className="text-[10px] text-[#888888]">
                        {session.connections.github.connected 
                          ? `${session.connections.github.authorizedReposCount} repos authorized (ide-kshetra, gemma)`
                          : 'Not installed'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                    session.connections.github.connected
                      ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]'
                      : 'border-[#333333] text-[#777777]'
                  }`}>
                    {session.connections.github.connected ? 'Installed' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Logout Action */}
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full h-[28px] bg-[#242424] hover:bg-[#2c2c2c] border border-[#333333] text-[#cccccc] rounded-sm text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3 h-3 text-[#f14c4c]" />
                <span>Sign Out of Session</span>
              </button>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-[11px] text-[#888888] leading-relaxed">
                Enter your identity email to authenticate and discover existing Google Cloud VMs and authorized GitHub repositories.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777777] uppercase font-mono block">Work Email</label>
                <div className="flex items-center bg-[#141414] border border-[#2b2b2b] px-2 h-[28px]">
                  <Mail className="w-3.5 h-3.5 text-[#555555] mr-2 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aman@noahlabs.ai"
                    className="w-full bg-transparent text-[#ffffff] font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777777] uppercase font-mono block">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aman (NoahLabs)"
                  className="w-full bg-[#141414] border border-[#2b2b2b] px-2 h-[28px] text-[#ffffff] font-mono text-[11px] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777777] uppercase font-mono block">Organization</label>
                <div className="flex items-center bg-[#141414] border border-[#2b2b2b] px-2 h-[28px]">
                  <Building2 className="w-3.5 h-3.5 text-[#555555] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="noahlabs.ai"
                    className="w-full bg-transparent text-[#ffffff] font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[30px] bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Signing in...' : 'Sign In with Identity'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
