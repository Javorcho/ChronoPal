import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { env, isFirebaseConfigured } from '@/config/env';

let firebaseApp: FirebaseApp | undefined;

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
  measurementId: env.firebaseMeasurementId,
};

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase credentials missing. Populate EXPO_PUBLIC_FIREBASE_* variables.',
    );
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  const existing = getApps();

  firebaseApp = existing.length ? existing[0] : initializeApp(firebaseConfig);

  return firebaseApp;
};

export const getFirebaseAuth = () => getAuth(getFirebaseApp());
export const getFirestoreDb = () => getFirestore(getFirebaseApp());

