import type { Role } from '@prisma/client';

/** Нормализованный профиль из OAuth-провайдера. */
export interface OAuthProfile {
  provider: 'GOOGLE' | 'GITHUB';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/** Сессионный пользователь, отдаваемый фронтенду (без приватных полей). */
export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  student: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    headline: string | null;
    isPremium: boolean;
  } | null;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    plan: string;
  } | null;
}
