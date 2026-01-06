import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

// Required for web OAuth
WebBrowser.maybeCompleteAuthSession();

// Handle OAuth callback on web - must run early before React renders
const handleWebOAuthCallback = async () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !isSupabaseConfigured) {
    return;
  }

  const hash = window.location.hash;
  if (!hash || (!hash.includes('access_token') && !hash.includes('error'))) {
    return;
  }

  // Parse hash params
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const supabase = getSupabaseClient();
    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      console.error('Failed to set session from OAuth callback:', e);
    }
  } else if (params.get('error')) {
    console.error('OAuth error:', params.get('error_description') || params.get('error'));
    // Clean up URL even on error
    window.history.replaceState(null, '', window.location.pathname);
  }
};

// Run immediately on module load
handleWebOAuthCallback();

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
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // On web, use the current origin so Supabase can detect the hash tokens
    return window.location.origin;
  }
  // On native (Expo Go or standalone), use the appropriate redirect URI
  // For Expo Go: exp://192.168.x.x:8081/--/auth/callback
  // For standalone: chronopal://auth/callback
  const redirectUri = makeRedirectUri({
    scheme: 'chronopal',
    path: 'auth/callback',
  });
  console.log('OAuth Redirect URI:', redirectUri);
  return redirectUri;
};

export const subscribeToAuthChanges = (
  callback: (user?: AuthUser) => void,
): (() => void) => {
  if (!isSupabaseConfigured) {
    callback({ uid: 'demo-user', email: 'demo@chronopal.dev' });
    return () => undefined;
  }

  const supabase = getSupabaseClient();
  
  // Check for existing session first (handles page refresh)
  // The OAuth callback is handled at module load time by handleWebOAuthCallback
  supabase.auth.getSession().then(({ data: { session } }) => {
    const user = session?.user
      ? { uid: session.user.id, email: session.user.email ?? undefined }
      : undefined;
    callback(user);
  });

  // Subscribe to future auth changes
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user
      ? { uid: session.user.id, email: session.user.email ?? undefined }
      : undefined;
    callback(user);
  });

  return data.subscription.unsubscribe;
};

export const signUpWithEmail = async ({ email, password }: AuthCredentials): Promise<{ user?: AuthUser; sessionCreated: boolean }> => {
  if (!isSupabaseConfigured) {
    return { user: { uid: 'demo-user', email }, sessionCreated: true };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // If email confirmation is disabled, Supabase creates a session automatically
  // data.session will be non-null if the user is immediately logged in
  const sessionCreated = !!data.session;
  const user = data.user ? { uid: data.user.id, email: data.user.email ?? undefined } : undefined;

  return { user, sessionCreated };
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
  
  try {
    // Try to sign out from the server
    await supabase.auth.signOut();
  } catch (error) {
    // If server signout fails (403, etc.), still clear local session
    console.warn('Server signout failed, clearing local session:', error);
  }
  
  // Clear any stored tokens in localStorage (web)
  if (typeof window !== 'undefined' && window.localStorage) {
    // Clear all Supabase auth keys
    const keysToRemove = Object.keys(window.localStorage).filter(
      key => key.startsWith('sb-') || key.includes('supabase')
    );
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  }
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

  // On native, we need to handle OAuth differently
  if (Platform.OS !== 'web') {
    // For mobile, we need to use skipBrowserRedirect to get the URL
    // and handle the redirect ourselves
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: redirectUri,
        scopes: scopes[provider],
        skipBrowserRedirect: true, // Important: don't auto-redirect
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error('No OAuth URL returned');
    }

    console.log('Opening OAuth URL:', data.url);
    console.log('Expected redirect to:', redirectUri);

    // Open the browser and wait for redirect
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri,
    );

    console.log('OAuth result type:', result.type);

    if (result.type === 'success' && result.url) {
      console.log('OAuth success URL:', result.url);
      
      // Parse the URL to get tokens - check both hash and query params
      const url = result.url;
      let params: URLSearchParams;
      
      if (url.includes('#')) {
        params = new URLSearchParams(url.split('#')[1]);
      } else if (url.includes('?')) {
        params = new URLSearchParams(url.split('?')[1]);
      } else {
        throw new Error('No auth params in callback URL');
      }

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
      } else {
        // Check for error in params
        const errorMsg = params.get('error_description') || params.get('error');
        if (errorMsg) {
          throw new Error(errorMsg);
        }
        throw new Error('No tokens in callback URL');
      }
    } else if (result.type === 'cancel') {
      throw new Error('Authentication was cancelled');
    } else if (result.type === 'dismiss') {
      throw new Error('Authentication was dismissed');
    }

    return undefined;
  }

  // Web OAuth flow
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

