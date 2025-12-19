import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/config/env';

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  // Return existing instance if available (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance
  supabaseInstance = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'chronopal-auth',
      detectSessionInUrl: true, // Parse OAuth callback URL automatically
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
};
