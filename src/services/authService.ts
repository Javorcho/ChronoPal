import { isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  uid: string;
  email?: string;
};

const toAuthUser = (user: any): AuthUser | undefined =>
  user ? { uid: user.uid, email: user.email ?? undefined } : undefined;

export const subscribeToAuthChanges = (
  callback: (user?: AuthUser) => void,
): (() => void) => {
  if (!isSupabaseConfigured) {
    callback({ uid: 'demo-user', email: 'demo@chronopal.dev' });
    return () => undefined;
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user
      ? { uid: session.user.id, email: session.user.email ?? undefined }
      : undefined;
    callback(user);
  });

  return data.subscription.unsubscribe;
};

export const signUpWithEmail = async ({ email, password }: AuthCredentials) => {
  if (!isSupabaseConfigured) {
    return { uid: 'demo-user', email };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user ? { uid: data.user.id, email: data.user.email ?? undefined } : undefined;
};

export const signInWithEmail = async ({ email, password }: AuthCredentials) => {
  if (!isSupabaseConfigured) {
    return { uid: 'demo-user', email };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user ? { uid: data.user.id, email: data.user.email ?? undefined } : undefined;
};

export const signOutUser = async () => {
  if (!isSupabaseConfigured) {
    return;
  }

  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
};

