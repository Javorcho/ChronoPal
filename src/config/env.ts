const getEnvVar = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    console.warn(`[env] Missing environment variable: ${key}`);
  }

  return value ?? '';
};

export const env = {
  firebaseApiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  firebaseAuthDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  firebaseProjectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  firebaseStorageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  firebaseMessagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  firebaseAppId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
  firebaseMeasurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', undefined),
};

export const isFirebaseConfigured = Boolean(
  env.firebaseApiKey &&
    env.firebaseAuthDomain &&
    env.firebaseProjectId &&
    env.firebaseAppId,
);

