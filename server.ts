import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  UserProfile, 
  UserSession, 
  GcpProject, 
  GcpVmInstance, 
  GitHubRepo, 
  WorkspaceBinding 
} from './src/types/fabric';

const app = express();
app.use(express.json());

// In-Memory Database for Production Demonstration
let currentSession: UserSession = {
  isAuthenticated: false, // Default unauthenticated so user can test login & authorization themselves!
  user: null,
  sessionToken: undefined,
  signedInAt: undefined,
  tokenClaims: undefined,
  connections: {
    github: {
      connected: false,
      account: undefined,
      installationId: undefined,
      authorizedReposCount: 0,
    },
    gcp: {
      connected: false,
      userEmail: undefined,
      activeProjectId: 'noahlabs-ai-prod',
      discoveredProjectsCount: 3,
      discoveredVmsCount: 6,
      runningVmsCount: 4,
    },
  },
};

const gcpProjects: GcpProject[] = [
  {
    id: 'noahlabs-ai-prod',
    name: 'NoahLabs AI Production',
    projectNumber: '459758149151',
    organization: 'noahlabs.ai',
    status: 'ACTIVE',
    defaultZone: 'us-central1-a',
    vmsCount: 3,
  },
  {
    id: 'kshetra-compute-us',
    name: 'Kshetra Dedicated Compute',
    projectNumber: '891048291042',
    organization: 'amanyagami',
    status: 'ACTIVE',
    defaultZone: 'us-west1-b',
    vmsCount: 2,
  },
  {
    id: 'ml-experiments-gpu',
    name: 'ML Accelerator Lab',
    projectNumber: '109284729103',
    organization: 'noahlabs.ai',
    status: 'ACTIVE',
    defaultZone: 'us-east4-c',
    vmsCount: 1,
  },
];

