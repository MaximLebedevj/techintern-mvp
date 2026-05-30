import { SeniorityLevel, SkillCategory } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStudentProfileDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(160) headline?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(160) university?: string;

  @IsOptional() @IsInt() @Min(1) @Max(6) course?: number;

  @IsOptional() @IsEnum(SkillCategory) specialization?: SkillCategory;
  @IsOptional() @IsEnum(SeniorityLevel) level?: SeniorityLevel;

  @IsOptional() @IsNumber() @Min(0) @Max(10) experienceYears?: number;

  @IsOptional() @IsUrl({}, { message: 'Некорректная ссылка на GitHub' }) githubUrl?: string;
  @IsOptional() @IsString() @MaxLength(64) telegram?: string;
  @IsOptional() @IsUrl({}, { message: 'Некорректная ссылка' }) websiteUrl?: string;
  @IsOptional() @IsString() avatarUrl?: string;

  @IsOptional() @IsBoolean() openToWork?: boolean;
}
