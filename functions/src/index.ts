import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { deleteAccount, exportAccount } from './account/account';
export { sendNudges } from './nudges/sendNudges';