let gcpVms: GcpVmInstance[] = [
  {
    id: 'gcp-vm-h100-01',
    name: 'gcp-h100-trainer-01',
    projectId: 'noahlabs-ai-prod',
    zone: 'us-central1-a',
    status: 'RUNNING',
    machineType: 'a3-highgpu-8g',
    gpu: {
      model: 'NVIDIA H100 80GB SXM5',
      count: 8,
      vramTotalGB: 640,
    },
    cpuCores: 208,
    ramGB: 1872,
    bootDiskGB: 2000,
    internalIp: '10.128.0.42',
    externalIp: null, // Private-IP only! IAP tunnel required
    isPrivateOnly: true,
    osImage: 'cml-gpu-debian-11-py310-cuda12',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'CONNECTED',
    agentVersion: 'v2.4.1',
    uptimeHours: 38.5,
    costPerHour: 24.80,
    preflight: {
      checkedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      passed: true,
      iapTunnelOk: true,
      osLoginOk: true,
      serviceAccountScopesOk: true,
      nvidiaDriverOk: true,
      agentOk: true,
      messages: [
        'IAP TCP forwarding tunnel to 10.128.0.42:22 verified.',
        'OS Login: POSIX account created for aman_noahlabs_ai.',
        'Compute Engine service account has roles/compute.instanceAdmin.v1.',
        'NVIDIA Driver 550.54.14 active with 8x H100 SXM5 detected.',
        'Kshetra Agent responding on localhost:443 via mTLS.',
      ],
    },
    activeWorkspaceId: 'ws-ide-kshetra-01',
  },
  {
    id: 'gcp-vm-l4-02',
    name: 'gcp-l4-inference-node',
    projectId: 'noahlabs-ai-prod',
    zone: 'us-central1-a',
    status: 'RUNNING',
    machineType: 'g2-standard-48',
    gpu: {
      model: 'NVIDIA L4 24GB',
      count: 4,
      vramTotalGB: 96,
    },
    cpuCores: 48,
    ramGB: 192,
    bootDiskGB: 500,
    internalIp: '10.128.0.48',
    externalIp: null,
    isPrivateOnly: true,
    osImage: 'ubuntu-2204-jammy-v20240915',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'CONNECTED',
    agentVersion: 'v2.4.1',
    uptimeHours: 12.2,
    costPerHour: 4.60,
    preflight: {
      checkedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      passed: true,
      iapTunnelOk: true,
      osLoginOk: true,
      serviceAccountScopesOk: true,
      nvidiaDriverOk: true,
      agentOk: true,
      messages: [
        'IAP tunnel verified on 10.128.0.48:22.',
        'OS Login verified.',
        'NVIDIA Driver 535.161.07 active.',
      ],
    },
  },
  {
    id: 'gcp-vm-dev-cpu-03',
    name: 'dev-cpu-builder-worker',
    projectId: 'noahlabs-ai-prod',
    zone: 'us-central1-a',
    status: 'TERMINATED',
    machineType: 'c3-standard-16',
    cpuCores: 16,
    ramGB: 64,
    bootDiskGB: 300,
    internalIp: '10.128.0.55',
    externalIp: null,
    isPrivateOnly: true,
    osImage: 'debian-12-bookworm',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'OFFLINE',
    uptimeHours: 0,
    costPerHour: 0.82,
  },
  {
    id: 'gcp-vm-a100-04',
    name: 'amanyagami-sandbox-a100',
    projectId: 'kshetra-compute-us',
    zone: 'us-west1-b',
    status: 'RUNNING',
    machineType: 'a2-highgpu-1g',
    gpu: {
      model: 'NVIDIA A100 80GB SXM4',
      count: 1,
      vramTotalGB: 80,
    },
    cpuCores: 12,
    ramGB: 85,
    bootDiskGB: 400,
    internalIp: '10.138.0.12',
    externalIp: '34.82.112.90',
    isPrivateOnly: false,
    osImage: 'ubuntu-2204-lts-cuda12',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'CONNECTED',
    agentVersion: 'v2.4.1',
    uptimeHours: 84.1,
    costPerHour: 3.67,
    preflight: {
      checkedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      passed: true,
      iapTunnelOk: true,
      osLoginOk: true,
      serviceAccountScopesOk: true,
      nvidiaDriverOk: true,
      agentOk: true,
      messages: ['Public and IAP connectivity verified.', 'Agent mTLS registered.'],
    },
  },
  {
    id: 'gcp-vm-eval-cpu-05',
    name: 'kshetra-eval-bench-01',
    projectId: 'kshetra-compute-us',
    zone: 'us-west1-b',
    status: 'RUNNING',
    machineType: 'n2-standard-16',
    cpuCores: 16,
    ramGB: 64,
    bootDiskGB: 250,
    internalIp: '10.138.0.19',
    externalIp: null,
    isPrivateOnly: true,
    osImage: 'ubuntu-2204-lts',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'NOT_INSTALLED',
    uptimeHours: 4.6,
    costPerHour: 0.78,
  },
  {
    id: 'gcp-vm-h100-nvl-06',
    name: 'ml-h100nvl-cluster-node',
    projectId: 'ml-experiments-gpu',
    zone: 'us-east4-c',
    status: 'RUNNING',
    machineType: 'g2-standard-96',
    gpu: {
      model: 'NVIDIA H100 NVL 94GB',
      count: 2,
      vramTotalGB: 188,
    },
    cpuCores: 96,
    ramGB: 384,
    bootDiskGB: 1000,
    internalIp: '10.150.0.8',
    externalIp: null,
    isPrivateOnly: true,
    osImage: 'cml-gpu-debian-11',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'CONNECTED',
    agentVersion: 'v2.4.1',
    uptimeHours: 19.8,
    costPerHour: 7.89,
    preflight: {
      checkedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      passed: true,
      iapTunnelOk: true,
      osLoginOk: true,
      serviceAccountScopesOk: true,
      nvidiaDriverOk: true,
      agentOk: true,
      messages: ['2x H100 NVL active.', 'NVLink 4.0 interconnect verified.'],
    },
  },
];

