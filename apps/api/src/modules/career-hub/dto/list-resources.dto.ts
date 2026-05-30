import { ResourceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListResourcesDto {
  @IsOptional() @IsEnum(ResourceType) type?: ResourceType;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() q?: string;
}
