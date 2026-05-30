import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Roles(Role.COMPANY)
  @Get('me')
  @ApiOperation({ summary: 'Профиль моей компании' })
  getMe(@CurrentUser('id') userId: string) {
    return this.companiesService.getMyProfile(userId);
  }

  @Roles(Role.COMPANY)
  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль компании' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateCompanyProfileDto) {
    return this.companiesService.updateProfile(userId, dto);
  }

  @Roles(Role.COMPANY)
  @Get('me/vacancies')
  @ApiOperation({ summary: 'Вакансии моей компании' })
  myVacancies(@CurrentUser('id') userId: string) {
    return this.companiesService.getMyVacancies(userId);
  }

  @Roles(Role.COMPANY)
  @Get('me/stats')
  @ApiOperation({ summary: 'Метрики дашборда компании' })
  stats(@CurrentUser('id') userId: string) {
    return this.companiesService.getStats(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Публичный профиль компании с активными вакансиями' })
  getPublic(@Param('id') id: string) {
    return this.companiesService.getPublicProfile(id);
  }
}
