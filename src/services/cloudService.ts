import { 
  UserSession, 
  GcpProject, 
  GcpVmInstance, 
  GitHubRepo, 
  WorkspaceBinding 
} from '../types/fabric';

export class CloudService {
  async getSession(): Promise<UserSession> {
    const res = await fetch('/api/session');
    if (!res.ok) throw new Error('Failed to load session');
    const data = await res.json();
    return data.session;
  }

  async login(email?: string, name?: string, organization?: string, role?: string, targetProjectId?: string): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, organization, role, targetProjectId }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    return data.session;
  }

  async logout(): Promise<void> {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Logout failed');
  }

  async getGcpProjects(): Promise<{ projects: GcpProject[]; activeProjectId: string }> {
    const res = await fetch('/api/gcp/projects');
    if (!res.ok) throw new Error('Failed to fetch GCP projects');
    const data = await res.json();
    return { projects: data.projects, activeProjectId: data.activeProjectId };
  }

  async getGcpVms(projectId?: string): Promise<GcpVmInstance[]> {
    const url = projectId ? `/api/gcp/projects/${projectId}/vms` : '/api/gcp/vms';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch GCP VMs');
    const data = await res.json();
    return data.vms;
  }

  async createVm(payload: {
    name: string;
    projectId?: string;
    zone?: string;
    machineType?: string;
    gpuModel?: string;
    gpuCount?: number;
    vramTotalGB?: number;
    cpuCores?: number;
    ramGB?: number;
    bootDiskGB?: number;
    costPerHour?: number;
  }): Promise<GcpVmInstance> {
    const res = await fetch('/api/gcp/vms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create VM' }));
      throw new Error(err.message || 'Failed to create VM');
    }
    const data = await res.json();
    return data.vm;
  }

  async getVmTelemetry(projectId: string, zone: string, vmName: string): Promise<any> {
    const res = await fetch(`/api/gcp/vms/${projectId}/${zone}/${vmName}/telemetry`);
    if (!res.ok) throw new Error('Failed to fetch VM telemetry');
    const data = await res.json();
    return data.telemetry;
  }

  async executeVmCommand(projectId: string, zone: string, vmName: string, command: string): Promise<{ stdout: string; stderr?: string; exitCode: number }> {
    const res = await fetch(`/api/gcp/vms/${projectId}/${zone}/${vmName}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    if (!res.ok) throw new Error('Failed to execute command on VM');
    return await res.json();
  }

  async runVmPreflight(projectId: string, zone: string, vmName: string): Promise<GcpVmInstance['preflight']> {
    const res = await fetch(`/api/gcp/vms/${projectId}/${zone}/${vmName}/preflight`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Preflight check failed');
    const data = await res.json();
    return data.preflight;
  }

  async connectVmAgent(projectId: string, zone: string, vmName: string): Promise<GcpVmInstance> {
    const res = await fetch(`/api/gcp/vms/${projectId}/${zone}/${vmName}/connect`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to connect agent to VM');
    const data = await res.json();
    return data.vm;
  }

  async executeVmAction(projectId: string, zone: string, vmName: string, action: 'start' | 'stop' | 'reset'): Promise<GcpVmInstance> {
    const res = await fetch(`/api/gcp/vms/${projectId}/${zone}/${vmName}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(`Failed to ${action} VM`);
    const data = await res.json();
    return data.vm;
  }

  async connectGcp(projectId?: string): Promise<UserSession> {
    const res = await fetch('/api/gcp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json();
    return data.session;
  }

  async disconnectGcp(): Promise<void> {
    await fetch('/api/gcp/disconnect', { method: 'POST' });
  }

  async getGitHubRepos(): Promise<GitHubRepo[]> {
    const res = await fetch('/api/github/repos');
    if (!res.ok) throw new Error('Failed to fetch GitHub repositories');
    const data = await res.json();
    return data.repos;
  }

  async connectGitHub(account?: string): Promise<UserSession> {
    const res = await fetch('/api/github/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account }),
    });
    const data = await res.json();
    return data.session;
  }

  async disconnectGitHub(): Promise<void> {
    await fetch('/api/github/disconnect', { method: 'POST' });
  }

  async getWorkspaces(): Promise<WorkspaceBinding[]> {
    const res = await fetch('/api/workspaces');
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    const data = await res.json();
    return data.workspaces;
  }

  async createWorkspace(repoFullName: string, branch: string, vmName: string, projectId: string, zone: string): Promise<WorkspaceBinding> {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoFullName, branch, vmName, projectId, zone }),
    });
    if (!res.ok) throw new Error('Failed to create workspace binding');
    const data = await res.json();
    return data.workspace;
  }

  async openWorkspace(workspaceId: string): Promise<WorkspaceBinding> {
    const res = await fetch(`/api/workspaces/${workspaceId}/open`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to open workspace');
    const data = await res.json();
    return data.workspace;
  }

  async stopWorkspace(workspaceId: string): Promise<WorkspaceBinding> {
    const res = await fetch(`/api/workspaces/${workspaceId}/stop`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to stop workspace');
    const data = await res.json();
    return data.workspace;
  }
}

export const cloudService = new CloudService();
