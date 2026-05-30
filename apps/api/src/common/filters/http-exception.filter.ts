import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * Единый формат ошибок API. Доменные/HTTP-исключения и ошибки Prisma
 * приводятся к консистентному JSON, без утечки стектрейсов в проде.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Внутренняя ошибка сервера';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as { message?: string | string[]; error?: string };
        message = body.message ?? exception.message;
        error = body.error ?? error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Уникальность нарушена и т.п. — отдаём 409/400 с понятным текстом.
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Запись с такими данными уже существует';
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Запись не найдена';
        error = 'Not Found';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Ошибка запроса к базе данных';
        error = 'Bad Request';
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
