import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { assertSupabaseConfigured, isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

// Required for web OAuth
WebBrowser.maybeCompleteAuthSession();

// Storage keys for Google tokens
const GOOGLE_TOKEN_KEY = 'chronopal_google_token';
const GOOGLE_REFRESH_TOKEN_KEY = 'chronopal_google_refresh_token';
const GOOGLE_TOKEN_EXPIRY_KEY = 'chronopal_google_token_expiry';

// Helper to store Google tokens
const storeGoogleTokens = async (accessToken: string, refreshToken?: string, expiresIn?: number) => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(GOOGLE_TOKEN_KEY, accessToken);
      if (refreshToken) {
        window.localStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
      }
      if (expiresIn) {
        const expiry = Date.now() + (expiresIn * 1000);
        window.localStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiry.toString());
      }
    } else {
      await AsyncStorage.setItem(GOOGLE_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
      }
      if (expiresIn) {
        const expiry = Date.now() + (expiresIn * 1000);
        await AsyncStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiry.toString());
      }
    }
  } catch (e) {
    console.error('Failed to store Google tokens:', e);
  }
};

// Helper to get stored Google tokens
const getStoredGoogleTokens = async () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const accessToken = window.localStorage.getItem(GOOGLE_TOKEN_KEY);
      const refreshToken = window.localStorage.getItem(GOOGLE_REFRESH_TOKEN_KEY);
      const expiryStr = window.localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : null;
      return { accessToken, refreshToken, expiry };
    } else {
      const accessToken = await AsyncStorage.getItem(GOOGLE_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(GOOGLE_REFRESH_TOKEN_KEY);
      const expiryStr = await AsyncStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : null;
      return { accessToken, refreshToken, expiry };
    }
  } catch (e) {
    console.error('Failed to get Google tokens:', e);
    return { accessToken: null, refreshToken: null, expiry: null };
  }
};

// Helper to clear Google tokens
const clearGoogleTokens = async () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(GOOGLE_TOKEN_KEY);
      window.localStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
    } else {
      await AsyncStorage.multiRemove([GOOGLE_TOKEN_KEY, GOOGLE_REFRESH_TOKEN_KEY, GOOGLE_TOKEN_EXPIRY_KEY]);
    }
  } catch (e) {
    console.error('Failed to clear Google tokens:', e);
  }
};

const decodeOAuthParam = (value: string | null): string | null => {
  if (!value) return null;
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

const cleanOAuthUrl = () => {
  const path = window.location.pathname || '/';
  window.history.replaceState(null, '', path);
};

/** Parsed OAuth redirect error (survives module load for auth store). */
let pendingOAuthError: string | undefined;

export const consumePendingOAuthError = (): string | undefined => {
  const err = pendingOAuthError;
  pendingOAuthError = undefined;
  return err;
};

// Handle OAuth callback on web - must run early before React renders
const handleWebOAuthCallback = async () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !isSupabaseConfigured) {
    return;
  }

  const search = window.location.search;
  if (!search || (!search.includes('code=') && !search.includes('error='))) {
    return;
  }

  const params = new URLSearchParams(search.substring(1));
  const oauthError = params.get('error');
  const oauthErrorDescription = decodeOAuthParam(params.get('error_description'));

  if (oauthError) {
    pendingOAuthError =
      oauthErrorDescription ||
      decodeOAuthParam(oauthError) ||
      'Sign-in failed. Check Google OAuth settings in Supabase and Google Cloud Console.';
    console.error('OAuth error:', pendingOAuthError);
    cleanOAuthUrl();
    return;
  }

  const authCode = params.get('code');
  if (authCode) {
    const supabase = getSupabaseClient();
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(authCode);
      if (error) {
        pendingOAuthError = error.message;
        console.error('PKCE code exchange failed:', error);
      }
    } catch (e) {
      pendingOAuthError = (e as Error).message;
      console.error('PKCE code exchange failed:', e);
    }
    cleanOAuthUrl();
  }
};

/** Resolves after web OAuth URL is processed (must finish before getSession). */
export const waitForWebOAuthCallback = (): Promise<void> => webOAuthCallbackPromise;

let webOAuthCallbackPromise: Promise<void> = Promise.resolve();
if (Platform.OS === 'web') {
  webOAuthCallbackPromise = handleWebOAuthCallback();
}

