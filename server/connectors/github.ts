import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';

// Real GitHub App connector (Phase 2). Uses installation tokens minted
// on-demand — never a stored personal access token, matching the plan's
// Section 12 requirement (GitHub App, short-lived clone credentials only).

function realEnv(name: string, placeholder: string): string | undefined {
  const value = process.env[name];
  return value && value !== placeholder ? value : undefined;
}

const APP_ID = realEnv('GITHUB_APP_ID', 'MY_GITHUB_APP_ID');
const PRIVATE_KEY = realEnv('GITHUB_APP_PRIVATE_KEY', 'MY_GITHUB_APP_PRIVATE_KEY');

export function isGitHubAppConfigured(): boolean {
  return Boolean(APP_ID && PRIVATE_KEY);
}

function normalizedPrivateKey(): string {
  // .env stores the PEM with literal \n escapes; restore real newlines.
  return PRIVATE_KEY!.replace(/\\n/g, '\n');
}

// App-level Octokit (JWT auth) — used to list/verify installations.
let appOctokit: Octokit | null = null;
export function getAppOctokit(): Octokit {
  if (!isGitHubAppConfigured()) {
    throw new Error('GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY are not set.');
  }
  if (!appOctokit) {
    appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId: APP_ID!, privateKey: normalizedPrivateKey() },
    });
  }
  return appOctokit;
}

// Installation-scoped Octokit client for a given installation id — each call
// mints a fresh token via the auth strategy, so nothing long-lived is cached.
export function getInstallationOctokit(installationId: number): Octokit {
  if (!isGitHubAppConfigured()) {
    throw new Error('GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY are not set.');
  }
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId: APP_ID!, privateKey: normalizedPrivateKey(), installationId },
  });
}

export interface NormalizedRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  description: string;
  updatedAt: string;
}

export async function listInstallationRepos(installationId: number): Promise<NormalizedRepo[]> {
  const octokit = getInstallationOctokit(installationId);
  const { data } = await octokit.request('GET /installation/repositories');
  return data.repositories.map((r: any) => ({
    id: String(r.id),
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    isPrivate: r.private,
    defaultBranch: r.default_branch,
    description: r.description || '',
    updatedAt: r.updated_at,
  }));
}

export async function listBranches(installationId: number, owner: string, repo: string): Promise<string[]> {
  const octokit = getInstallationOctokit(installationId);
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/branches', { owner, repo, per_page: 100 });
  return data.map((b: any) => b.name);
}

// Mint a short-lived installation access token (used only at workspace-open
// time, Phase 4/6) — never stored, never written into a remote URL or .gitconfig.
export async function mintShortLivedCloneToken(installationId: number): Promise<{ token: string; expiresAt: string }> {
  const auth = createAppAuth({ appId: APP_ID!, privateKey: normalizedPrivateKey() });
  const result = await auth({ type: 'installation', installationId });
  return { token: result.token, expiresAt: (result as any).expiresAt };
}

// Verify an installation still belongs to this app and is active — used to
// detect INSTALLATION_REVOKED (plan Section 12.4) rather than silently using
// a stale cached token.
export async function verifyInstallation(installationId: number): Promise<boolean> {
  try {
    await getAppOctokit().request('GET /app/installations/{installation_id}', { installation_id: installationId });
    return true;
  } catch {
    return false;
  }
}
