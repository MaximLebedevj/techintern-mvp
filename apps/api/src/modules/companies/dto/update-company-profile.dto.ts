import { CompanySize } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(140) name?: string;
  @IsOptional() @IsString() @MaxLength(3000) description?: string;
  @IsOptional() @IsUrl({}, { message: 'Некорректный адрес сайта' }) website?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(80) industry?: string;
  @IsOptional() @IsEnum(CompanySize) size?: CompanySize;
  @IsOptional() @IsString() logoUrl?: string;
}
