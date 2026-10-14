import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentDeleted } from 'firebase-functions/firestore';
import { FUNCTION_OPTIONS } from '../options';

/** Per-player records keyed by a `playerId` field (owned by intel, chat, dates, agenda, keyNotes, cycle). */
const BY_PLAYER_ID = ['intel', 'chatNotes', 'dates', 'agendaItems', 'keyNotes', 'cycleNotes'];

/** Per-player records whose document id is the player id (owned by chat, dates and cycle). */
const BY_DOC_ID = ['chatProfiles', 'chatStates', 'dateSummaries', 'cycleProfiles'];

/**
 * When the roster deletes a player, removes every record linked to them, so the features stay
 * isolated on the client: each one only ever writes its own collections.
 */
export const onPlayerDeleted = onDocumentDeleted(
  { ...FUNCTION_OPTIONS, document: 'users/{uid}/players/{playerId}' },
  async (event) => {
    const { uid, playerId } = event.params;
    const db = getFirestore();
    const user = db.doc(`users/${uid}`);
    const writer = db.bulkWriter();
    let deleted = 0;
    // BulkWriter retries failed writes; what still fails is logged rather than left unhandled.
    const remove = (ref: FirebaseFirestore.DocumentReference) => {
      deleted += 1;
      writer.delete(ref).catch((error) => logger.error('Delete failed', { path: ref.path, error }));
    };

    for (const name of BY_PLAYER_ID) {
      const records = await user.collection(name).where('playerId', '==', playerId).get();
      records.docs.forEach((record) => remove(record.ref));
    }
    for (const name of BY_DOC_ID) {
      remove(user.collection(name).doc(playerId));
    }

    await writer.close();
    logger.info('Player records deleted', { uid, playerId, deleted });
  },
);
