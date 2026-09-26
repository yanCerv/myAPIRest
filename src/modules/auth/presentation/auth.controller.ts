import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmailAlreadyInUseError } from '../../users/domain/user.errors.js';
import { RegisterUserUseCase } from '../application/register-user.use-case.js';
import type { RegisteredUser } from '../application/register-user.use-case.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import {
  InvalidCredentialsError,
  LoginUserUseCase,
} from '../application/login-user.use-case.js';
import type { LoginResult } from '../application/login-user.use-case.js';
import { LogoutUserSessionUseCase } from '../application/logout-user-session.use-case.js';
import { InvalidRefreshTokenError, RefreshUserSessionUseCase } from '../application/refresh-user-session.use-case.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { RequestPasswordResetUseCase } from '../application/request-password-reset.use-case.js';
import {
  InvalidPasswordResetCodeError,
  ResetPasswordUseCase,
} from '../application/reset-password.use-case.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { RequestLoginOtpDto } from './dto/request-login-otp.dto.js';
import { RequestLoginOtpUseCase } from '../application/request-login-otp.use-case.js';
import { InvalidLoginOtpError, VerifyLoginOtpUseCase } from '../application/verify-login-otp.use-case.js';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshUserSession: RefreshUserSessionUseCase,
    private readonly logoutUserSession: LogoutUserSessionUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly requestLoginOtp: RequestLoginOtpUseCase,
    private readonly verifyLoginOtp: VerifyLoginOtpUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Create an account' })
  @ApiResponse({ status: 201, description: 'Account created.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() input: RegisterUserDto): Promise<RegisteredUser> {
    try {
      return await this.registerUser.execute(input);
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException('Email already registered.');
      }

      throw error;
    }
  }

  @Post('request-login-code')
  @ApiOperation({ summary: 'Request a passwordless login OTP' })
  @ApiResponse({ status: 202, description: 'Always returned to avoid account enumeration.' })
  @HttpCode(202)
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async requestLoginCode(@Body() input: RequestLoginOtpDto): Promise<{ message: string }> {
    await this.requestLoginOtp.execute(input.email);
    return { message: 'If an active account matches this email, a login code will be sent.' };
  }

  @Post('verify-login-code')
  @ApiOperation({ summary: 'Verify a passwordless login OTP and start a session' })
  @ApiResponse({ status: 201, description: 'Session created.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired login OTP.' })
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async verifyLoginCode(@Body() input: VerifyLoginOtpDto): Promise<LoginResult> {
    try {
      return await this.verifyLoginOtp.execute(input.email, input.otp);
    } catch (error) {
      if (error instanceof InvalidLoginOtpError) {
        throw new UnauthorizedException('Invalid or expired login code.');
      }
      throw error;
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password-recovery OTP' })
  @ApiResponse({ status: 202, description: 'Always returned to avoid account enumeration.' })
  @HttpCode(202)
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async forgotPassword(@Body() input: RequestPasswordResetDto): Promise<{ message: string }> {
    await this.requestPasswordReset.execute(input.email);
    return {
      message: 'If an active account matches this email, recovery instructions will be sent.',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password using an OTP' })
  @ApiResponse({ status: 204, description: 'Password changed and active refresh sessions revoked.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async resetPasswordWithOtp(@Body() input: ResetPasswordDto): Promise<void> {
    try {
      await this.resetPassword.execute(input);
    } catch (error) {
      if (error instanceof InvalidPasswordResetCodeError) {
        throw new UnauthorizedException('Invalid or expired password reset code.');
      }
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Start a session and receive access and refresh tokens' })
  @ApiResponse({ status: 201, description: 'Session created.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() input: LoginUserDto): Promise<LoginResult> {
    try {
      return await this.loginUser.execute(input);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid email or password.');
      }

      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate a refresh token' })
  @ApiResponse({ status: 201, description: 'New access and refresh tokens issued.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(@Body() input: RefreshTokenDto): Promise<LoginResult> {
    try {
      return await this.refreshUserSession.execute(input.refreshToken);
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) throw new UnauthorizedException('Invalid refresh token.');
      throw error;
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke the refresh-token session' })
  @ApiResponse({ status: 200, description: 'Session revoked or already absent.' })
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async logout(@Body() input: RefreshTokenDto): Promise<{ success: true }> {
    await this.logoutUserSession.execute(input.refreshToken);
    return { success: true };
  }
}