const githubRepos: GitHubRepo[] = [
  {
    id: 'repo-1',
    owner: 'amanyagami',
    name: 'ide-kshetra',
    fullName: 'amanyagami/ide-kshetra',
    isPrivate: true,
    defaultBranch: 'main',
    description: 'SOTA open-source-first cloud IDE architecture with decoupled compute execution',
    updatedAt: '12m ago',
    branches: ['main', 'feature/gcp-iap-connector', 'dev'],
  },
  {
    id: 'repo-2',
    owner: 'amanyagami',
    name: 'gemma-agent-core',
    fullName: 'amanyagami/gemma-agent-core',
    isPrivate: true,
    defaultBranch: 'main',
    description: 'Gemma fine-tuning & real-time CUDA tensor verification benchmark',
    updatedAt: '2h ago',
    branches: ['main', 'v0.2.0-hotfix'],
  },
  {
    id: 'repo-3',
    owner: 'noahlabs-ai',
    name: 'distributed-train',
    fullName: 'noahlabs-ai/distributed-train',
    isPrivate: true,
    defaultBranch: 'main',
    description: 'Distributed training orchestration on Hopper H100/H200 multi-node clusters',
    updatedAt: '1d ago',
    branches: ['main', 'hopper-fp16-tuning'],
  },
];

let workspaces: WorkspaceBinding[] = [
  {
    id: 'ws-ide-kshetra-01',
    name: 'ide-kshetra on gcp-h100-trainer-01',
    repo: {
      fullName: 'amanyagami/ide-kshetra',
      branch: 'main',
      commitSha: '98a21f4c7e',
    },
    compute: {
      type: 'gcp_existing_vm',
      projectId: 'noahlabs-ai-prod',
      zone: 'us-central1-a',
      vmName: 'gcp-h100-trainer-01',
      machineType: 'a3-highgpu-8g',
      gpuModel: 'NVIDIA H100 80GB SXM5 (8x GPUs)',
      internalIp: '10.128.0.42',
      isPrivateIpOnly: true,
    },
    status: 'READY',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    openedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    leaseId: 'lease-gcp-991204',
    agentId: 'agent-gcp-h100-01',
  },
];

// ==========================================
// 1. Session & Authentication Endpoints
// ==========================================

app.get('/api/session', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    session: currentSession,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, name, organization, role, targetProjectId } = req.body;
  const userEmail = email ? email.trim() : 'aman@noahlabs.ai';
  const userRole: 'owner' | 'ml_engineer' | 'viewer' = role || 'owner';
  const targetProject = targetProjectId || 'noahlabs-ai-prod';

  const rolePermissions: Record<string, string[]> = {
    owner: [
      'compute.*',
      'compute.instances.create',
      'compute.instances.delete',
      'compute.instances.start',
      'compute.instances.stop',
      'compute.instances.reset',
      'iap.tunnelInstances.accessViaIAP',
      'iam.serviceAccounts.actAs',
      'workspace.*',
      'cluster.admin',
      'storage.objects.*',
    ],
    ml_engineer: [
      'compute.instances.get',
      'compute.instances.list',
      'compute.instances.start',
      'compute.instances.stop',
      'compute.instances.reset',
      'iap.tunnelInstances.accessViaIAP',
      'workspace.bind',
      'notebook.execute',
      'storage.objects.get',
    ],
    viewer: [
      'compute.instances.get',
      'compute.instances.list',
      'monitoring.timeSeries.list',
    ],
  };

  const permissions = rolePermissions[userRole] || rolePermissions.ml_engineer;
  const runningCount = gcpVms.filter(v => v.status === 'RUNNING').length;

  currentSession = {
    isAuthenticated: true,
    user: {
      id: `usr_${Date.now().toString(36)}`,
      email: userEmail,
      name: name || userEmail.split('@')[0],
      avatarUrl: '/src/assets/images/avatar_engineer_1790479540008.jpg',
      role: userRole,
      organization: organization || 'noahlabs.ai',
      permissions,
      wifSubject: `principal://iam.googleapis.com/projects/459758149151/locations/global/workloadIdentityPools/kshetra-pool/subject/${userEmail}`,
    },
    sessionToken: `jwt_wif_${Buffer.from(JSON.stringify({ sub: userEmail, role: userRole, iat: Date.now() })).toString('base64url')}`,
    signedInAt: new Date().toISOString(),
    tokenClaims: {
      iss: 'https://auth.kshetra.internal',
      sub: userEmail,
      aud: 'https://iam.googleapis.com/projects/459758149151/locations/global/workloadIdentityPools/kshetra-pool/providers/kshetra-oidc',
      exp: Math.floor(Date.now() / 1000) + 86400,
      roles: [userRole],
      scopes: [
        'https://www.googleapis.com/auth/compute',
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/devstorage.read_write',
        'github:repo:read',
      ],
      wifAudience: '//iam.googleapis.com/projects/459758149151/locations/global/workloadIdentityPools/kshetra-pool',
      gcpProject: targetProject,
    },
    connections: {
      github: {
        connected: true,
        account: 'amanyagami',
        installationId: 'gh-inst-8849201',
        authorizedReposCount: githubRepos.length,
      },
      gcp: {
        connected: true,
        userEmail: userEmail,
        activeProjectId: targetProject,
        discoveredProjectsCount: gcpProjects.length,
        discoveredVmsCount: gcpVms.length,
        runningVmsCount: runningCount,
      },
    },
  };

  res.json({
    status: 'ok',
    message: `Signed in & authorized successfully as ${userEmail} (${userRole.toUpperCase()})`,
    session: currentSession,
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  currentSession = {
    isAuthenticated: false,
    user: null,
    connections: {
      github: { connected: false, authorizedReposCount: 0 },
      gcp: { connected: false, discoveredProjectsCount: 0, discoveredVmsCount: 0 },
    },
  };
  res.json({ status: 'ok', message: 'Signed out successfully' });
});

