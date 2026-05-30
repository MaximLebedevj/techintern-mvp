import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { AppConfig } from '../../../config/configuration';
import type { OAuthProfile } from '../auth.types';

/**
 * Google OAuth2. Если ключи не заданы, используем заглушку, чтобы приложение
 * стартовало; фронтенд скрывает кнопку (см. /auth/providers).
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<{ config: AppConfig }>) {
    const oauth = config.get('config.oauth.google', { infer: true }) as AppConfig['oauth']['google'];
    const apiUrl = config.get('config.apiPublicUrl', { infer: true }) as string;
    super({
      clientID: oauth.clientId || 'not-configured',
      clientSecret: oauth.clientSecret || 'not-configured',
      callbackURL: `${apiUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value ?? '';
    const oauthProfile: OAuthProfile = {
      provider: 'GOOGLE',
      providerId: profile.id,
      email,
      name: profile.displayName || email.split('@')[0] || 'Пользователь',
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, oauthProfile);
  }
}
