import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EmploymentType, SeniorityLevel, WorkFormat } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** Приводит одиночное query-значение к массиву (?skills=react&skills=typescript). */
const toArray = ({ value }: { value: unknown }): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string' && value.length > 0) return value.split(',');
  return [];
};

export class SearchVacanciesDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

  /** Точный стек: slug'и навыков. Вакансия должна содержать ВСЕ выбранные (глубокий фильтр). */
  @IsOptional() @Transform(toArray) @IsArray() @IsString({ each: true })
  skills?: string[];

  @IsOptional() @IsString() city?: string;

  @IsOptional() @IsEnum(WorkFormat) workFormat?: WorkFormat;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsOptional() @IsEnum(SeniorityLevel) level?: SeniorityLevel;

  @IsOptional() @Transform(({ value }) => (value ? Number(value) : undefined)) @IsInt()
  salaryMin?: number;

  @IsOptional() @IsString() sort?: 'recent' | 'salary';
}