// ==========================================
// 2. Google Cloud Platform VM Endpoints
// ==========================================

app.get('/api/gcp/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    connected: currentSession.connections.gcp.connected,
    userEmail: currentSession.connections.gcp.userEmail,
    activeProjectId: currentSession.connections.gcp.activeProjectId,
    projectsCount: gcpProjects.length,
    vmsCount: gcpVms.length,
    runningVmsCount: gcpVms.filter(v => v.status === 'RUNNING').length,
  });
});

app.post('/api/gcp/connect', (req: Request, res: Response) => {
  const { projectId } = req.body;
  currentSession.connections.gcp.connected = true;
  currentSession.connections.gcp.activeProjectId = projectId || 'noahlabs-ai-prod';
  currentSession.connections.gcp.userEmail = currentSession.user?.email || 'aman@noahlabs.ai';

  res.json({
    status: 'ok',
    message: 'Google Cloud Platform connected via Workload Identity Federation (WIF).',
    session: currentSession,
  });
});

app.post('/api/gcp/disconnect', (_req: Request, res: Response) => {
  currentSession.connections.gcp.connected = false;
  res.json({ status: 'ok', message: 'Google Cloud Platform connection revoked.' });
});

app.get('/api/gcp/projects', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    projects: gcpProjects,
    activeProjectId: currentSession.connections.gcp.activeProjectId || gcpProjects[0].id,
  });
});

app.get('/api/gcp/projects/:projectId/vms', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const filtered = gcpVms.filter(v => v.projectId === projectId);
  res.json({
    status: 'ok',
    projectId,
    totalVms: filtered.length,
    runningVms: filtered.filter(v => v.status === 'RUNNING').length,
    vms: filtered,
  });
});

app.get('/api/gcp/vms', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    totalVms: gcpVms.length,
    runningVms: gcpVms.filter(v => v.status === 'RUNNING').length,
    vms: gcpVms,
  });
});

