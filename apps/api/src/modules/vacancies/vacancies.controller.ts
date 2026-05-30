import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/auth.types';
import { VacanciesService } from './vacancies.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { SearchVacanciesDto } from './dto/search-vacancies.dto';

@ApiTags('vacancies')
@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Поиск вакансий с глубокими фильтрами по технологиям' })
  search(@Query() dto: SearchVacanciesDto) {
    return this.vacanciesService.search(dto);
  }

  @Roles(Role.COMPANY)
  @Get(':id/applicants')
  @ApiOperation({ summary: 'Отклики на вакансию (для компании)' })
  applicants(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.vacanciesService.getApplicants(userId, id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Деталь вакансии (для студента — с персональным match-score)' })
  getById(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.vacanciesService.getById(id, user);
  }

  @Roles(Role.COMPANY)
  @Post()
  @ApiOperation({ summary: 'Создать вакансию (intern/junior)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVacancyDto) {
    return this.vacanciesService.create(userId, dto);
  }

  @Roles(Role.COMPANY)
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить вакансию' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVacancyDto,
  ) {
    return this.vacanciesService.update(userId, id, dto);
  }

  @Roles(Role.COMPANY)
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить вакансию' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.vacanciesService.remove(userId, id);
  }
}
