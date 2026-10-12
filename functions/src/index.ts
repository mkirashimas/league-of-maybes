import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { exportAccount } from './account/account';
export { sendNudges } from './nudges/sendNudges';
export { onPlayerDeleted } from './players/onPlayerDeleted';
