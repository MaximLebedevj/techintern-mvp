import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Базовые query-параметры пагинации для списков. */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

/** Единый конверт ответа для постраничных списков. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const paginate = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
