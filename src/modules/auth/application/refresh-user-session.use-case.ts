import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { ACCESS_TOKEN_ISSUER } from './access-token-issuer.port.js';
import type { AccessTokenIssuer } from './access-token-issuer.port.js';
import type { LoginResult } from './login-user.use-case.js';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { parseRefreshToken } from './refresh-token.js';
import { REFRESH_SESSION_REPOSITORY } from './refresh-session.repository.js';
import type { RefreshSessionRepository } from './refresh-session.repository.js';

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid refresh token.');
    this.name = 'InvalidRefreshTokenError';
  }
}

@Injectable()
export class RefreshUserSessionUseCase {
  constructor(
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly accessTokens: AccessTokenIssuer,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(token: string): Promise<LoginResult> {
    const parsed = parseRefreshToken(token);
    if (!parsed) throw new InvalidRefreshTokenError();

    const session = await this.sessions.findById(parsed.sessionId);
    if (
      !session || !session.userIsActive || session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await this.passwordHasher.verify(session.tokenHash, parsed.rawToken))
    ) throw new InvalidRefreshTokenError();

    const refreshToken = `${session.id}.${randomBytes(32).toString('base64url')}`;
    const tokenHash = await this.passwordHasher.hash(refreshToken);
    const expiresAt = new Date(Date.now() + this.ttlDays() * 86_400_000);
    const rotated = await this.sessions.rotate({
      id: session.id, expectedVersion: session.version, tokenHash, expiresAt,
    });
    if (!rotated) throw new InvalidRefreshTokenError();

    const accessToken = await this.accessTokens.issue(session.userId);
    return { accessToken: accessToken.token, refreshToken, tokenType: 'Bearer', expiresIn: accessToken.expiresIn };
  }

  private ttlDays(): number {
    const value = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
    if (!Number.isInteger(value) || value <= 0 || value > 90) throw new Error('REFRESH_TOKEN_TTL_DAYS must be an integer between 1 and 90.');
    return value;
  }
}
