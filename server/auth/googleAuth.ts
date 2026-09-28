import crypto from 'crypto';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { UserSession } from '../../src/types/fabric';
import { getFirestore, isFirestoreConfigured } from '../store/firestore';

// Real Google OAuth 2.0 authorization-code login (Phase 1) plus the
// incremental Cloud-scope consent used by later phases (GCP discovery).
//
// Design constraint (explicit user requirement): this must work for ANY
// Google account that connects, not one fixed identity. So per-user OAuth
// tokens are stored per session, never as a single shared/server credential.

function realEnv(name: string, placeholder: string): string | undefined {
  const value = process.env[name];
  return value && value !== placeholder ? value : undefined;
}

const CLIENT_ID = realEnv('GOOGLE_OAUTH_CLIENT_ID', 'MY_GOOGLE_OAUTH_CLIENT_ID');
const CLIENT_SECRET = realEnv('GOOGLE_OAUTH_CLIENT_SECRET', 'MY_GOOGLE_OAUTH_CLIENT_SECRET');
const REDIRECT_BASE = realEnv('APP_URL', 'MY_APP_URL') || `http://localhost:${process.env.PORT || 3000}`;
const REDIRECT_URI = `${REDIRECT_BASE}/api/auth/google/callback`;

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export function createOAuth2Client(): OAuth2Client {
  if (!isGoogleOAuthConfigured()) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set.');
  }
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// Login-only scopes (Section 5.1 of the plan: login must not imply cloud access).
export const LOGIN_SCOPES = ['openid', 'email', 'profile'];

// Added only when the user explicitly clicks "Connect Google Cloud" (Phase 3).
export const GCP_DISCOVERY_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform.read-only',
];

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export interface SessionRecord {
  user: GoogleIdentity;
  session: UserSession;
  googleTokens: Credentials;
}

// Session store: Firestore-backed (see server/store/firestore.ts) so session
// state is shared across every Cloud Run instance rather than living in one
// process's memory — a single instance's memory would randomly "log out"
// users whose next request lands on a different instance, and would wipe
// everyone out on scale-to-zero. Sessions are keyed by an opaque id delivered
// via an HttpOnly cookie; the Firestore document holds the actual record.
const SESSIONS_COLLECTION = 'kshetra_sessions';

export function createSessionId(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function getSession(sessionId: string | undefined): Promise<SessionRecord | undefined> {
  if (!sessionId || !isFirestoreConfigured()) return undefined;
  const doc = await getFirestore().collection(SESSIONS_COLLECTION).doc(sessionId).get();
  return doc.exists ? (doc.data() as SessionRecord) : undefined;
}

export async function putSession(sessionId: string, record: SessionRecord): Promise<void> {
  await getFirestore().collection(SESSIONS_COLLECTION).doc(sessionId).set(record);
}

export async function deleteSession(sessionId: string | undefined): Promise<void> {
  if (!sessionId || !isFirestoreConfigured()) return;
  await getFirestore().collection(SESSIONS_COLLECTION).doc(sessionId).delete();
}

// Anti-CSRF `state` for the authorization-code round trip (plan Section 5.5 /
// 17.1). Implemented as a self-contained signed token (HMAC-SHA256) rather
// than a server-side lookup table, so the callback can land on ANY Cloud Run
// instance and still verify it — no shared "pending states" store needed.
const STATE_SECRET = process.env.KSHETRA_SESSION_SECRET || (() => {
  console.warn('[Kshetra] KSHETRA_SESSION_SECRET is not set — using an ephemeral random secret. OAuth state tokens will stop verifying across process restarts. Set this env var for real deployments.');
  return crypto.randomBytes(32).toString('hex');
})();

export function createState(addScopes: string[], existingSessionId?: string): string {
  const payload = JSON.stringify({ createdAt: Date.now(), addScopes, existingSessionId, nonce: crypto.randomBytes(8).toString('hex') });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', STATE_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function consumeState(state: string) {
  const [payloadB64, signature] = state.split('.');
  if (!payloadB64 || !signature) return undefined;
  const expected = crypto.createHmac('sha256', STATE_SECRET).update(payloadB64).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
  try {
    const record = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() - record.createdAt > 10 * 60 * 1000) return undefined; // expired (>10min)
    return record as { createdAt: number; addScopes: string[]; existingSessionId?: string };
  } catch {
    return undefined;
  }
}

// Builds a real per-user OAuth2Client from this session's stored tokens (for
// GCP API calls, Phase 3/4). Persists refreshed tokens back to Firestore so
// the refresh only has to happen once, not on every request.
export function buildAuthedClientForSession(sessionId: string, record: SessionRecord): OAuth2Client {
  const client = createOAuth2Client();
  client.setCredentials(record.googleTokens);
  client.on('tokens', (tokens) => {
    const merged = { ...record.googleTokens, ...tokens };
    putSession(sessionId, { ...record, googleTokens: merged }).catch((err) =>
      console.error('[Kshetra] Failed to persist refreshed GCP tokens:', err)
    );
  });
  return client;
}

export function hasGcpScope(record: SessionRecord): boolean {
  const scope = (record.googleTokens as any).scope as string | undefined;
  return Boolean(scope && GCP_DISCOVERY_SCOPES.every((s) => scope.includes(s)));
}

export function buildUserSession(identity: GoogleIdentity, existing?: UserSession): UserSession {
  return {
    isAuthenticated: true,
    user: {
      id: `usr_${identity.sub}`,
      email: identity.email,
      name: identity.name,
      avatarUrl: identity.picture,
      role: 'owner',
      organization: identity.email.split('@')[1] || 'unknown',
    },
    signedInAt: existing?.signedInAt || new Date().toISOString(),
    connections: existing?.connections || {
      github: { connected: false, authorizedReposCount: 0 },
      gcp: { connected: false, discoveredProjectsCount: 0, discoveredVmsCount: 0 },
    },
  };
}
