import { create } from 'zustand';
import { api, setAccessToken, setUnauthorizedHandler } from '@/lib/api';
import type { AuthResponse, Role, SessionUser } from '@/types/api';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: Exclude<Role, 'ADMIN'>;
}

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setSession: (auth: AuthResponse) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  setSession: (auth) => {
    setAccessToken(auth.accessToken);
    set({ user: auth.user, status: 'authenticated' });
  },

  /** Восстановление сессии при старте: refresh-cookie → access-токен → /auth/me. */
  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const { data } = await api.get<SessionUser>('/auth/me');
      set({ user: data, status: 'authenticated' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    set({ user: data.user, status: 'authenticated' });
    return data.user;
  },

  register: async (input) => {
    const { data } = await api.post<AuthResponse>('/auth/register', input);
    setAccessToken(data.accessToken);
    set({ user: data.user, status: 'authenticated' });
    return data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* игнорируем — всё равно чистим локально */
    }
    setAccessToken(null);
    set({ user: null, status: 'unauthenticated' });
  },

  refreshSession: async () => {
    try {
      const { data } = await api.get<SessionUser>('/auth/me');
      set({ user: data });
    } catch {
      /* no-op */
    }
  },
}));

// При неустранимом 401 (refresh не удался) — сбрасываем сессию.
setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, status: 'unauthenticated' });
});
