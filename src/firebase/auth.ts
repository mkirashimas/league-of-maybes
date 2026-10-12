import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signOut = () => firebaseSignOut(auth);

export const onAuthChanged = (callback: (user: User | null) => void): Unsubscribe =>
  onAuthStateChanged(auth, callback);
