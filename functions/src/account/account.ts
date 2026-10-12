import {
  getFirestore,
  Timestamp,
  type DocumentData,
  type DocumentReference,
} from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/https';
import { FUNCTION_OPTIONS } from '../options';

/** Callables accept requests only from the app (App Check) and act on the caller's own uid (R16). */
const CALLABLE_OPTIONS = { ...FUNCTION_OPTIONS, enforceAppCheck: true };

const requireUid = (request: CallableRequest): string => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth.uid;
};

/** Timestamps become ISO strings, at any depth, so the export is plain JSON. */
const toJson = (value: unknown): unknown => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as DocumentData).map(([key, entry]) => [key, toJson(entry)]),
    );
  }
  return value;
};

/** An exported document: its fields, plus its subcollections when it has any. */
interface ExportedDocument {
  id: string;
  data: unknown;
  collections?: Record<string, ExportedDocument[]>;
}

const exportDocument = async (ref: DocumentReference): Promise<ExportedDocument> => {
  const snapshot = await ref.get();
  const exported: ExportedDocument = { id: ref.id, data: toJson(snapshot.data() ?? null) };

  const subcollections = await ref.listCollections();
  if (subcollections.length > 0) {
    exported.collections = {};
    for (const collection of subcollections) {
      // listDocuments also finds documents that only exist as parents of subcollections.
      const refs = await collection.listDocuments();
      exported.collections[collection.id] = await Promise.all(refs.map(exportDocument));
    }
  }
  return exported;
};

export interface AccountExport {
  exportedAt: string;
  uid: string;
  user: ExportedDocument;
}

/** Everything under users/{uid}, as JSON. */
export const exportAccount = onCall(CALLABLE_OPTIONS, async (request): Promise<AccountExport> => {
  const uid = requireUid(request);
  const user = await exportDocument(getFirestore().doc(`users/${uid}`));
  return { exportedAt: new Date().toISOString(), uid, user };
});
