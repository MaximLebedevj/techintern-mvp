import { SkillCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListCandidatesDto extends PaginationDto {
  /** Если задан — кандидаты ранжируются по match-score под эту вакансию. */
  @IsOptional() @IsString() vacancyId?: string;

  @IsOptional() @IsString() q?: string;

  @IsOptional() @IsEnum(SkillCategory) specialization?: SkillCategory;
}
