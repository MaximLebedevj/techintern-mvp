import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CareerHubService } from './career-hub.service';
import { ListResourcesDto } from './dto/list-resources.dto';

@ApiTags('career-hub')
@Controller('career-hub')
export class CareerHubController {
  constructor(private readonly careerHubService: CareerHubService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Материалы Career Hub (гайды, чеклисты, разборы кода)' })
  list(@Query() dto: ListResourcesDto) {
    return this.careerHubService.list(dto);
  }

  @Roles(Role.STUDENT)
  @Get('me/progress')
  @ApiOperation({ summary: 'Прогресс по материалам Career Hub' })
  progress(@CurrentUser('id') userId: string) {
    return this.careerHubService.getProgress(userId);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Деталь материала' })
  getBySlug(@Param('slug') slug: string) {
    return this.careerHubService.getBySlug(slug);
  }

  @Roles(Role.STUDENT)
  @Post(':id/complete')
  @ApiOperation({ summary: 'Отметить материал пройденным' })
  complete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.careerHubService.markCompleted(userId, id);
  }
}
