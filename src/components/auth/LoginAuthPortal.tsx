import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LogIn, 
  CheckCircle2, 
  Cloud, 
  Github, 
  Lock, 
  Key, 
  Building2, 
  Mail, 
  Cpu, 
  Layers, 
  ArrowRight,
  Eye,
  EyeOff,
  Terminal,
  Activity,
  ChevronRight,
  FileCode
} from 'lucide-react';
import { UserSession, GcpProject } from '../../types/fabric';

interface LoginAuthPortalProps {
  onLogin: (email: string, name?: string, organization?: string, role?: string, targetProjectId?: string) => Promise<void>;
  projects: GcpProject[];
  onBypassToWorkspace?: () => void;
}

export const LoginAuthPortal: React.FC<LoginAuthPortalProps> = ({
  onLogin,
  projects,
  onBypassToWorkspace,
}) => {
  const [email, setEmail] = useState<string>('aman@noahlabs.ai');
  const [password, setPassword] = useState<string>('••••••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>('Aman (NoahLabs)');
  const [org, setOrg] = useState<string>('noahlabs.ai');
  const [role, setRole] = useState<'owner' | 'ml_engineer' | 'viewer'>('owner');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('noahlabs-ai-prod');
  const [showClaimsInspector, setShowClaimsInspector] = useState<boolean>(false);

  // Authorization handshake pipeline state
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<number>(0);
  const [authLogs, setAuthLogs] = useState<string[]>([]);

  const presets = [
    {
      label: 'Lead ML Architect (Owner)',
      email: 'aman@noahlabs.ai',
      name: 'Aman (NoahLabs)',
      org: 'noahlabs.ai',
      role: 'owner' as const,
      project: 'noahlabs-ai-prod',
      desc: 'Full access to 8x H100 Hopper nodes, IAP tunneling, start/stop/create VMs',
    },
    {
      label: 'Systems Engineer',
      email: 'engineer@noahlabs.ai',
      name: 'Devon Lee',
      org: 'noahlabs.ai',
      role: 'ml_engineer' as const,
      project: 'noahlabs-ai-prod',
      desc: 'Execute workloads, connect to running VMs, view live telemetry',
    },
    {
      label: 'Security Auditor (Viewer)',
      email: 'auditor@noahlabs.ai',
      name: 'Security Ops',
      org: 'noahlabs.ai',
      role: 'viewer' as const,
      project: 'ml-experiments-gpu',
      desc: 'Read-only audit of running VMs, IAP access logs, telemetry streams',
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setEmail(p.email);
    setName(p.name);
    setOrg(p.org);
    setRole(p.role);
    setSelectedProjectId(p.project);
  };

  const handleAuthorize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setAuthStep(1);
    setAuthLogs(['[00:00.012] Initializing identity authentication for ' + email]);

    // Simulated authentic authorization handshake sequence
    setTimeout(() => {
      setAuthStep(2);
      setAuthLogs(prev => [
        ...prev,
        `[00:00.180] HMAC-SHA256 signature verified against kshetra-auth provider.`,
        `[00:00.240] Workload Identity Federation (WIF) exchange with GCP STS:`,
        `            Pool: //iam.googleapis.com/projects/459758149151/locations/global/workloadIdentityPools/kshetra-pool`,
      ]);
    }, 450);

    setTimeout(() => {
      setAuthStep(3);
      setAuthLogs(prev => [
        ...prev,
        `[00:00.520] Querying GCP IAM roles: roles/compute.instanceAdmin.v1 and roles/iap.tunnelResourceAccessor.`,
        `[00:00.610] Permissions validated for role [${role.toUpperCase()}]. Scopes: compute, storage, cloud-platform.`,
      ]);
    }, 900);

    setTimeout(() => {
      setAuthStep(4);
      setAuthLogs(prev => [
        ...prev,
        `[00:00.890] Executing instances.aggregatedList for project [${selectedProjectId}]...`,
        `[00:00.980] Discovered Compute Engine fleet: H100 SXM5, H100 NVL, L4, A100 nodes online.`,
        `[00:01.050] Connecting GitHub App repository authorization for @amanyagami.`,
      ]);
    }, 1350);

    setTimeout(async () => {
      setAuthStep(5);
      setAuthLogs(prev => [
        ...prev,
        `[00:01.210] [SUCCESS] Identity session token generated. Authorization granted.`,
      ]);

      try {
        await onLogin(email, name, org, role, selectedProjectId);
      } catch (err) {
        console.error('Login error:', err);
      } finally {
        setIsAuthenticating(false);
      }
    }, 1800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] p-4 text-[#cccccc] text-[12px] select-none overflow-y-auto">
      <div className="w-full max-w-[820px] bg-[#181818] border border-[#282828] shadow-2xl flex flex-col my-auto">
        {/* Top Header Strip */}
        <div className="h-[42px] px-4 border-b border-[#282828] bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-sm bg-[#222222] border border-[#333333] flex items-center justify-center text-[10px] font-mono text-[#0078d4] font-bold">
              EF
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-[13px] tracking-tight">Execution Fabric</span>
              <span className="text-[#555555]">/</span>
              <span className="text-[11px] text-[#888888] font-mono">Identity & Cloud Authorization Gate</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 border border-[#23583a] bg-[#14261c] text-[#4ec9b0] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0] animate-pulse" />
              <span>GCP WIF Connected</span>
            </span>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#282828]">
          {/* Left Column: Fast Test Presets & Cloud Status (5 cols) */}
          <div className="md:col-span-5 p-5 bg-[#141414]/50 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#666666] tracking-wider block font-semibold">
                  Test Identity Profiles
                </span>
                <p className="text-[11px] text-[#888888] mt-1 leading-relaxed">
                  Select a test identity or enter your credentials to test authentication and discover running cloud VMs.
                </p>
              </div>

              {/* Presets List */}
              <div className="space-y-2">
                {presets.map(p => {
                  const isSelected = email === p.email;
                  return (
                    <div
                      key={p.email}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2.5 border rounded-sm cursor-pointer transition-colors text-left ${
                        isSelected 
                          ? 'border-[#0078d4] bg-[#1e1e1e]' 
                          : 'border-[#282828] bg-[#161616] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-white truncate">{p.label}</span>
                        <span className={`text-[9px] font-mono px-1 py-0.2 border ${
                          p.role === 'owner' 
                            ? 'border-[#0078d4] text-[#0078d4]' 
                            : 'border-[#333333] text-[#888888]'
                        }`}>
                          {p.role.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#858585] font-mono block mt-0.5">{p.email}</span>
                      <span className="text-[10px] text-[#666666] block mt-1 leading-tight">{p.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cloud Summary Pill */}
            <div className="p-3 bg-[#161616] border border-[#242424] space-y-2 text-[10px] font-mono">
              <span className="text-[#555555] uppercase block font-semibold">GCP Compute Fleet Ready</span>
              <div className="flex items-center justify-between text-[#888888]">
                <span>Discovered Projects:</span>
                <span className="text-white">3 Projects</span>
              </div>
              <div className="flex items-center justify-between text-[#888888]">
                <span>Active Running VMs:</span>
                <span className="text-[#4ec9b0] font-semibold">4 Instances Online</span>
              </div>
              <div className="flex items-center justify-between text-[#888888]">
                <span>Active Silicon:</span>
                <span className="text-[#cca700]">Hopper H100 / L4</span>
              </div>
              <div className="flex items-center justify-between text-[#888888]">
                <span>Security Gateway:</span>
                <span className="text-[#0078d4]">IAP TCP :22 (Private IP)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Form & Live Pipeline (7 cols) */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between space-y-4">
            {!isAuthenticating && authStep === 0 ? (
              <form onSubmit={handleAuthorize} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#777777] uppercase font-mono block">Workplace Identity Email</label>
                  <div className="flex items-center bg-[#141414] border border-[#2b2b2b] focus-within:border-[#0078d4] px-2.5 h-[30px] transition-colors">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#777777] uppercase font-mono block">Password / Access Key</label>
                    <div className="flex items-center bg-[#141414] border border-[#2b2b2b] focus-within:border-[#0078d4] px-2.5 h-[30px] transition-colors">
                      <Lock className="w-3.5 h-3.5 text-[#555555] mr-2 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Key or token"
                        className="w-full bg-transparent text-[#ffffff] font-mono text-[11px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#666666] hover:text-[#aaaaaa] ml-1"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#777777] uppercase font-mono block">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aman"
                      className="w-full bg-[#141414] border border-[#2b2b2b] focus-within:border-[#0078d4] px-2.5 h-[30px] text-[#ffffff] font-mono text-[11px] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#777777] uppercase font-mono block">Target GCP Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-[#141414] border border-[#2b2b2b] focus-within:border-[#0078d4] px-2 h-[30px] text-[#ffffff] font-mono text-[11px] outline-none rounded-none"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#777777] uppercase font-mono block">IAM Role & Permissions</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-[#141414] border border-[#2b2b2b] focus-within:border-[#0078d4] px-2 h-[30px] text-[#ffffff] font-mono text-[11px] outline-none rounded-none"
                    >
                      <option value="owner">Owner / SuperAdmin (compute.*)</option>
                      <option value="ml_engineer">ML Engineer (instances.*, IAP)</option>
                      <option value="viewer">Security Auditor (read-only)</option>
                    </select>
                  </div>
                </div>

                {/* Scopes & WIF Preview toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClaimsInspector(!showClaimsInspector)}
                    className="text-[10px] text-[#0078d4] hover:underline font-mono flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>{showClaimsInspector ? 'Hide' : 'Inspect'} OIDC / WIF Token Claims & Scopes</span>
                  </button>

                  {showClaimsInspector && (
                    <div className="mt-2 p-2 bg-[#121212] border border-[#262626] font-mono text-[10px] text-[#888888] space-y-1 overflow-x-auto">
                      <div><span className="text-[#555555]">iss:</span> https://auth.kshetra.internal</div>
                      <div><span className="text-[#555555]">sub:</span> {email}</div>
                      <div><span className="text-[#555555]">aud:</span> //iam.googleapis.com/.../kshetra-pool</div>
                      <div><span className="text-[#555555]">scopes:</span> https://www.googleapis.com/auth/compute, storage, github:repo:read</div>
                      <div><span className="text-[#555555]">role:</span> {role}</div>
                    </div>
                  )}
                </div>

                {/* Primary Authorize Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-[34px] bg-[#0078d4] hover:bg-[#006bbd] text-white rounded-sm text-[12px] font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In & Authorize Cloud Fleet</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Live Real-Time Authorization Handshake Pipeline */
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between border-b border-[#282828] pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0078d4] animate-spin" />
                    <span className="text-white font-semibold text-[12px]">
                      Authorizing Workload Identity Federation (WIF)...
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#4ec9b0]">STEP {authStep} OF 5</span>
                </div>

                {/* 5-Step Pipeline Indicators */}
                <div className="space-y-2">
                  {[
                    { step: 1, label: 'Identity Token & HMAC Verification' },
                    { step: 2, label: 'GCP Workload Identity Pool Exchange (STS)' },
                    { step: 3, label: 'Compute Engine IAM & IAP Tunneling Permissions' },
                    { step: 4, label: 'Aggregated Compute Instance Discovery' },
                    { step: 5, label: 'Issuing Session Bearer & Launching Fleet View' },
                  ].map(item => {
                    const isDone = authStep > item.step;
                    const isCurrent = authStep === item.step;

                    return (
                      <div 
                        key={item.step}
                        className={`p-2 border flex items-center justify-between text-[11px] font-mono transition-colors ${
                          isDone 
                            ? 'border-[#23583a] bg-[#14261c] text-[#4ec9b0]' 
                            : isCurrent
                            ? 'border-[#0078d4] bg-[#1a2530] text-white'
                            : 'border-[#262626] bg-[#161616] text-[#666666]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4ec9b0]" />
                          ) : isCurrent ? (
                            <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : (
                            <span className="w-3 h-3 rounded-full border border-[#444444]" />
                          )}
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px]">
                          {isDone ? 'VERIFIED' : isCurrent ? 'IN PROGRESS' : 'QUEUED'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Live Console Logs */}
                <div className="p-2.5 bg-[#121212] border border-[#262626] font-mono text-[10px] text-[#888888] space-y-1 max-h-[110px] overflow-y-auto">
                  {authLogs.map((log, lIdx) => (
                    <div key={lIdx} className={log.includes('[SUCCESS]') ? 'text-[#4ec9b0] font-semibold' : 'text-[#888888]'}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Secondary Action: Fast Skip / Inspect Workspace */}
            {onBypassToWorkspace && !isAuthenticating && (
              <div className="border-t border-[#242424] pt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#666666]">Want to inspect source code first?</span>
                <button
                  type="button"
                  onClick={onBypassToWorkspace}
                  className="text-[#888888] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Open IDE Explorer</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
