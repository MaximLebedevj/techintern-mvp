import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * HTTP-клиент SkillProof.
 * Access-токен хранится в памяти (не в localStorage — безопаснее), refresh — в httpOnly-cookie.
 * При 401 один раз пытаемся обновить токен и повторить запрос (см. CLAUDE.md §5/§7).
 */

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const API_BASE = `${API_ORIGIN}/api`;

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;
export const setUnauthorizedHandler = (handler: () => void): void => {
  onUnauthorized = handler;
};

/** Полный URL для запуска OAuth-флоу (полная навигация браузера). */
export const oauthUrl = (provider: 'google' | 'github'): string =>
  `${API_BASE}/auth/${provider}`;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Обновление токена — single-flight: параллельные 401 ждут один запрос refresh.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        setAccessToken(null);
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);

/** Достаёт человекочитаемое сообщение об ошибке из ответа API. */
export function getApiErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
  }
  return fallback;
}
