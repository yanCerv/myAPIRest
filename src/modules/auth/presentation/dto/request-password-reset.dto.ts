import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'person@example.com', maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
