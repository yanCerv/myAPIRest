import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Opaque refresh token returned by login or refresh.' })
  @IsString()
  @MinLength(80)
  @MaxLength(200)
  refreshToken!: string;
}
