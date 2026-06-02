import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, SkillCategory } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@Controller()
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Public()
  @Get('gamification/leaderboard')
  @ApiOperation({ summary: 'Лидерборд по Skill Score' })
  leaderboard(@Query('specialization') specialization?: SkillCategory) {
    return this.gamification.getLeaderboard(specialization);
  }

  @Public()
  @Get('badges')
  @ApiOperation({ summary: 'Каталог бейджей' })
  catalog() {
    return this.gamification.getBadgeCatalog();
  }

  @Roles(Role.STUDENT)
  @Get('badges/me')
  @ApiOperation({ summary: 'Мои бейджи' })
  async myBadges(@CurrentUser('id') userId: string) {
    const studentId = await this.gamification.resolveStudentId(userId);
    return this.gamification.getMyBadges(studentId);
  }
}
