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
  accessTokenExpiresAt: Date;
  session: { expiresAt: Date; timeZone: 'UTC' };
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
    const absoluteExpiresAt = new Date(Date.now() + this.sessionTtlHours() * 3_600_000);

    await this.sessions.create({
      id: sessionId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: absoluteExpiresAt,
      absoluteExpiresAt,
    });

    const accessToken = await this.accessTokens.issue(user.id);

    return {
      accessToken: accessToken.token,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresIn,
      accessTokenExpiresAt: new Date(Date.now() + accessToken.expiresIn * 1000),
      session: { expiresAt: absoluteExpiresAt, timeZone: 'UTC' },
    };
  }

  private sessionTtlHours(): number {
    const value = Number(process.env.SESSION_TTL_HOURS ?? 24);

    if (!Number.isInteger(value) || value < 1 || value > 24 * 30) {
      throw new Error('SESSION_TTL_HOURS must be an integer between 1 and 720.');
    }

    return value;
  }

}
