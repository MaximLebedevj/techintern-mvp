import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConnectIntegrationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9._-]+$/, { message: 'Некорректный логин' })
  username!: string;
}
