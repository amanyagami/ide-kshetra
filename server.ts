import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import {
  UserProfile,
  UserSession,
  GcpProject,
  GcpVmInstance,
  GitHubRepo,
  WorkspaceBinding,
  DataMode,
  TypedError,
} from './src/types/fabric';
import {
  isGoogleOAuthConfigured,
  createOAuth2Client,
  LOGIN_SCOPES,
  GCP_DISCOVERY_SCOPES,
  createSessionId,
  getSession,
  putSession,
  deleteSession,
  createState,
  consumeState,
  buildUserSession,
  buildAuthedClientForSession,
  hasGcpScope,
} from './server/auth/googleAuth';
import {
  isGitHubAppConfigured,
  listInstallationRepos,
  listBranches,
  verifyInstallation,
} from './server/connectors/github';
import { listProjects, listInstances, getUtilization } from './server/connectors/gcp';

function realEnvVar(name: string, placeholder: string): string | undefined {
  const value = process.env[name];
  return value && value !== placeholder ? value : undefined;
}

const app = express();
app.use(express.json());
app.use(cookieParser());

const SESSION_COOKIE = 'kshetra_sid';

// KSHETRA_DATA_MODE: 'mock' (default) plays back the demo fixtures below.
// 'live' fails closed — every endpoint below that isn't backed by a real
// provider integration yet returns a typed error instead of fake success.
const DATA_MODE: DataMode = process.env.KSHETRA_DATA_MODE === 'live' ? 'live' : 'mock';

function typedError(res: Response, httpStatus: number, error: TypedError) {
  return res.status(httpStatus).json(error);
}

// Rejects a route in live mode with a typed error unless a real implementation
// has been wired in (see server/connectors/*). Applied to every endpoint that
// today still reads from the hardcoded demo fixtures.
function liveModeNotConfigured(providerLabel: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (DATA_MODE === 'live') {
      return typedError(res, 501, {
        status: 'error',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        message: `${providerLabel} is not connected to a real backend yet in live mode. See the phased build plan for the real integration for this endpoint.`,
      });
    }
    next();
  };
}

function unauthenticatedSession(): UserSession {
  return {
    isAuthenticated: false,
    user: null,
    connections: {
      github: { connected: false, authorizedReposCount: 0 },
      gcp: { connected: false, discoveredProjectsCount: 0, discoveredVmsCount: 0 },
    },
  };
}

// In-Memory Database for Production Demonstration (mock mode only)
let currentSession: UserSession = DATA_MODE === 'live' ? unauthenticatedSession() : {
  isAuthenticated: true,
  user: {
    id: 'usr_noah_9941a',
    email: 'aman@noahlabs.ai',
    name: 'Aman (NoahLabs)',
    avatarUrl: '/src/assets/images/avatar_engineer_1790479540008.jpg',
    role: 'owner',
    organization: 'noahlabs.ai',
  },
  sessionToken: 'sess_kshetra_78a1bc9204e',
  signedInAt: new Date().toISOString(),
  connections: {
    github: {
      connected: true,
      account: 'amanyagami',
      installationId: 'gh-inst-8849201',
      authorizedReposCount: 3,
    },
    gcp: {
      connected: true,
      userEmail: 'aman@noahlabs.ai',
      activeProjectId: 'noahlabs-ai-prod',
      discoveredProjectsCount: 3,
      discoveredVmsCount: 6,
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
// 0. Environment / data-mode indicator
// ==========================================

app.get('/api/config', (_req: Request, res: Response) => {
  res.json({ status: 'ok', dataMode: DATA_MODE });
});

// ==========================================
// 1. Session & Authentication Endpoints
// ==========================================

app.get('/api/session', async (req: Request, res: Response) => {
  if (DATA_MODE === 'live') {
    try {
      const record = await getSession(req.cookies?.[SESSION_COOKIE]);
      return res.json({ status: 'ok', session: record?.session || unauthenticatedSession() });
    } catch (err: any) {
      console.error('[Kshetra] Session lookup failed:', err);
      return typedError(res, 500, { status: 'error', errorCode: 'PROVIDER_NOT_CONFIGURED', message: `Session store unavailable: ${err.message || err}` });
    }
  }
  res.json({
    status: 'ok',
    session: currentSession,
  });
});

// Real Google OAuth 2.0 login (Phase 1). Only meaningful in live mode — mock
// mode keeps using the instant demo /api/auth/login form below.
app.get('/api/auth/google/login', (req: Request, res: Response) => {
  if (DATA_MODE !== 'live') {
    return typedError(res, 400, {
      status: 'error',
      errorCode: 'NOT_IMPLEMENTED',
      message: 'Real Google login only runs in live mode. Set KSHETRA_DATA_MODE=live.',
    });
  }
  if (!isGoogleOAuthConfigured()) {
    return typedError(res, 501, {
      status: 'error',
      errorCode: 'PROVIDER_NOT_CONFIGURED',
      message: 'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set in .env. See the phased build plan for how to create them.',
    });
  }
  const client = createOAuth2Client();
  const state = createState([], req.cookies?.[SESSION_COOKIE]);
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: LOGIN_SCOPES,
    state,
  });
  res.redirect(authUrl);
});

// Incremental consent (plan Section 11.1): a signed-in user explicitly clicks
// "Connect Google Cloud" to grant the additional read-only Cloud scope —
// separate from login, on the SAME OAuth client, so no second app registration
// is needed. Reuses the existing session id rather than creating a new session.
app.get('/api/connections/gcp/start', (req: Request, res: Response) => {
  if (DATA_MODE !== 'live' || !isGoogleOAuthConfigured()) {
    return typedError(res, 501, { status: 'error', errorCode: 'PROVIDER_NOT_CONFIGURED', message: 'Google OAuth is not configured.' });
  }
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) {
    return typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: 'Sign in to Kshetra before connecting Google Cloud.' });
  }
  const client = createOAuth2Client();
  const state = createState(GCP_DISCOVERY_SCOPES, sessionId);
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: GCP_DISCOVERY_SCOPES,
    state,
  });
  res.redirect(authUrl);
});

