import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { AppConfig } from '../../config/configuration';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { OAuthProfile } from './auth.types';

const REFRESH_COOKIE = 'ti_refresh';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieSecure: boolean;
  private readonly appPublicUrl: string;
  private readonly googleEnabled: boolean;
  private readonly githubEnabled: boolean;

  constructor(
    private readonly authService: AuthService,
    config: ConfigService<{ config: AppConfig }>,
  ) {
    this.cookieSecure = Boolean(
      (config.get('config.cookie', { infer: true }) as AppConfig['cookie']).secure,
    );
    this.appPublicUrl = config.get('config.appPublicUrl', { infer: true }) as string;
    this.googleEnabled = Boolean(
      (config.get('config.oauth.google', { infer: true }) as AppConfig['oauth']['google']).enabled,
    );
    this.githubEnabled = Boolean(
      (config.get('config.oauth.github', { infer: true }) as AppConfig['oauth']['github']).enabled,
    );
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Регистрация студента или компании' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Вход по email и паролю' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const record = await this.authService.validateUser(dto.email, dto.password);
    const { user, accessToken, refreshToken } = await this.authService.login(record);
    this.setRefreshCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Обновление access-токена по refresh-cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('Сессия не найдена');
    const { accessToken, refreshToken } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Завершение сессии' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Текущий пользователь сессии' })
  async me(@CurrentUser('id') userId: string) {
    return this.authService.getSession(userId);
  }

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'Список доступных OAuth-провайдеров' })
  providers() {
    return { google: this.googleEnabled, github: this.githubEnabled };
  }

  // --- OAuth: Google ----------------------------------------------------------

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleAuth(): void {
    /* редирект на consent выполняет passport-guard */
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    await this.completeOAuth(req.user as OAuthProfile, res);
  }

  // --- OAuth: GitHub ----------------------------------------------------------

  @Public()
  @UseGuards(AuthGuard('github'))
  @Get('github')
  githubAuth(): void {
    /* редирект выполняет passport-guard */
  }

  @Public()
  @UseGuards(AuthGuard('github'))
  @Get('github/callback')
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    await this.completeOAuth(req.user as OAuthProfile, res);
  }

  /** Завершает OAuth: ставит refresh-cookie и редиректит на фронтенд с access-токеном. */
  private async completeOAuth(profile: OAuthProfile, res: Response): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(profile);
    this.setRefreshCookie(res, refreshToken);
    res.redirect(`${this.appPublicUrl}/auth/callback#token=${accessToken}`);
  }
}
