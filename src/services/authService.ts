import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

// Required for web OAuth
WebBrowser.maybeCompleteAuthSession();

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  uid: string;
  email?: string;
  provider?: string;
  accessToken?: string; // For calendar API access
};

export type OAuthProvider = 'google' | 'azure' | 'apple';

const toAuthUser = (user: any, accessToken?: string): AuthUser | undefined =>
  user
    ? {
        uid: user.id ?? user.uid,
        email: user.email ?? undefined,
        provider: user.app_metadata?.provider,
        accessToken,
      }
    : undefined;

// Get the redirect URI for OAuth
const getRedirectUri = () => {
  return makeRedirectUri({
    scheme: 'chronopal',
    path: 'auth/callback',
  });
};

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

// OAuth Sign-In with Google, Microsoft (Azure), or Apple
export const signInWithOAuth = async (provider: OAuthProvider) => {
  if (!isSupabaseConfigured) {
    return { uid: 'demo-user', email: `demo-${provider}@chronopal.dev`, provider };
  }

  const supabase = getSupabaseClient();
  const redirectUri = getRedirectUri();

  // Map provider names to Supabase provider names
  const supabaseProvider = provider === 'azure' ? 'azure' : provider;

  // Define scopes for calendar access
  const scopes: Record<OAuthProvider, string> = {
    google: 'email profile https://www.googleapis.com/auth/calendar.readonly',
    azure: 'email profile openid offline_access https://graph.microsoft.com/Calendars.Read',
    apple: 'email name',
  };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options: {
      redirectTo: redirectUri,
      scopes: scopes[provider],
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined,
    },
  });

  if (error) {
    throw error;
  }

  // On native, we need to open the URL in a browser
  if (Platform.OS !== 'web' && data.url) {
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri,
    );

    if (result.type === 'success') {
      // Extract the URL and let Supabase handle the session
      const url = result.url;
      
      // Parse the URL to get tokens
      if (url) {
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          return toAuthUser(sessionData.user, accessToken);
        }
      }
    } else if (result.type === 'cancel') {
      throw new Error('Authentication was cancelled');
    }
  }

  return undefined;
};

// Get current session with provider token (for calendar API access)
export const getSessionWithToken = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return {
    user: toAuthUser(data.session.user, data.session.provider_token ?? undefined),
    providerToken: data.session.provider_token,
    providerRefreshToken: data.session.provider_refresh_token,
  };
};

