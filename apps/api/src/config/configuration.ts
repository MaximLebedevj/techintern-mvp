/**
 * Типизированная конфигурация приложения.
 * Все секреты и параметры читаются ТОЛЬКО отсюда (см. CLAUDE.md §4).
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  appPublicUrl: string;
  apiPublicUrl: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  cookie: {
    // secure-флаг refresh-cookie. true только под HTTPS (на VPS).
    secure: boolean;
  };
  oauth: {
    google: { clientId: string; clientSecret: string; enabled: boolean };
    github: { clientId: string; clientSecret: string; enabled: boolean };
  };
}

const required = (value: string | undefined, fallback: string): string => value ?? fallback;

export default (): AppConfig => {
  const apiPublicUrl = required(process.env.API_PUBLIC_URL, 'http://localhost:4000');
  const appPublicUrl = required(process.env.APP_PUBLIC_URL, 'http://localhost:5173');

  return {
    env: (process.env.NODE_ENV as AppConfig['env']) ?? 'development',
    port: Number(process.env.API_PORT ?? 4000),
    appPublicUrl,
    apiPublicUrl,
    database: {
      url: required(
        process.env.DATABASE_URL,
        'postgresql://techintern:techintern@localhost:5432/techintern?schema=public',
      ),
    },
    redis: {
      url: required(process.env.REDIS_URL, 'redis://localhost:6379'),
    },
    jwt: {
      accessSecret: required(process.env.JWT_ACCESS_SECRET, 'dev_access_secret_change_me'),
      refreshSecret: required(process.env.JWT_REFRESH_SECRET, 'dev_refresh_secret_change_me'),
      accessTtl: required(process.env.JWT_ACCESS_TTL, '15m'),
      refreshTtl: required(process.env.JWT_REFRESH_TTL, '7d'),
    },
    cookie: {
      secure: process.env.COOKIE_SECURE === 'true',
    },
    oauth: {
      google: {
        clientId: required(process.env.GOOGLE_CLIENT_ID, ''),
        clientSecret: required(process.env.GOOGLE_CLIENT_SECRET, ''),
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      github: {
        clientId: required(process.env.GITHUB_CLIENT_ID, ''),
        clientSecret: required(process.env.GITHUB_CLIENT_SECRET, ''),
        enabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      },
    },
  };
};
