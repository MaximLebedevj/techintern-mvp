import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

/** Регистрация может создавать студента или компанию. */
export enum RegisterRole {
  STUDENT = 'STUDENT',
  COMPANY = 'COMPANY',
}

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string;

  @ApiProperty({ example: 'SuperSecret123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(72, { message: 'Пароль слишком длинный' })
  password!: string;

  @ApiProperty({ example: 'Иван Иванов' })
  @IsString()
  @MinLength(2, { message: 'Укажите имя' })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: RegisterRole, example: RegisterRole.STUDENT })
  @IsEnum(RegisterRole, { message: 'Роль должна быть STUDENT или COMPANY' })
  role!: RegisterRole;
}
