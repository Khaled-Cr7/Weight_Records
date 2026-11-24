// services/types/auth.ts
// Shapes returned by the Repsy API (see server/src/routes/auth.ts)

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarKey: string | null;
  bio: string | null;
  createdAt: string;
  settings: {
    weightUnit: 'KG' | 'LB';
    defaultRestSeconds: number;
    notificationsEnabled: boolean;
  } | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}