// Preflight Check for GCP VM (IAP tunneling, OS Login, NVIDIA Driver)
app.post('/api/gcp/vms/:projectId/:zone/:name/preflight', (req: Request, res: Response) => {
  const { projectId, zone, name } = req.params;
  const vm = gcpVms.find(v => v.name === name && v.projectId === projectId);

  if (!vm) {
    return res.status(404).json({ status: 'error', message: `VM ${name} not found in project ${projectId}` });
  }

  const isRunning = vm.status === 'RUNNING';
  const preflightResult = {
    checkedAt: new Date().toISOString(),
    passed: isRunning,
    iapTunnelOk: isRunning && vm.iapSupported,
    osLoginOk: isRunning && vm.osLoginEnabled,
    serviceAccountScopesOk: isRunning,
    nvidiaDriverOk: isRunning && !!vm.gpu,
    agentOk: isRunning && vm.agentStatus === 'CONNECTED',
    messages: [
      isRunning
        ? `[PASS] IAP Tunneling: Verified TCP forwarding path to ${vm.internalIp}:22 without public IP.`
        : `[FAIL] VM is currently ${vm.status}. It must be RUNNING to open an IAP tunnel.`,
      `[PASS] OS Login: POSIX identity mapped to ${currentSession.user?.email || 'aman@noahlabs.ai'}.`,
      `[PASS] Service Account Scopes: compute.instanceAdmin and monitoring.viewer verified.`,
      vm.gpu
        ? `[PASS] GPU Hardware: ${vm.gpu.count}x ${vm.gpu.model} detected with active NVML driver.`
        : `[INFO] CPU instance: no dedicated GPU accelerator requested.`,
      vm.agentStatus === 'CONNECTED'
        ? `[PASS] Kshetra Agent: Online and authenticated via mTLS on port 443.`
        : `[NOTICE] Kshetra Agent not yet bootstrapped. Ready for 1-click IAP bootstrap.`,
    ],
  };

  vm.preflight = preflightResult;

  res.json({
    status: 'ok',
    vmName: name,
    preflight: preflightResult,
  });
});

// Bootstrap / Connect Kshetra Agent to existing VM
app.post('/api/gcp/vms/:projectId/:zone/:name/connect', (req: Request, res: Response) => {
  const { projectId, name } = req.params;
  const vm = gcpVms.find(v => v.name === name && v.projectId === projectId);

  if (!vm) {
    return res.status(404).json({ status: 'error', message: `VM ${name} not found` });
  }

  if (vm.status !== 'RUNNING') {
    return res.status(400).json({ status: 'error', message: `Cannot connect to VM ${name}: VM is currently ${vm.status}` });
  }

  vm.agentStatus = 'CONNECTED';
  vm.agentVersion = 'v2.4.1';

  res.json({
    status: 'ok',
    message: `Kshetra Agent bootstrapped and connected to ${name} via IAP tunnel.`,
    nodeLease: {
      leaseId: `lease-gcp-${Date.now().toString(36)}`,
      nodeId: `node-${vm.id}`,
      generation: 1002,
      vmName: vm.name,
      internalIp: vm.internalIp,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    },
    vm,
  });
});

// Start / Stop / Restart VM Action
app.post('/api/gcp/vms/:projectId/:zone/:name/action', (req: Request, res: Response) => {
  const { projectId, name } = req.params;
  const { action } = req.body; // 'start' | 'stop' | 'reset'
  const vm = gcpVms.find(v => v.name === name && v.projectId === projectId);

  if (!vm) {
    return res.status(404).json({ status: 'error', message: `VM ${name} not found` });
  }

  if (action === 'start') {
    vm.status = 'RUNNING';
    vm.agentStatus = 'CONNECTED';
    vm.uptimeHours = 0.1;
  } else if (action === 'stop') {
    vm.status = 'TERMINATED';
    vm.agentStatus = 'OFFLINE';
  } else if (action === 'reset') {
    vm.status = 'RUNNING';
    vm.agentStatus = 'CONNECTED';
    vm.uptimeHours = 0.1;
  }

  const runningCount = gcpVms.filter(v => v.status === 'RUNNING').length;
  currentSession.connections.gcp.runningVmsCount = runningCount;

  res.json({
    status: 'ok',
    action,
    vmName: name,
    newStatus: vm.status,
    runningCount,
    vm,
  });
});

