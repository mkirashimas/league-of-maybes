import type { Unsubscribe } from 'firebase/firestore';

/** Serializable error stored by RTK Query when a Firestore call fails. */
export interface QueryError {
  code: string;
  message: string;
}

const toQueryError = (error: unknown): QueryError => ({
  code:
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unknown',
  message: error instanceof Error ? error.message : String(error),
});

/** Runs a Firestore call inside a queryFn and returns RTK Query's { data } / { error } shape. */
export const runQuery = async <T>(
  call: () => Promise<T>,
): Promise<{ data: T } | { error: QueryError }> => {
  try {
    return { data: await call() };
  } catch (error) {
    return { error: toQueryError(error) };
  }
};

interface CacheLifecycle {
  cacheDataLoaded: Promise<unknown>;
  cacheEntryRemoved: Promise<unknown>;
}

/**
 * Keeps a cache entry in sync with a Firestore listener for as long as the entry exists.
 * Use from onCacheEntryAdded; `subscribe` should push snapshots with updateCachedData.
 */
export const syncWhileCached = async (
  subscribe: () => Unsubscribe,
  { cacheDataLoaded, cacheEntryRemoved }: CacheLifecycle,
): Promise<void> => {
  let unsubscribe: Unsubscribe | undefined;
  try {
    await cacheDataLoaded;
    unsubscribe = subscribe();
  } catch {
    // The entry was removed before its first load finished; nothing to listen to.
  }
  await cacheEntryRemoved;
  unsubscribe?.();
};

interface AuthStateHolder {
  auth: { user: { uid: string } | null };
}

/**
 * The signed-in user's uid, read from the store inside a queryFn or onCacheEntryAdded
 * (`getState` from the endpoint's api argument). Throws when nobody is signed in.
 */
export const requireUid = (getState: () => unknown): string => {
  const uid = (getState() as AuthStateHolder).auth.user?.uid;
  if (!uid) {
    throw new Error('Not signed in');
  }
  return uid;
};
