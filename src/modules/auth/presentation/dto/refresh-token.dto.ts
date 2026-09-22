import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(80)
  @MaxLength(200)
  refreshToken!: string;
}
