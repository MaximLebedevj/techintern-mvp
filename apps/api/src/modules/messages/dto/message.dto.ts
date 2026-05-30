import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(2000) body!: string;
}

/** Старт диалога: студент указывает companyId, компания — studentId (по роли). */
export class StartConversationDto {
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() companyId?: string;
}
