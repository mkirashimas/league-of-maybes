import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public Firebase web config (not a secret). Security is enforced by Firestore rules and Auth.
const firebaseConfig = {
  apiKey: 'AIzaSyA7YrAu7VKoW0WN_GO1FLO8X9U6qS9g-w8',
  authDomain: 'league-of-maybes.firebaseapp.com',
  projectId: 'league-of-maybes',
  storageBucket: 'league-of-maybes.firebasestorage.app',
  messagingSenderId: '393167948351',
  appId: '1:393167948351:web:a918fbeadfd52908e1c68a',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
