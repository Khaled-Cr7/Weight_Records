import { apiGet, apiPost } from '@/lib/api';
import type { AuthResponse, AuthUser } from './types/auth';

export const AuthService = {
  login: (email: string, password: string): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/api/auth/login', { email, password });
  },

  register: (email: string, username: string, password: string): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/api/auth/register', { email, username, password });
  },

  // The signed-in user (needs the token, which lib/api.ts attaches)
  me: (): Promise<{ user: AuthUser }> => {
    return apiGet<{ user: AuthUser }>('/api/auth/me');
  },
};