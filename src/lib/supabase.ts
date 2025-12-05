import { createClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/config/env';

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'chronopal-auth',
    },
  });
};

