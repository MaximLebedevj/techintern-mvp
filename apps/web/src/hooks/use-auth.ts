import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { OAuthProviders } from '@/types/api';

/** Срез сессии + действия аутентификации. */
export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      user: s.user,
      status: s.status,
      isAuthenticated: s.status === 'authenticated',
      isStudent: s.user?.role === 'STUDENT',
      isCompany: s.user?.role === 'COMPANY',
      login: s.login,
      register: s.register,
      logout: s.logout,
      refreshSession: s.refreshSession,
    })),
  );
}

/** Доступные OAuth-провайдеры (кнопки показываем только если настроены). */
export function useOAuthProviders() {
  return useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: async () => (await api.get<OAuthProviders>('/auth/providers')).data,
    staleTime: Infinity,
  });
}
