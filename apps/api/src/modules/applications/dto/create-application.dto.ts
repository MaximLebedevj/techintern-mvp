import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString() vacancyId!: string;

  @IsOptional() @IsString() @MinLength(10) @MaxLength(3000) coverLetter?: string;
}
