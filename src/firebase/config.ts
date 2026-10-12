import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public Firebase web config (not a secret). Security is enforced by Firestore rules, Auth and App Check.
export const firebaseConfig = {
  apiKey: 'AIzaSyA7YrAu7VKoW0WN_GO1FLO8X9U6qS9g-w8',
  authDomain: 'league-of-maybes.firebaseapp.com',
  projectId: 'league-of-maybes',
  storageBucket: 'league-of-maybes.firebasestorage.app',
  messagingSenderId: '393167948351',
  appId: '1:393167948351:web:a918fbeadfd52908e1c68a',
};

/** Public App Check site key (reCAPTCHA Enterprise / Fraud Defense, score-based). */
const APP_CHECK_SITE_KEY = '6Ld7sestAAAAAC7Mzv3ItmDWI826PmLB2iGVS68e';

export const app = initializeApp(firebaseConfig);

// In dev, App Check prints a debug token in the console; register it once in the Firebase
// console (App Check → Apps → Manage debug tokens). Never set a real token value in code.
if (import.meta.env.DEV) {
  (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
