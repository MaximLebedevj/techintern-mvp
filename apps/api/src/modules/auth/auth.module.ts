import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

/**
 * Контекст аутентификации. JwtModule регистрируется «пустым» — секреты и TTL
 * передаются явно при подписи (две пары ключей для access/refresh).
 */
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy, GoogleStrategy, GithubStrategy],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