// Provision / Create New Compute Engine VM Instance
app.post('/api/gcp/vms/create', (req: Request, res: Response) => {
  const { 
    name, 
    projectId, 
    zone, 
    machineType, 
    gpuModel, 
    gpuCount, 
    vramTotalGB, 
    cpuCores, 
    ramGB, 
    bootDiskGB, 
    costPerHour 
  } = req.body;

  const vmName = name ? name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : `gcp-gpu-custom-${Date.now().toString(36)}`;
  const targetProject = projectId || currentSession.connections.gcp.activeProjectId || 'noahlabs-ai-prod';
  const targetZone = zone || 'us-central1-a';

  // Check duplicate
  const exists = gcpVms.some(v => v.name === vmName && v.projectId === targetProject);
  if (exists) {
    return res.status(400).json({ status: 'error', message: `VM with name '${vmName}' already exists in project '${targetProject}'` });
  }

  const newVm: GcpVmInstance = {
    id: `gcp-vm-${Date.now().toString(36)}`,
    name: vmName,
    projectId: targetProject,
    zone: targetZone,
    status: 'RUNNING',
    machineType: machineType || 'a3-highgpu-8g',
    gpu: gpuModel ? {
      model: gpuModel,
      count: gpuCount || 1,
      vramTotalGB: vramTotalGB || 80,
    } : {
      model: 'NVIDIA H100 80GB SXM5',
      count: 1,
      vramTotalGB: 80,
    },
    cpuCores: cpuCores || 26,
    ramGB: ramGB || 234,
    bootDiskGB: bootDiskGB || 500,
    internalIp: `10.128.0.${Math.floor(Math.random() * 180 + 20)}`,
    externalIp: null,
    isPrivateOnly: true,
    osImage: 'cml-gpu-debian-11-py310-cuda12',
    iapSupported: true,
    osLoginEnabled: true,
    agentStatus: 'CONNECTED',
    agentVersion: 'v2.4.1',
    uptimeHours: 0.1,
    costPerHour: costPerHour || 3.85,
    preflight: {
      checkedAt: new Date().toISOString(),
      passed: true,
      iapTunnelOk: true,
      osLoginOk: true,
      serviceAccountScopesOk: true,
      nvidiaDriverOk: true,
      agentOk: true,
      messages: [
        `[PASS] IAP Tunnel: TCP tunnel verified on private interface without public IP.`,
        `[PASS] OS Login: Identity mapped to ${currentSession.user?.email || 'aman@noahlabs.ai'}.`,
        `[PASS] NVML Driver 550.54.14 active with CUDA 12.4.`,
        `[PASS] Kshetra Agent online via mTLS on port 443.`,
      ],
    },
  };

  gcpVms.unshift(newVm);
  currentSession.connections.gcp.discoveredVmsCount = gcpVms.length;
  currentSession.connections.gcp.runningVmsCount = gcpVms.filter(v => v.status === 'RUNNING').length;

  res.json({
    status: 'ok',
    message: `VM ${vmName} successfully provisioned and booted in ${targetZone}`,
    vm: newVm,
    runningVmsCount: currentSession.connections.gcp.runningVmsCount,
  });
});

// Live Telemetry Stream for VM
app.get('/api/gcp/vms/:projectId/:zone/:name/telemetry', (req: Request, res: Response) => {
  const { projectId, name } = req.params;
  const vm = gcpVms.find(v => v.name === name && v.projectId === projectId);

  if (!vm) {
    return res.status(404).json({ status: 'error', message: `VM ${name} not found` });
  }

  if (vm.status !== 'RUNNING') {
    return res.json({
      status: 'ok',
      vmStatus: vm.status,
      telemetry: {
        gpuUtilPercent: 0,
        memoryUtilPercent: 0,
        temperatureC: 22,
        powerWatts: 0,
        vramUsedGB: 0,
        activeProcesses: [],
      },
    });
  }

  const baseUtil = vm.gpu ? (vm.gpu.count >= 8 ? 68 : 34) : 18;
  const jitter = Math.floor(Math.random() * 8) - 4;
  const gpuUtil = Math.max(10, Math.min(98, baseUtil + jitter));
  const vramMax = vm.gpu ? vm.gpu.vramTotalGB : 64;
  const vramUsed = parseFloat(((gpuUtil / 100) * (vramMax * 0.75)).toFixed(1));

  const telemetry = {
    gpuUtilPercent: gpuUtil,
    memoryUtilPercent: Math.max(12, Math.min(85, Math.round(gpuUtil * 0.6))),
    temperatureC: 42 + Math.floor(gpuUtil * 0.25),
    powerWatts: vm.gpu ? Math.round(180 + gpuUtil * (vm.gpu.count * 4.2)) : 65,
    vramUsedGB: vramUsed,
    activeProcesses: [
      {
        pid: 3891,
        user: currentSession.user?.email.split('@')[0] || 'aman',
        command: 'python3 -m torch.distributed.run --nproc_per_node=8 train.py',
        gpuMemory: `${(vramUsed * 0.85).toFixed(1)} GB`,
        cpuPercent: 88.4,
      },
      {
        pid: 4012,
        user: 'root',
        command: 'fabric-agent (daemon v2.4.1)',
        gpuMemory: '142 MB',
        cpuPercent: 1.1,
      },
      {
        pid: 4150,
        user: 'systemd-journald',
        command: '/lib/systemd/systemd-journald',
        gpuMemory: '0 MB',
        cpuPercent: 0.4,
      },
    ],
  };

  res.json({
    status: 'ok',
    vmName: name,
    vmStatus: vm.status,
    telemetry,
  });
});

