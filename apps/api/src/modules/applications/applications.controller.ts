import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Roles(Role.STUDENT)
  @Post()
  @ApiOperation({ summary: 'Откликнуться на вакансию' })
  apply(@CurrentUser('id') userId: string, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(userId, dto);
  }

  @Roles(Role.STUDENT)
  @Get('me')
  @ApiOperation({ summary: 'Мои отклики со статус-трекером' })
  listMine(@CurrentUser('id') userId: string) {
    return this.applicationsService.listMine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталь отклика (студент-владелец или компания)' })
  getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.applicationsService.getOne(userId, id);
  }

  @Roles(Role.COMPANY)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Изменить статус отклика (компания)' })
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(userId, id, dto);
  }

  @Roles(Role.STUDENT)
  @Delete(':id')
  @ApiOperation({ summary: 'Отозвать отклик' })
  withdraw(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.applicationsService.withdraw(userId, id);
  }
}
