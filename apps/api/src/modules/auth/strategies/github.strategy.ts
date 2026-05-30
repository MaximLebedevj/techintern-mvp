import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import type { AppConfig } from '../../../config/configuration';
import type { OAuthProfile } from '../auth.types';

type DoneCallback = (err: Error | null, user?: OAuthProfile) => void;

/** GitHub OAuth2. Заглушка при отсутствии ключей — см. GoogleStrategy. */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService<{ config: AppConfig }>) {
    const oauth = config.get('config.oauth.github', { infer: true }) as AppConfig['oauth']['github'];
    const apiUrl = config.get('config.apiPublicUrl', { infer: true }) as string;
    super({
      clientID: oauth.clientId || 'not-configured',
      clientSecret: oauth.clientSecret || 'not-configured',
      callbackURL: `${apiUrl}/api/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: DoneCallback): void {
    // У GitHub email может быть приватным — подставляем noreply-адрес.
    const email =
      profile.emails?.[0]?.value ?? `${profile.username ?? profile.id}@users.noreply.github.com`;
    const oauthProfile: OAuthProfile = {
      provider: 'GITHUB',
      providerId: String(profile.id),
      email,
      name: profile.displayName || profile.username || 'Пользователь',
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, oauthProfile);
  }
}
