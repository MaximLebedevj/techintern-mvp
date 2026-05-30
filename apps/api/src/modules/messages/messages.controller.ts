import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/auth.types';
import { MessagesService } from './messages.service';
import { SendMessageDto, StartConversationDto } from './dto/message.dto';

@ApiTags('conversations')
@Controller('conversations')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Мои диалоги' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.listMine(user);
  }

  @Post()
  @ApiOperation({ summary: 'Начать диалог' })
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartConversationDto) {
    return this.messagesService.start(user, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Сообщения диалога' })
  messages(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagesService.getMessages(user, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Отправить сообщение' })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user, id, dto);
  }
}
