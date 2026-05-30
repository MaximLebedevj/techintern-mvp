import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListCandidatesDto } from './dto/list-candidates.dto';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // --- Самообслуживание студента (маршруты /me объявлены до /:id) -------------

  @Roles(Role.STUDENT)
  @Get('me')
  @ApiOperation({ summary: 'Мой профиль студента' })
  getMe(@CurrentUser('id') userId: string) {
    return this.studentsService.getMyProfile(userId);
  }

  @Roles(Role.STUDENT)
  @Patch('me')
  @ApiOperation({ summary: 'Обновить профиль' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateProfile(userId, dto);
  }

  @Roles(Role.STUDENT)
  @Get('me/skill-tree')
  @ApiOperation({ summary: 'Интерактивное Skill Tree с прогрессом' })
  getSkillTree(@CurrentUser('id') userId: string) {
    return this.studentsService.getSkillTree(userId);
  }

  @Roles(Role.STUDENT)
  @Put('me/skills')
  @ApiOperation({ summary: 'Обновить набор навыков (Skill Tree)' })
  setSkills(@CurrentUser('id') userId: string, @Body() dto: UpdateSkillsDto) {
    return this.studentsService.setSkills(userId, dto);
  }

  @Roles(Role.STUDENT)
  @Get('me/recommendations')
  @ApiOperation({ summary: 'Рекомендации по навыку (клик по ветке дерева)' })
  getRecommendations(@CurrentUser('id') userId: string, @Query('skill') skill?: string) {
    return this.studentsService.getRecommendations(userId, skill);
  }

  @Roles(Role.STUDENT)
  @Post('me/projects')
  @ApiOperation({ summary: 'Добавить проект' })
  addProject(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.studentsService.addProject(userId, dto);
  }

  @Roles(Role.STUDENT)
  @Delete('me/projects/:id')
  @ApiOperation({ summary: 'Удалить проект' })
  removeProject(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.studentsService.removeProject(userId, id);
  }

  // --- Просмотр кандидатов компанией ------------------------------------------

  @Roles(Role.COMPANY, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Список кандидатов (опц. с match-score под вакансию)' })
  listCandidates(@Query() dto: ListCandidatesDto) {
    return this.studentsService.listCandidates(dto);
  }

  @Roles(Role.COMPANY, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Публичный профиль кандидата' })
  getPublicProfile(@Param('id') id: string) {
    return this.studentsService.getPublicProfile(id);
  }
}