app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
  if (DATA_MODE !== 'live' || !isGoogleOAuthConfigured()) {
    return typedError(res, 400, {
      status: 'error',
      errorCode: 'PROVIDER_NOT_CONFIGURED',
      message: 'Google login is not configured.',
    });
  }
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  if (error) {
    return typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: `Google login was not completed: ${error}` });
  }
  const stateRecord = consumeState(String(state || ''));
  if (!stateRecord) {
    return typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: 'Invalid or expired OAuth state (possible CSRF attempt) — please try signing in again.' });
  }
  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(String(code));
    client.setCredentials(tokens);

    // Incremental-consent branch: attach the new (Cloud-scoped) tokens to the
    // EXISTING session instead of minting a new one.
    if (stateRecord.existingSessionId) {
      const existing = await getSession(stateRecord.existingSessionId);
      if (!existing) {
        return typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: 'Your Kshetra session expired — sign in again before connecting Google Cloud.' });
      }
      const mergedTokens = { ...existing.googleTokens, ...tokens, refresh_token: tokens.refresh_token || existing.googleTokens.refresh_token };
      existing.session.connections.gcp = { connected: true, userEmail: existing.user.email, discoveredProjectsCount: 0, discoveredVmsCount: 0 };
      await putSession(stateRecord.existingSessionId, { ...existing, googleTokens: mergedTokens });
      return res.redirect('/');
    }

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: process.env.GOOGLE_OAUTH_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error('Google ID token did not include the expected claims.');
    }
    const identity = { sub: payload.sub, email: payload.email, name: payload.name || payload.email, picture: payload.picture || '' };
    const sessionId = createSessionId();
    const session = buildUserSession(identity);
    await putSession(sessionId, { user: identity, session, googleTokens: tokens });
    res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.redirect('/');
  } catch (err: any) {
    console.error('[Kshetra] Google OAuth callback failed:', err);
    typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: `Google login failed: ${err.message || err}` });
  }
});

