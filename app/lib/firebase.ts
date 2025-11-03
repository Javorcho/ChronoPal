import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web App configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCuHQoAuGzE4Ikmkq-749g4aPMmIM5Vus",
  authDomain: "chronopal-f72b1.firebaseapp.com",
  projectId: "chronopal-f72b1",
  storageBucket: "chronopal-f72b1.firebasestorage.app",
  messagingSenderId: "407398932260",
  appId: "1:407398932260:web:35ee8f7d68573b3297ddb1",
  measurementId: "G-048G4N5RC6",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);