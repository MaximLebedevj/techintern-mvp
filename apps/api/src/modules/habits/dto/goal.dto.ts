import { PartialType } from '@nestjs/swagger';
import { GoalStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGoalDto {
  @IsString() @MinLength(3) @MaxLength(140) title!: string;
  @IsOptional() @IsString() @MaxLength(500) specific?: string;
  @IsOptional() @IsString() @MaxLength(200) measurable?: string;
  @IsOptional() @IsInt() @Min(1) metricTarget?: number;
  @IsOptional() @IsInt() @Min(0) metricCurrent?: number;
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
  @IsOptional() @IsString() skillSlug?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @IsOptional() @IsEnum(GoalStatus) status?: GoalStatus;
}