// Execute Command via IAP / Agent on VM
app.post('/api/gcp/vms/:projectId/:zone/:name/exec', (req: Request, res: Response) => {
  const { projectId, name } = req.params;
  const { command } = req.body;
  const vm = gcpVms.find(v => v.name === name && v.projectId === projectId);

  if (!vm) {
    return res.status(404).json({ status: 'error', message: `VM ${name} not found` });
  }

  if (vm.status !== 'RUNNING') {
    return res.status(400).json({ status: 'error', message: `Cannot execute command: VM ${name} is ${vm.status}` });
  }

  const cmd = (command || '').trim();
  let stdout = '';
  let exitCode = 0;

  if (cmd === 'nvidia-smi') {
    const gpuName = vm.gpu ? vm.gpu.model : 'No GPU';
    const totalMem = vm.gpu ? vm.gpu.vramTotalGB * 1024 : 0;
    const usedMem = Math.round(totalMem * 0.28);
    stdout = `+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.54.14              Driver Version: 550.54.14      CUDA Version: 12.4     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                  Persistence-M| Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  ${gpuName.padEnd(25)} On   | 00000000:00:04.0   Off |                    0 |
| N/A   46C    P0             264W / 700W |   ${usedMem}MiB / ${totalMem}MiB |    42%      Default |
|                                         |                        |             Disabled |
+-----------------------------------------+------------------------+----------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|    0   N/A  N/A      3891      C   python3                                      ${usedMem}MiB |
+-----------------------------------------------------------------------------------------+`;
  } else if (cmd === 'uname -a') {
    stdout = `Linux ${vm.name} 6.5.0-35-generic #35~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Fri Sep 20 18:24:12 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`;
  } else if (cmd.includes('torch')) {
    stdout = `CUDA Available: True\nDevice Count: ${vm.gpu?.count || 1}\nDevice Name: ${vm.gpu?.model || 'CUDA Device'}\nCUDA Arch sm_90 capability confirmed.`;
  } else if (cmd === 'uptime') {
    stdout = ` 20:24:50 up ${Math.round(vm.uptimeHours * 60)} min,  1 user,  load average: 1.42, 1.18, 0.95`;
  } else if (cmd.includes('gcloud compute instances')) {
    stdout = `NAME                   ZONE           MACHINE_TYPE    PREEMPTIBLE  INTERNAL_IP  EXTERNAL_IP  STATUS\n` +
      gcpVms.filter(v => v.projectId === vm.projectId).map(v => `${v.name.padEnd(22)} ${v.zone.padEnd(14)} ${v.machineType.padEnd(15)} -            ${v.internalIp.padEnd(12)} -            ${v.status}`).join('\n');
  } else if (cmd === 'df -h') {
    stdout = `Filesystem      Size  Used Avail Use% Mounted on
/dev/root       490G   48G  422G  11% /
tmpfs           188G     0  188G   0% /dev/shm
/dev/nvme0n1    1.9T  210G  1.7T  11% /mnt/fast-scratch`;
  } else {
    stdout = `[${vm.name}:~]$ ${cmd}\nCommand executed successfully via IAP forwarding tunnel. Exit code: 0`;
  }

  res.json({
    status: 'ok',
    command: cmd,
    stdout,
    exitCode,
  });
});

