import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { isFirebaseConfigured } from '@/config/env';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthUser = Pick<User, 'uid' | 'email'>;

const toAuthUser = (user: User | null): AuthUser | undefined =>
  user ? { uid: user.uid, email: user.email ?? undefined } : undefined;

export const subscribeToAuthChanges = (
  callback: (user?: AuthUser) => void,
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback({ uid: 'demo-user', email: 'demo@chronopal.dev' });
    return () => undefined;
  }

  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => callback(toAuthUser(user)));
};

export const signUpWithEmail = async ({ email, password }: AuthCredentials) => {
  if (!isFirebaseConfigured) {
    return { uid: 'demo-user', email };
  }

  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return toAuthUser(result.user);
};

export const signInWithEmail = async ({ email, password }: AuthCredentials) => {
  if (!isFirebaseConfigured) {
    return { uid: 'demo-user', email };
  }

  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(result.user);
};

export const signOutUser = async () => {
  if (!isFirebaseConfigured) {
    return;
  }

  const auth = getFirebaseAuth();
  await signOut(auth);
};

