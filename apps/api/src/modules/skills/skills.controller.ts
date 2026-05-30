import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkillCategory } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Плоский список навыков' })
  list(@Query('category') category?: SkillCategory) {
    return this.skillsService.listFlat(category);
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Дерево навыков-каталога' })
  tree(@Query('category') category?: SkillCategory) {
    return this.skillsService.getCatalogTree(category);
  }
}
