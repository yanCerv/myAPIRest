import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otp!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}