// Export function to handle OAuth callback from URL (for initial URL or deep links)
export const handleOAuthCallbackFromUrl = async (url: string): Promise<AuthUser | undefined> => {
  if (!isSupabaseConfigured) {
    return undefined;
  }

  console.log('Handling OAuth callback from URL:', url);

  if (!url.includes('auth/callback') || (!url.includes('code=') && !url.includes('error'))) {
    console.log('URL does not contain OAuth callback parameters');
    return undefined;
  }

  const supabase = getSupabaseClient();

  const queryStart = url.indexOf('?');
  if (queryStart === -1) {
    console.error('No auth params in callback URL');
    return undefined;
  }
  const params = new URLSearchParams(url.substring(queryStart + 1));

  const errorMsg = params.get('error_description') || params.get('error');
  if (errorMsg) {
    throw new Error(errorMsg);
  }

  const authCode = params.get('code');
  if (!authCode) {
    console.error('No auth code in callback URL');
    return undefined;
  }

  try {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(authCode);

    if (exchangeError) {
      throw exchangeError;
    }

    const googleToken = sessionData.session?.provider_token;
    const googleRefreshToken = sessionData.session?.provider_refresh_token;
    if (googleToken) {
      await storeGoogleTokens(googleToken, googleRefreshToken || undefined, 3600);
    }

    return toAuthUser(
      sessionData.user,
      googleToken || sessionData.session?.access_token,
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    throw error;
  }
};

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

export type SignInOAuthOptions = {
  /** Request Google Calendar / Microsoft Graph calendar scopes (for import). */
  requestCalendarAccess?: boolean;
};

const toAuthUser = (user: any, accessToken?: string): AuthUser | undefined =>
  user
    ? {
        uid: user.id ?? user.uid,
        email: user.email ?? undefined,
        provider: user.app_metadata?.provider,
        accessToken,
      }
    : undefined;

// Get the redirect URI for OAuth (must match Supabase → Auth → URL Configuration)
const getRedirectUri = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { origin, pathname } = window.location;
    return `${origin}${pathname || '/'}`;
  }
  
  // On native mobile (iOS/Android), use the appropriate redirect URI
  // For Expo Go: exp://192.168.x.x:8081/--/auth/callback
  // For standalone: chronopal://auth/callback
  // useProxy: true allows Expo Go to use the proxy redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'chronopal',
    path: 'auth/callback',
    useProxy: true, // Use Expo proxy for Expo Go (falls back to custom scheme for standalone)
  });
  console.log('OAuth Redirect URI (mobile):', redirectUri);
  console.log('Platform:', Platform.OS);
  return redirectUri;
};

export const subscribeToAuthChanges = (
  callback: (user?: AuthUser) => void,
): (() => void) => {
  if (!isSupabaseConfigured) {
    callback(undefined);
    return () => undefined;
  }

  const supabase = getSupabaseClient();

  const emitSession = (session: { user: { id: string; email?: string | null }; provider_token?: string | null; provider_refresh_token?: string | null } | null) => {
    const user = session?.user
      ? { uid: session.user.id, email: session.user.email ?? undefined }
      : undefined;

    if (session?.provider_token) {
      storeGoogleTokens(
        session.provider_token,
        session.provider_refresh_token || undefined,
        3600,
      );
    }

    callback(user);
  };

  const loadInitialSession = async () => {
    if (Platform.OS === 'web') {
      await waitForWebOAuthCallback();
    }
    const { data: { session } } = await supabase.auth.getSession();
    emitSession(session);
  };

  loadInitialSession();

  // Subscribe to auth changes after initial load (skip INITIAL_SESSION to avoid a null flash)
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') {
      return;
    }

    if (event === 'SIGNED_OUT') {
      clearGoogleTokens();
      callback(undefined);
      return;
    }

    if (session) {
      emitSession(session);
    }
  });

  return data.subscription.unsubscribe;
};

