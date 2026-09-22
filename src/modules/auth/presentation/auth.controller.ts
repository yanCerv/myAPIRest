import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshUserSession: RefreshUserSessionUseCase,
    private readonly logoutUserSession: LogoutUserSessionUseCase,
  ) {}

  @Post('register')
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

  @Post('login')
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
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async logout(@Body() input: RefreshTokenDto): Promise<void> {
    await this.logoutUserSession.execute(input.refreshToken);
  }
}