app.post('/api/auth/login', liveModeNotConfigured('Real Google OAuth login'), (req: Request, res: Response) => {
  const { email, name, organization } = req.body;
  const userEmail = email || 'aman@noahlabs.ai';

  currentSession = {
    isAuthenticated: true,
    user: {
      id: `usr_${Date.now().toString(36)}`,
      email: userEmail,
      name: name || userEmail.split('@')[0],
      avatarUrl: '/src/assets/images/avatar_engineer_1790479540008.jpg',
      role: 'owner',
      organization: organization || 'noahlabs.ai',
    },
    sessionToken: `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    signedInAt: new Date().toISOString(),
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
        activeProjectId: 'noahlabs-ai-prod',
        discoveredProjectsCount: gcpProjects.length,
        discoveredVmsCount: gcpVms.length,
      },
    },
  };

  res.json({
    status: 'ok',
    message: `Signed in successfully as ${userEmail}`,
    session: currentSession,
  });
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  if (DATA_MODE === 'live') {
    await deleteSession(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE);
    return res.json({ status: 'ok', message: 'Signed out successfully' });
  }
  currentSession = unauthenticatedSession();
  res.json({ status: 'ok', message: 'Signed out successfully' });
});

// ==========================================
// 2. Google Cloud Platform VM Endpoints
// ==========================================

app.get('/api/gcp/status', liveModeNotConfigured('Google Cloud Platform'), (_req: Request, res: Response) => {
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

app.post('/api/gcp/connect', liveModeNotConfigured('Google Cloud Platform'), (req: Request, res: Response) => {
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

app.get('/api/gcp/projects', liveModeNotConfigured('Google Cloud Platform'), (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    projects: gcpProjects,
    activeProjectId: currentSession.connections.gcp.activeProjectId || gcpProjects[0].id,
  });
});

// ==========================================
// 2b. GCP — real endpoints (live mode only)
// ==========================================

async function requireGcpSession(req: Request, res: Response): Promise<{ sessionId: string; record: Awaited<ReturnType<typeof getSession>> } | undefined> {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  const record = await getSession(sessionId);
  if (!record) {
    typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: 'Sign in to Kshetra first.' });
    return undefined;
  }
  if (!hasGcpScope(record)) {
    typedError(res, 401, { status: 'error', errorCode: 'REAUTH_REQUIRED', message: 'Connect Google Cloud first (GET /api/connections/gcp/start).' });
    return undefined;
  }
  return { sessionId, record };
}

app.get('/api/connections/gcp/:sessionId/projects', async (req: Request, res: Response) => {
  if (DATA_MODE !== 'live') return typedError(res, 400, { status: 'error', errorCode: 'NOT_IMPLEMENTED', message: 'Only available in live mode.' });
  const ctx = await requireGcpSession(req, res);
  if (!ctx) return;
  try {
    const client = buildAuthedClientForSession(ctx.sessionId, ctx.record!);
    const projects = await listProjects(client);
    res.json({ status: 'ok', projects });
  } catch (err: any) {
    typedError(res, 502, { status: 'error', errorCode: 'PROJECT_NOT_FOUND', message: `Failed to list projects: ${err.message || err}` });
  }
});

app.get('/api/connections/gcp/:sessionId/projects/:projectId/instances', async (req: Request, res: Response) => {
  if (DATA_MODE !== 'live') return typedError(res, 400, { status: 'error', errorCode: 'NOT_IMPLEMENTED', message: 'Only available in live mode.' });
  const ctx = await requireGcpSession(req, res);
  if (!ctx) return;
  try {
    const client = buildAuthedClientForSession(ctx.sessionId, ctx.record!);
    const instances = await listInstances(client, req.params.projectId);
    // Best-effort utilization enrichment — never fails the whole request if
    // Monitoring is unavailable (e.g. billing not enabled on the project).
    const enriched = await Promise.all(instances.map(async (vm) => {
      if (vm.status !== 'RUNNING') return vm;
      const util = await getUtilization(client, req.params.projectId, vm.id).catch(() => ({}));
      return { ...vm, ...util };
    }));
    res.json({ status: 'ok', vms: enriched });
  } catch (err: any) {
    typedError(res, 502, { status: 'error', errorCode: 'TARGET_NOT_FOUND', message: `Failed to list instances: ${err.message || err}` });
  }
});

app.get('/api/gcp/projects/:projectId/vms', liveModeNotConfigured('Google Cloud Platform'), (req: Request, res: Response) => {
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

app.get('/api/gcp/vms', liveModeNotConfigured('Google Cloud Platform'), (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    totalVms: gcpVms.length,
    runningVms: gcpVms.filter(v => v.status === 'RUNNING').length,
    vms: gcpVms,
  });
});

// Preflight Check for GCP VM (IAP tunneling, OS Login, NVIDIA Driver)
app.post('/api/gcp/vms/:projectId/:zone/:name/preflight', liveModeNotConfigured('GCP VM preflight'), (req: Request, res: Response) => {
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
app.post('/api/gcp/vms/:projectId/:zone/:name/connect', liveModeNotConfigured('GCP VM agent bootstrap'), (req: Request, res: Response) => {
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
app.post('/api/gcp/vms/:projectId/:zone/:name/action', liveModeNotConfigured('GCP VM control'), (req: Request, res: Response) => {
  const { projectId, name } = req.params;
  const { action } = req.body; // 'start' | 'stop' | 'reset'
  const vm = gcpVms.find(v => v.name === name && v.projectId === projectId);

  if (!vm) {
    return res.status(404).json({ status: 'error', message: `VM ${name} not found` });
  }

  if (action === 'start') {
    vm.status = 'RUNNING';
    vm.agentStatus = 'CONNECTED';
  } else if (action === 'stop') {
    vm.status = 'TERMINATED';
    vm.agentStatus = 'OFFLINE';
  } else if (action === 'reset') {
    vm.status = 'RUNNING';
    vm.agentStatus = 'CONNECTED';
  }

  res.json({
    status: 'ok',
    action,
    vmName: name,
    newStatus: vm.status,
    vm,
  });
});

// ==========================================
// 3. GitHub App Endpoints
// ==========================================

app.get('/api/github/status', liveModeNotConfigured('GitHub App'), (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    connected: currentSession.connections.github.connected,
    account: currentSession.connections.github.account,
    installationId: currentSession.connections.github.installationId,
    authorizedRepos: githubRepos,
  });
});

app.post('/api/github/connect', liveModeNotConfigured('GitHub App'), (req: Request, res: Response) => {
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

app.get('/api/github/repos', liveModeNotConfigured('GitHub App'), (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    repos: githubRepos,
  });
});

app.get('/api/github/repos/:owner/:repo/branches', liveModeNotConfigured('GitHub App'), (req: Request, res: Response) => {
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
// 3b. GitHub App — real endpoints (live mode only)
// ==========================================

app.get('/api/connections/github/start', (req: Request, res: Response) => {
  if (DATA_MODE !== 'live') {
    return typedError(res, 400, { status: 'error', errorCode: 'NOT_IMPLEMENTED', message: 'Real GitHub connection only runs in live mode.' });
  }
  const appSlug = realEnvVar('GITHUB_APP_SLUG', 'MY_GITHUB_APP_SLUG');
  if (!isGitHubAppConfigured() || !appSlug) {
    return typedError(res, 501, { status: 'error', errorCode: 'PROVIDER_NOT_CONFIGURED', message: 'GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY / GITHUB_APP_SLUG are not set in .env.' });
  }
  res.redirect(`https://github.com/apps/${appSlug}/installations/new`);
});

app.get('/api/connections/github/callback', async (req: Request, res: Response) => {
  if (DATA_MODE !== 'live' || !isGitHubAppConfigured()) {
    return typedError(res, 400, { status: 'error', errorCode: 'PROVIDER_NOT_CONFIGURED', message: 'GitHub App is not configured.' });
  }
  const installationId = Number(req.query.installation_id);
  if (!installationId) {
    return typedError(res, 400, { status: 'error', errorCode: 'REPOSITORY_NOT_FOUND', message: 'No installation_id returned by GitHub.' });
  }
  const sessionId = req.cookies?.[SESSION_COOKIE];
  const record = await getSession(sessionId);
  if (!record) {
    return typedError(res, 401, { status: 'error', errorCode: 'AUTH_REQUIRED', message: 'Sign in to Kshetra before connecting GitHub.' });
  }
  const ok = await verifyInstallation(installationId);
  if (!ok) {
    return typedError(res, 401, { status: 'error', errorCode: 'INSTALLATION_REVOKED', message: 'GitHub could not verify this installation.' });
  }
  record.session.connections.github = { connected: true, installationId: String(installationId), authorizedReposCount: 0 };
  await putSession(sessionId, record);
  res.redirect('/');
});

app.get('/api/connections/github/:id/repositories', async (req: Request, res: Response) => {
  if (DATA_MODE !== 'live') {
    return typedError(res, 400, { status: 'error', errorCode: 'NOT_IMPLEMENTED', message: 'Real GitHub repo listing only runs in live mode.' });
  }
  try {
    const repos = await listInstallationRepos(Number(req.params.id));
    res.json({ status: 'ok', repos });
  } catch (err: any) {
    typedError(res, 401, { status: 'error', errorCode: 'REAUTH_REQUIRED', message: `Failed to list repositories: ${err.message || err}` });
  }
});

app.get('/api/connections/github/:id/repositories/:owner/:repo/branches', async (req: Request, res: Response) => {
  if (DATA_MODE !== 'live') {
    return typedError(res, 400, { status: 'error', errorCode: 'NOT_IMPLEMENTED', message: 'Real GitHub branch listing only runs in live mode.' });
  }
  try {
    const branches = await listBranches(Number(req.params.id), req.params.owner, req.params.repo);
    res.json({ status: 'ok', branches });
  } catch (err: any) {
    typedError(res, 404, { status: 'error', errorCode: 'REPOSITORY_NOT_FOUND', message: `Failed to list branches: ${err.message || err}` });
  }
});

// ==========================================
// 4. Workspace Binding & Lifecycle Endpoints
// ==========================================

app.get('/api/workspaces', liveModeNotConfigured('Workspace runtime'), (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    workspaces,
  });
});

// Create Binding: RepositorySelection + ComputeTarget = WorkspaceBinding
app.post('/api/workspaces', liveModeNotConfigured('Workspace runtime'), (req: Request, res: Response) => {
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
app.post('/api/workspaces/:id/open', liveModeNotConfigured('Workspace runtime'), (req: Request, res: Response) => {
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

app.post('/api/workspaces/:id/stop', liveModeNotConfigured('Workspace runtime'), (req: Request, res: Response) => {
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
