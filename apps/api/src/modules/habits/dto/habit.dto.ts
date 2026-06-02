import { HabitCadence } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateHabitDto {
  @IsString() @MinLength(2) @MaxLength(120) title!: string;
  @IsOptional() @IsEnum(HabitCadence) cadence?: HabitCadence;
  @IsOptional() @IsInt() @Min(1) @Max(50) targetPerPeriod?: number;
  @IsOptional() @IsString() skillSlug?: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
}

export class CheckinDto {
  @IsOptional() @IsDateString() date?: string;
}
