import { Firestore } from '@google-cloud/firestore';

// Kshetra's own control-plane database — holds app state (sessions, connection
// records) and is separate from any GCP project a user connects as a compute
// target. Using Firestore (not process memory) so session state survives
// Cloud Run's multi-instance / scale-to-zero behavior (each instance shares
// the same database instead of holding its own private in-memory Map).
const rawProjectId = process.env.KSHETRA_FIRESTORE_PROJECT_ID;
const KSHETRA_CONTROL_PLANE_PROJECT_ID = rawProjectId && rawProjectId !== 'MY_FIRESTORE_PROJECT_ID' ? rawProjectId : undefined;

let firestoreClient: Firestore | null = null;
let firestoreInitError: Error | null = null;

export function isFirestoreConfigured(): boolean {
  return Boolean(KSHETRA_CONTROL_PLANE_PROJECT_ID);
}

export function getFirestore(): Firestore {
  if (!KSHETRA_CONTROL_PLANE_PROJECT_ID) {
    throw new Error('KSHETRA_FIRESTORE_PROJECT_ID is not set — no control-plane database configured.');
  }
  if (firestoreInitError) throw firestoreInitError;
  if (!firestoreClient) {
    try {
      firestoreClient = new Firestore({ projectId: KSHETRA_CONTROL_PLANE_PROJECT_ID });
    } catch (err: any) {
      firestoreInitError = err;
      throw err;
    }
  }
  return firestoreClient;
}
