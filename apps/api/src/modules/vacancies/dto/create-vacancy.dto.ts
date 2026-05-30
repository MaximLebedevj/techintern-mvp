import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EmploymentType, SeniorityLevel, VacancyStatus, WorkFormat } from '@prisma/client';

export class VacancySkillInput {
  @IsString() skillId!: string;

  @IsOptional() @IsBoolean() required?: boolean = true;

  @IsOptional() @IsNumber() @Min(0.1) @Max(3) weight?: number = 1;
}

export class CreateVacancyDto {
  @IsString() @MinLength(4) @MaxLength(140) title!: string;

  @IsString() @MinLength(20) @MaxLength(6000) description!: string;

  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20)
  responsibilities?: string[] = [];

  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20)
  requirements?: string[] = [];

  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20)
  conditions?: string[] = [];

  @IsOptional() @IsString() @MaxLength(80) city?: string;

  @IsEnum(WorkFormat) workFormat!: WorkFormat;
  @IsEnum(EmploymentType) employmentType!: EmploymentType;
  @IsEnum(SeniorityLevel) level!: SeniorityLevel;

  @IsOptional() @IsNumber() @Min(0) @Max(5) experienceYears?: number = 0;

  @IsOptional() @IsInt() @Min(0) salaryMin?: number;
  @IsOptional() @IsInt() @Min(0) salaryMax?: number;

  @IsOptional() @IsEnum(VacancyStatus) status?: VacancyStatus;

  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => VacancySkillInput)
  skills!: VacancySkillInput[];
}
