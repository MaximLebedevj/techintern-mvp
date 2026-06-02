import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChallengesService } from './challenges.service';
import { CreateDuelDto, RespondDuelDto } from './dto/challenge.dto';

@ApiTags('challenges')
@Controller()
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Public()
  @Get('guilds')
  @ApiOperation({ summary: 'Гильдии (рейтинг по суммарному Skill Score)' })
  listGuilds() {
    return this.challenges.listGuilds();
  }

  @Roles(Role.STUDENT)
  @Get('guilds/me')
  @ApiOperation({ summary: 'Моя гильдия' })
  myGuild(@CurrentUser('id') userId: string) {
    return this.challenges.getMyGuild(userId);
  }

  @Roles(Role.STUDENT)
  @Post('guilds/:id/join')
  @ApiOperation({ summary: 'Вступить в гильдию' })
  join(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.challenges.joinGuild(userId, id);
  }

  @Roles(Role.STUDENT)
  @Delete('guilds/me')
  @ApiOperation({ summary: 'Покинуть гильдию' })
  leave(@CurrentUser('id') userId: string) {
    return this.challenges.leaveGuild(userId);
  }

  @Roles(Role.STUDENT)
  @Get('challenges')
  @ApiOperation({ summary: 'Мои дуэли' })
  listMine(@CurrentUser('id') userId: string) {
    return this.challenges.listMine(userId);
  }

  @Roles(Role.STUDENT)
  @Post('challenges/duel')
  @ApiOperation({ summary: 'Вызвать на дуэль' })
  createDuel(@CurrentUser('id') userId: string, @Body() dto: CreateDuelDto) {
    return this.challenges.createDuel(userId, dto);
  }

  @Roles(Role.STUDENT)
  @Post('challenges/:id/respond')
  @ApiOperation({ summary: 'Принять/отклонить дуэль' })
  respond(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: RespondDuelDto) {
    return this.challenges.respondDuel(userId, id, dto);
  }
}
