import { getDocument, setDocument, subscribeToDocument } from '../../firebase/firestore';
import { api } from '../../store/api';
import { runQuery, syncWhileCached } from '../../store/realtime';
import {
  EXPORT_ACCOUNT_FUNCTION,
  TERMS_VERSION,
  USERS_COLLECTION,
  type AccountExport,
  type UserDocument,
} from './types';

// Loaded on first use, so the Functions SDK stays out of the startup bundle.
const callFunction = async <Request, Response>(name: string, data: Request) => {
  const functions = await import('../../firebase/functions');
  return functions.callFunction<Request, Response>(name, data);
};

// The user document is realtime, so accepting the terms in one tab unlocks the others too.
const legalApi = api.enhanceEndpoints({ addTagTypes: ['UserDocument'] }).injectEndpoints({
  endpoints: (build) => ({
    legalGetUserDocument: build.query<UserDocument | null, string>({
      queryFn: (uid) => runQuery(() => getDocument<UserDocument>(USERS_COLLECTION, uid)),
      onCacheEntryAdded: (uid, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToDocument<UserDocument>(USERS_COLLECTION, uid, (userDocument) =>
              lifecycle.updateCachedData(() => userDocument),
            ),
          lifecycle,
        ),
      providesTags: (_result, _error, uid) => [{ type: 'UserDocument', id: uid }],
    }),
    legalAcceptTerms: build.mutation<null, string>({
      queryFn: (uid) =>
        runQuery(async () => {
          await setDocument<UserDocument>(
            USERS_COLLECTION,
            uid,
            { consent: { termsVersion: TERMS_VERSION, acceptedAt: Date.now() } },
            { merge: true },
          );
          return null;
        }),
      invalidatesTags: (_result, _error, uid) => [{ type: 'UserDocument', id: uid }],
    }),
    // Runs server-side for the signed-in user only; the uid comes from the auth token.
    legalExportAccount: build.mutation<AccountExport, void>({
      queryFn: () =>
        runQuery(() => callFunction<null, AccountExport>(EXPORT_ACCOUNT_FUNCTION, null)),
    }),
  }),
});

export const {
  useLegalGetUserDocumentQuery,
  useLegalAcceptTermsMutation,
  useLegalExportAccountMutation,
} = legalApi;
