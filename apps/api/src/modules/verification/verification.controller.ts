import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IntegrationProvider, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';

@ApiTags('integrations')
@Roles(Role.STUDENT)
@Controller('integrations')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  private parseProvider(value: string): IntegrationProvider {
    const provider = value.toUpperCase() as IntegrationProvider;
    if (!Object.values(IntegrationProvider).includes(provider)) {
      throw new BadRequestException('Неизвестный провайдер');
    }
    return provider;
  }

  @Get()
  @ApiOperation({ summary: 'Мои подключённые интеграции' })
  list(@CurrentUser('id') userId: string) {
    return this.verification.list(userId);
  }

  @Post(':provider/connect')
  @ApiOperation({ summary: 'Подключить аккаунт (GitHub/Codewars) и синхронизировать' })
  connect(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: string,
    @Body() dto: ConnectIntegrationDto,
  ) {
    return this.verification.sync(userId, this.parseProvider(provider), dto.username);
  }

  @Post(':provider/sync')
  @ApiOperation({ summary: 'Пересинхронизировать подключённый аккаунт' })
  sync(@CurrentUser('id') userId: string, @Param('provider') provider: string) {
    return this.verification.sync(userId, this.parseProvider(provider));
  }

  @Delete(':provider')
  @ApiOperation({ summary: 'Отключить интеграцию' })
  disconnect(@CurrentUser('id') userId: string, @Param('provider') provider: string) {
    return this.verification.disconnect(userId, this.parseProvider(provider));
  }
}
