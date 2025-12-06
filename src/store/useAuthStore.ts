import { create } from 'zustand';

import {
  AuthCredentials,
  AuthUser,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from '@/services/authService';

type AuthState = {
  user?: AuthUser;
  initializing: boolean;
  error?: string;
  initialize: () => void;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

let unsubscribe: (() => void) | undefined;

export const useAuthStore = create<AuthState>()((set) => ({
    user: undefined,
    initializing: true,
    error: undefined,
    initialize: () => {
      if (unsubscribe) {
        return;
      }

      unsubscribe = subscribeToAuthChanges((authUser) =>
        set({
          user: authUser,
          initializing: false,
          error: undefined,
        }),
      );
    },
    signIn: async (credentials) => {
      try {
        await signInWithEmail(credentials);
        set({ error: undefined });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    signUp: async (credentials) => {
      try {
        await signUpWithEmail(credentials);
        set({ error: undefined });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    signOut: async () => {
      try {
        await signOutUser();
        set({ error: undefined });
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
  }));

export const resetAuthStore = () => {
  unsubscribe?.();
  unsubscribe = undefined;
};

