import type { BaseDocument } from '../../types';

export const LEGAL_NAMESPACE = 'legal';

/** Bump this when the Terms or Privacy text changes materially: every user is asked to accept again. */
export const TERMS_VERSION = '2026-10-12';

/** The users collection; this feature owns the users/{uid} document itself. */
export const USERS_COLLECTION = 'users';

export interface Consent {
  termsVersion: string;
  /** Epoch millis on the device when the user accepted. */
  acceptedAt: number;
}

/** users/{uid}. Only `consent` for now; the account features add nothing here. */
export interface UserDocument extends BaseDocument {
  consent?: Consent;
}

/** A titled block of legal text, read from the locale files with returnObjects. */
export interface LegalSection {
  title: string;
  body: string;
}

export const hasAcceptedCurrentTerms = (userDocument: UserDocument | null | undefined): boolean =>
  userDocument?.consent?.termsVersion === TERMS_VERSION;
