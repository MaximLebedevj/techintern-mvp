import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Опциональная аутентификация: если токен валиден — заполняет req.user,
 * если отсутствует/невалиден — пропускает запрос как анонимный (без ошибки).
 * Применяется на публичных, но «viewer-aware» эндпоинтах (например, деталь вакансии).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user ?? undefined) as TUser;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // токен невалиден — продолжаем без пользователя
    }
    return true;
  }
}
