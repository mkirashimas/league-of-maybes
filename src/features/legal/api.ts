import { getDocument, setDocument, subscribeToDocument } from '../../firebase/firestore';
import { api } from '../../store/api';
import { runQuery, syncWhileCached } from '../../store/realtime';
import { TERMS_VERSION, USERS_COLLECTION, type UserDocument } from './types';

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
  }),
});

export const { useLegalGetUserDocumentQuery, useLegalAcceptTermsMutation } = legalApi;
