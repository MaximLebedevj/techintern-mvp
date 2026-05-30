import { PartialType } from '@nestjs/swagger';
import { CreateVacancyDto } from './create-vacancy.dto';

/** Все поля создания, но опциональные. skills при наличии заменяет набор целиком. */
export class UpdateVacancyDto extends PartialType(CreateVacancyDto) {}
