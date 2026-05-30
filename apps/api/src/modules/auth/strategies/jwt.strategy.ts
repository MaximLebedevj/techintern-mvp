import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../../config/configuration';
import type { AuthenticatedUser, JwtPayload } from '../../../common/types/auth.types';

/** Проверяет access-токен из заголовка Authorization: Bearer. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService<{ config: AppConfig }>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('config.jwt.accessSecret', { infer: true }) as string,
    });
  }

  /** Возвращаемое значение становится req.user. */
  validate(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
