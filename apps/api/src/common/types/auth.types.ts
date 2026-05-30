import type { Role } from '@prisma/client';

/** Полезная нагрузка access-токена. */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: Role;
}

/** Полезная нагрузка refresh-токена (с идентификатором сессии для rotation). */
export interface RefreshPayload {
  sub: string;
  sid: string; // session id
}

/** То, что попадает в req.user после JwtStrategy. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
