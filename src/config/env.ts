const getEnvVar = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    console.warn(`[env] Missing environment variable: ${key}`);
  }

  return value ?? '';
};

export const env = {
  supabaseUrl: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  geminiApiKey: getEnvVar('EXPO_PUBLIC_GEMINI_API_KEY'),
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isGeminiConfigured = Boolean(env.geminiApiKey);

