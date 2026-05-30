import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

export class StudentSkillInput {
  @IsString() skillId!: string;

  @IsInt() @Min(0) @Max(100) progress!: number;
}

export class UpdateSkillsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StudentSkillInput)
  skills!: StudentSkillInput[];
}
