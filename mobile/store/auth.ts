import { create } from 'zustand';
import { ApiError, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import { clearToken, loadToken, saveToken } from '@/lib/tokenStorage';
import { AuthService } from '@/services/authService';
import type { AuthResponse, AuthUser } from '@/services/types/auth';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: Status;
  user: AuthUser | null;
  restore: () => Promise<void>; // runs once when the app starts
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => {
  // Saves the token and marks the user as signed in
  const startSession = async ({ token, user }: AuthResponse) => {
    await saveToken(token);
    setAuthToken(token);
    set({ status: 'signedIn', user });
  };

  return {
    status: 'loading',
    user: null,

    restore: async () => {
      try {
        const token = await loadToken();
        if (!token) {
          set({ status: 'signedOut', user: null });
          return;
        }

        setAuthToken(token);
        const { user } = await AuthService.me();
        set({ status: 'signedIn', user });
      } catch (error) {
        // Only a rejected token ends the session. If the server is just
        // unreachable, we keep the token for the next start.
        if (error instanceof ApiError && error.status === 401) await clearToken();
        setAuthToken(null);
        set({ status: 'signedOut', user: null });
      }
    },

    signIn: async (email, password) => {
      await startSession(await AuthService.login(email, password));
    },

    signUp: async (email, username, password) => {
      await startSession(await AuthService.register(email, username, password));
    },

    signOut: async () => {
      await clearToken();
      setAuthToken(null);
      set({ status: 'signedOut', user: null });
    },
  };
});

// If the server rejects our token while the app is open, sign out
setUnauthorizedHandler(() => {
  void useAuth.getState().signOut();
});