export const signUpWithEmail = async ({ email, password }: AuthCredentials): Promise<{ user?: AuthUser; sessionCreated: boolean }> => {
  assertSupabaseConfigured();

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
  assertSupabaseConfigured();

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
  
  // Clear Google tokens
  await clearGoogleTokens();
  
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
export const signInWithOAuth = async (
  provider: OAuthProvider,
  options?: SignInOAuthOptions,
) => {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const redirectUri = getRedirectUri();

  // Map provider names to Supabase provider names
  const supabaseProvider = provider === 'azure' ? 'azure' : provider;

  const wantCalendar = options?.requestCalendarAccess === true;
  const scopes: Record<OAuthProvider, string> = {
    google: wantCalendar
      ? 'email profile https://www.googleapis.com/auth/calendar.readonly'
      : 'email profile',
    azure: wantCalendar
      ? 'email profile openid offline_access https://graph.microsoft.com/Calendars.Read'
      : 'email profile openid offline_access',
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
        queryParams: provider === 'google' && wantCalendar
          ? {
              access_type: 'offline',
              prompt: 'consent',
              include_granted_scopes: 'true',
            }
          : undefined,
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
    console.log('⚠️ IMPORTANT: Make sure this redirect URI is added to Supabase Dashboard → Authentication → URL Configuration');

    // Helper function to parse OAuth callback URL and create session (PKCE)
    const handleOAuthCallback = async (callbackUrl: string) => {
      console.log('Processing OAuth callback URL:', callbackUrl);

      const queryStart = callbackUrl.indexOf('?');
      if (queryStart === -1) {
        throw new Error('No auth params in callback URL');
      }
      const params = new URLSearchParams(callbackUrl.substring(queryStart + 1));

      const errorMsg = params.get('error_description') || params.get('error');
      if (errorMsg) {
        throw new Error(errorMsg);
      }

      const authCode = params.get('code');
      if (!authCode) {
        throw new Error('No auth code in callback URL');
      }

      const { data: sessionData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(authCode);

      if (exchangeError) {
        throw exchangeError;
      }

      const googleToken = sessionData.session?.provider_token;
      const googleRefreshToken = sessionData.session?.provider_refresh_token;
      if (googleToken && provider === 'google') {
        await storeGoogleTokens(googleToken, googleRefreshToken || undefined, 3600);
      }

      return toAuthUser(
        sessionData.user,
        googleToken || sessionData.session?.access_token,
      );
    };

    // Set up deep link listener as fallback in case WebBrowser doesn't capture the callback
    let deepLinkSubscription: { remove: () => void } | null = null;
    let deepLinkResolve: ((url: string) => void) | null = null;
    let deepLinkTimeout: ReturnType<typeof setTimeout> | null = null;

    const deepLinkPromise = new Promise<string>((resolve, reject) => {
      deepLinkResolve = resolve;

      const listener = (event: { url: string }) => {
        console.log('Deep link received via Linking API:', event.url);
        if (
          event.url.includes('auth/callback') &&
          (event.url.includes('code=') || event.url.includes('error'))
        ) {
          if (deepLinkResolve) {
            deepLinkResolve(event.url);
          }
        }
      };

      deepLinkSubscription = Linking.addEventListener('url', listener);

      // Timeout after 60 seconds
      deepLinkTimeout = setTimeout(() => {
        reject(new Error('OAuth callback timeout - no response received'));
      }, 60000);
    });

    try {
      // Try WebBrowser first, but also listen for deep links as fallback
      // Add a small delay to ensure the listener is set up before opening browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const webBrowserPromise = WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      
      console.log('Waiting for OAuth callback...');
      console.log('WebBrowser promise started, deep link listener active');
      
      // Race between WebBrowser result and deep link
      const raceResult = await Promise.race([
        webBrowserPromise.then(result => {
          console.log('WebBrowser promise resolved:', result.type);
          return { source: 'webbrowser' as const, result };
        }),
        deepLinkPromise.then(url => {
          console.log('Deep link promise resolved');
          return { source: 'linking' as const, url };
        }),
      ]);

      // Clean up listener and timeout
      deepLinkSubscription?.remove();
      deepLinkSubscription = null;
      if (deepLinkTimeout) {
        clearTimeout(deepLinkTimeout);
      }

      console.log('OAuth callback source:', raceResult.source);
      
      // Handle result from WebBrowser
      if (raceResult.source === 'webbrowser') {
        const result = raceResult.result;
        console.log('OAuth result type:', result.type);
        console.log('OAuth result:', JSON.stringify(result, null, 2));
        
        if (result.type === 'locked') {
          throw new Error('OAuth session is locked. Please close other authentication windows and try again.');
        }

        if (result.type === 'success' && result.url) {
          return await handleOAuthCallback(result.url);
        } else if (result.type === 'cancel') {
          throw new Error('Authentication was cancelled');
        } else if (result.type === 'dismiss') {
          throw new Error('Authentication was dismissed');
        }
      } 
      // Handle result from deep link listener
      else if (raceResult.source === 'linking' && raceResult.url) {
        console.log('Using deep link callback URL');
        return await handleOAuthCallback(raceResult.url);
      }

      return undefined;
    } catch (error) {
      // Clean up listener and timeout on error
      deepLinkSubscription?.remove();
      deepLinkSubscription = null;
      if (deepLinkTimeout) {
        clearTimeout(deepLinkTimeout);
      }
      throw error;
    }
  }

  // Web OAuth flow — redirect browser to Supabase / Google
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options: {
      redirectTo: redirectUri,
      scopes: scopes[provider],
      queryParams: provider === 'google' && wantCalendar
        ? {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          }
        : undefined,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.url && typeof window !== 'undefined') {
    window.location.assign(data.url);
  }

  return undefined;
};

const GOOGLE_CALENDAR_SCOPE_PROBE =
  'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1';

/** Thrown on web when user is redirected to Google for calendar consent. */
export class CalendarReauthRequired extends Error {
  constructor(message = 'Redirecting to Google for calendar access…') {
    super(message);
    this.name = 'CalendarReauthRequired';
  }
}

const hasGoogleCalendarScope = async (accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch(GOOGLE_CALENDAR_SCOPE_PROBE, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Returns a Google access token with calendar.readonly scope.
 * Re-runs Google OAuth with calendar scopes if the current token lacks them.
 */
export const ensureGoogleCalendarToken = async (): Promise<string> => {
  const session = await getSessionWithToken();
  if (session?.providerToken && (await hasGoogleCalendarScope(session.providerToken))) {
    return session.providerToken;
  }

  await signInWithOAuth('google', { requestCalendarAccess: true });

  if (Platform.OS === 'web') {
    throw new CalendarReauthRequired();
  }

  const updated = await getSessionWithToken();
  if (!updated?.providerToken || !(await hasGoogleCalendarScope(updated.providerToken))) {
    throw new Error(
      'Calendar access was not granted. Sign in with Google again and allow calendar permission.',
    );
  }

  return updated.providerToken;
};

// Refresh Google access token using refresh token
const refreshGoogleToken = async (refreshToken: string): Promise<string | null> => {
  try {
    // We need to use Supabase's edge function or a backend to refresh the token
    // For now, we'll use a direct Google API call (works for web, may have CORS issues)
    // A better approach would be to use Supabase Edge Functions
    
    // Get the Google OAuth client ID from Supabase
    // For now, we'll just return null and let the user re-authenticate
    console.log('Token refresh needed - re-authentication may be required');
    return null;
  } catch (e) {
    console.error('Failed to refresh Google token:', e);
    return null;
  }
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

  // First check if Supabase has the provider token
  let providerToken = data.session.provider_token;
  let providerRefreshToken = data.session.provider_refresh_token;

  // If not available from Supabase session, check stored tokens
  if (!providerToken) {
    const stored = await getStoredGoogleTokens();
    
    if (stored.accessToken) {
      // Check if token is expired
      const isExpired = stored.expiry && Date.now() > stored.expiry;
      
      if (!isExpired) {
        providerToken = stored.accessToken;
        providerRefreshToken = stored.refreshToken;
      } else if (stored.refreshToken) {
        // Try to refresh the token
        const newToken = await refreshGoogleToken(stored.refreshToken);
        if (newToken) {
          providerToken = newToken;
          await storeGoogleTokens(newToken, stored.refreshToken, 3600);
        }
      }
    }
  } else {
    // Store the provider token from session for future use
    await storeGoogleTokens(
      providerToken, 
      providerRefreshToken || undefined, 
      3600
    );
  }

  return {
    user: toAuthUser(data.session.user, providerToken ?? undefined),
    providerToken: providerToken,
    providerRefreshToken: providerRefreshToken,
  };
};