// ==========================================
// 3. GitHub App Endpoints
// ==========================================

app.get('/api/github/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    connected: currentSession.connections.github.connected,
    account: currentSession.connections.github.account,
    installationId: currentSession.connections.github.installationId,
    authorizedRepos: githubRepos,
  });
});

app.post('/api/github/connect', (req: Request, res: Response) => {
  const { account } = req.body;
  currentSession.connections.github.connected = true;
  currentSession.connections.github.account = account || 'amanyagami';
  currentSession.connections.github.installationId = 'gh-inst-8849201';

  res.json({
    status: 'ok',
    message: 'GitHub App installed & authorized successfully.',
    session: currentSession,
    repos: githubRepos,
  });
});

app.post('/api/github/disconnect', (_req: Request, res: Response) => {
  currentSession.connections.github.connected = false;
  res.json({ status: 'ok', message: 'GitHub App authorization revoked.' });
});

app.get('/api/github/repos', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    repos: githubRepos,
  });
});

app.get('/api/github/repos/:owner/:repo/branches', (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  const found = githubRepos.find(r => r.fullName === fullName);

  res.json({
    status: 'ok',
    fullName,
    branches: found?.branches || ['main', 'dev'],
  });
});

// ==========================================
// 4. Workspace Binding & Lifecycle Endpoints
// ==========================================

app.get('/api/workspaces', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    workspaces,
  });
});

// Create Binding: RepositorySelection + ComputeTarget = WorkspaceBinding
app.post('/api/workspaces', (req: Request, res: Response) => {
  const { repoFullName, branch, vmName, projectId, zone } = req.body;
  const vm = gcpVms.find(v => v.name === vmName);

  const binding: WorkspaceBinding = {
    id: `ws-${Date.now().toString(36)}`,
    name: `${repoFullName.split('/')[1]} on ${vmName}`,
    repo: {
      fullName: repoFullName || 'amanyagami/ide-kshetra',
      branch: branch || 'main',
    },
    compute: {
      type: 'gcp_existing_vm',
      projectId: projectId || vm?.projectId || 'noahlabs-ai-prod',
      zone: zone || vm?.zone || 'us-central1-a',
      vmName: vmName || 'gcp-h100-trainer-01',
      machineType: vm?.machineType || 'a3-highgpu-8g',
      gpuModel: vm?.gpu ? `${vm.gpu.count}x ${vm.gpu.model}` : undefined,
      internalIp: vm?.internalIp || '10.128.0.42',
      isPrivateIpOnly: vm?.isPrivateOnly ?? true,
    },
    status: 'PROVISIONING',
    createdAt: new Date().toISOString(),
  };

  workspaces.unshift(binding);

  res.json({
    status: 'ok',
    message: 'Workspace binding created successfully.',
    workspace: binding,
  });
});

// Open Workspace: Idempotent clone, runtime init, readiness verification
app.post('/api/workspaces/:id/open', (req: Request, res: Response) => {
  const { id } = req.params;
  const ws = workspaces.find(w => w.id === id);

  if (!ws) {
    return res.status(404).json({ status: 'error', message: `Workspace ${id} not found` });
  }

  ws.status = 'READY';
  ws.openedAt = new Date().toISOString();
  ws.leaseId = `lease-gcp-${Date.now().toString(36)}`;
  ws.agentId = `agent-${ws.compute.vmName}`;

  res.json({
    status: 'ok',
    message: 'Workspace opened successfully on running VM.',
    workspace: ws,
    readinessVerified: true,
  });
});

app.post('/api/workspaces/:id/stop', (req: Request, res: Response) => {
  const { id } = req.params;
  const ws = workspaces.find(w => w.id === id);

  if (ws) {
    ws.status = 'STOPPED';
  }

  res.json({
    status: 'ok',
    message: 'Workspace stopped. VM remains running in GCP (no accidental destruction).',
    workspace: ws,
  });
});

// ==========================================
// Vite Middleware / Static Assets
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kshetra] Execution Fabric server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Kshetra] Failed to start server:', err);
});
