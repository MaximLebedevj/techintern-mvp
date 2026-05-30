import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Некорректный email' })
  email!: string;

  @ApiProperty({ example: 'SuperSecret123' })
  @IsString()
  @MinLength(1, { message: 'Введите пароль' })
  password!: string;
}
