import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import { ACCESS_TOKEN_ISSUER } from './access-token-issuer.port.js';
import type { AccessTokenIssuer } from './access-token-issuer.port.js';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { REFRESH_SESSION_REPOSITORY } from './refresh-session.repository.js';
import type { RefreshSessionRepository } from './refresh-session.repository.js';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsError';
  }
}

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokens: AccessTokenIssuer,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.findUserByEmail.execute(command.email);

    if (
      !user ||
      !user.isActive ||
      !(await this.passwordHasher.verify(user.passwordHash, command.password))
    ) {
      throw new InvalidCredentialsError();
    }

    const sessionId = randomUUID();
    const refreshSecret = randomBytes(32).toString('base64url');
    const refreshToken = `${sessionId}.${refreshSecret}`;
    const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );

    await this.sessions.create({
      id: sessionId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    const accessToken = await this.accessTokens.issue(user.id);

    return {
      accessToken: accessToken.token,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresIn,
    };
  }

  private getRefreshTokenTtlDays(): number {
    const value = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

    if (!Number.isInteger(value) || value <= 0 || value > 90) {
      throw new Error('REFRESH_TOKEN_TTL_DAYS must be an integer between 1 and 90.');
    }

    return value;
  }
}
