import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QueryConstraint,
  type Transaction,
  type Unsubscribe,
} from 'firebase/firestore';
import type { BaseDocument } from '../types';
import { db } from './config';

/** Data a caller provides when writing: everything except the fields managed by these helpers. */
export type DocumentInput<T extends BaseDocument> = Omit<T, keyof BaseDocument>;

/** Path of a collection (or a single document) under the signed-in user's root: users/{uid}/... */
export const userPath = (uid: string, ...segments: string[]): string =>
  ['users', uid, ...segments].join('/');

// Timestamps become epoch millis, at any depth, so documents stay serializable in the Redux store.
const toSerializable = (value: unknown): unknown => {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (Array.isArray(value)) {
    return value.map(toSerializable);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as DocumentData).map(([key, entry]) => [key, toSerializable(entry)]),
    );
  }
  return value;
};

const mapSnapshot = <T extends BaseDocument>(snapshot: DocumentSnapshot): T =>
  ({ id: snapshot.id, ...(toSerializable(snapshot.data() ?? {}) as DocumentData) }) as T;

export const getDocument = async <T extends BaseDocument>(
  path: string,
  id: string,
): Promise<T | null> => {
  const snapshot = await getDoc(doc(db, path, id));
  return snapshot.exists() ? mapSnapshot<T>(snapshot) : null;
};

export const getDocuments = async <T extends BaseDocument>(
  path: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  const snapshot = await getDocs(query(collection(db, path), ...constraints));
  return snapshot.docs.map((docSnapshot) => mapSnapshot<T>(docSnapshot));
};

/** Creates a document with a generated id and returns that id. */
export const createDocument = async <T extends BaseDocument>(
  path: string,
  data: DocumentInput<T>,
): Promise<string> => {
  const ref = await addDoc(collection(db, path), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

interface SetOptions {
  /** Merge into an existing document and keep its createdAt (upsert). */
  merge?: boolean;
}

/**
 * Writes a document with a known id. Without `merge` it overwrites the document.
 * With `merge` it upserts: fields are merged and createdAt is only set when the document is new.
 */
export const setDocument = async <T extends BaseDocument>(
  path: string,
  id: string,
  data: Partial<DocumentInput<T>>,
  { merge = false }: SetOptions = {},
): Promise<void> => {
  const ref = doc(db, path, id);
  if (!merge) {
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return;
  }
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    transaction.set(
      ref,
      {
        ...data,
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
};

export const updateDocument = async <T extends BaseDocument>(
  path: string,
  id: string,
  partial: Partial<DocumentInput<T>>,
): Promise<void> => {
  await updateDoc(doc(db, path, id), { ...partial, updatedAt: serverTimestamp() });
};

export const deleteDocument = async (path: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, path, id));
};

export type BatchOperation =
  | { type: 'set'; path: string; id: string; data: DocumentData }
  | { type: 'update'; path: string; id: string; data: DocumentData }
  | { type: 'delete'; path: string; id: string };

/** Applies several writes atomically (max 500 per batch). set/update add the timestamps. */
export const runBatch = async (operations: BatchOperation[]): Promise<void> => {
  const batch = writeBatch(db);
  operations.forEach((operation) => {
    const ref = doc(db, operation.path, operation.id);
    if (operation.type === 'set') {
      batch.set(ref, {
        ...operation.data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (operation.type === 'update') {
      batch.update(ref, { ...operation.data, updatedAt: serverTimestamp() });
    } else {
      batch.delete(ref);
    }
  });
  await batch.commit();
};

/** Typed, document-level operations available inside runTransactionFn. Reads must come before writes. */
export interface TransactionContext {
  get: <T extends BaseDocument>(path: string, id: string) => Promise<T | null>;
  set: <T extends BaseDocument>(path: string, id: string, data: Partial<DocumentInput<T>>) => void;
  update: <T extends BaseDocument>(
    path: string,
    id: string,
    partial: Partial<DocumentInput<T>>,
  ) => void;
  delete: (path: string, id: string) => void;
}

const toContext = (transaction: Transaction): TransactionContext => ({
  get: async <T extends BaseDocument>(path: string, id: string) => {
    const snapshot = await transaction.get(doc(db, path, id));
    return snapshot.exists() ? mapSnapshot<T>(snapshot) : null;
  },
  set: (path, id, data) => {
    transaction.set(doc(db, path, id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  update: (path, id, partial) => {
    transaction.update(doc(db, path, id), { ...partial, updatedAt: serverTimestamp() });
  },
  delete: (path, id) => {
    transaction.delete(doc(db, path, id));
  },
});

/** Runs a read-modify-write atomically; Firestore retries it on contention. */
export const runTransactionFn = <R>(fn: (context: TransactionContext) => Promise<R>): Promise<R> =>
  runTransaction(db, (transaction) => fn(toContext(transaction)));

export const subscribeToDocument = <T extends BaseDocument>(
  path: string,
  id: string,
  onData: (document: T | null) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe =>
  onSnapshot(
    doc(db, path, id),
    (snapshot) => onData(snapshot.exists() ? mapSnapshot<T>(snapshot) : null),
    onError,
  );

export const subscribeToCollection = <T extends BaseDocument>(
  path: string,
  constraints: QueryConstraint[],
  onData: (documents: T[]) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe =>
  onSnapshot(
    query(collection(db, path), ...constraints),
    (snapshot) => onData(snapshot.docs.map((docSnapshot) => mapSnapshot<T>(docSnapshot))),
    onError,
  );
