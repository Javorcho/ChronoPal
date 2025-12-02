import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirestoreDb } from '@/lib/firebase';
import {
  Activity,
  ActivityId,
  ActivityInput,
  ActivityUpdate,
} from '@/types/schedule';
import { isFirebaseConfigured } from '@/config/env';
import { getMockActivities } from '@/utils/mockActivities';

const COLLECTION = 'activities';

export const subscribeToActivities = (
  userId: string,
  callback: (activities: Activity[]) => void,
) => {
  if (!isFirebaseConfigured) {
    callback(getMockActivities(userId));
    return () => undefined;
  }

  const db = getFirestoreDb();
  const activitiesRef = collection(db, COLLECTION);

  const q = query(
    activitiesRef,
    where('userId', '==', userId),
    orderBy('startTime', 'asc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Activity),
      }));
      callback(data);
    },
    (error) => {
      console.warn('[activityService] subscription error', error);
    },
  );
};

export const fetchActivities = async (userId: string): Promise<Activity[]> => {
  if (!isFirebaseConfigured) {
    return getMockActivities(userId);
  }

  const db = getFirestoreDb();
  const activitiesRef = collection(db, COLLECTION);

  const q = query(
    activitiesRef,
    where('userId', '==', userId),
    orderBy('startTime', 'asc'),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Activity),
  }));
};

export const createActivity = async (
  input: ActivityInput,
): Promise<Activity> => {
  if (!isFirebaseConfigured) {
    const fallbackActivity: Activity = {
      id: `mock-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...input,
    };
    return fallbackActivity;
  }

  const db = getFirestoreDb();
  const activitiesRef = collection(db, COLLECTION);
  const payload = {
    ...input,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const docRef = await addDoc(activitiesRef, payload);
  return { id: docRef.id, ...payload };
};

export const updateActivity = async (
  id: ActivityId,
  updates: ActivityUpdate,
) => {
  if (!isFirebaseConfigured) {
    return;
  }

  const db = getFirestoreDb();
  const activityRef = doc(db, COLLECTION, id);
  await updateDoc(activityRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const removeActivity = async (id: ActivityId) => {
  if (!isFirebaseConfigured) {
    return;
  }

  const db = getFirestoreDb();
  const activityRef = doc(db, COLLECTION, id);
  await deleteDoc(activityRef);
};

