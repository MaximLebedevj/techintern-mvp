import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PassportService } from './passport.service';

@ApiTags('passport')
@Controller()
export class PassportController {
  constructor(private readonly passport: PassportService) {}

  @Roles(Role.STUDENT)
  @Get('students/me/passport')
  @ApiOperation({ summary: 'Мой Skill Proof Passport' })
  myPassport(@CurrentUser('id') userId: string) {
    return this.passport.getMyPassport(userId);
  }

  @Roles(Role.STUDENT)
  @Get('students/me/progress')
  @ApiOperation({ summary: 'Сводка прогресса (Skill Score, streak, лига)' })
  myProgress(@CurrentUser('id') userId: string) {
    return this.passport.getProgress(userId);
  }

  @Roles(Role.STUDENT)
  @Get('students/me/activity')
  @ApiOperation({ summary: 'Календарь активности (heatmap)' })
  myActivity(@CurrentUser('id') userId: string, @Query('days') days?: string) {
    return this.passport.getActivity(userId, days ? Number(days) : undefined);
  }

  @Roles(Role.COMPANY, Role.ADMIN)
  @Get('students/:id/passport')
  @ApiOperation({ summary: 'Skill Proof Passport кандидата (для компании)' })
  publicPassport(@Param('id') id: string) {
    return this.passport.getPublicPassport(id);
  }
}
