import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString() @MinLength(2) @MaxLength(120) title!: string;

  @IsString() @MinLength(10) @MaxLength(2000) description!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  technologies!: string[];

  @IsOptional() @IsString() @MaxLength(80) role?: string;
  @IsOptional() @IsUrl({}, { message: 'Некорректная ссылка' }) url?: string;
  @IsOptional() @IsUrl({}, { message: 'Некорректная ссылка на репозиторий' }) githubUrl?: string;
}
