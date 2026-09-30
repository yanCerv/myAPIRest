import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginWithGoogleDto {
  @ApiProperty({ description: 'Google OpenID Connect ID token obtained by the native SDK.' })
  @IsString()
  @MinLength(20)
  @MaxLength(8192)
  idToken!: string;
}
