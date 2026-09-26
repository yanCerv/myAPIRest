import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { ACCESS_TOKEN_ISSUER } from './access-token-issuer.port.js';
import type { AccessTokenIssuer } from './access-token-issuer.port.js';
import type { LoginResult } from './login-user.use-case.js';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { REFRESH_SESSION_REPOSITORY } from './refresh-session.repository.js';
import type { RefreshSessionRepository } from './refresh-session.repository.js';

@Injectable()
export class IssueUserSessionUseCase {
  constructor(
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly accessTokens: AccessTokenIssuer,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(userId: string): Promise<LoginResult> {
    const sessionId = randomUUID();
    const refreshToken = `${sessionId}.${randomBytes(32).toString('base64url')}`;
    const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
    const sessionTtlHours = this.getSessionTtlHours();
    const absoluteExpiresAt = new Date(Date.now() + sessionTtlHours * 3_600_000);

    await this.sessions.create({
      id: sessionId,
      userId,
      tokenHash: refreshTokenHash,
      expiresAt: absoluteExpiresAt,
      absoluteExpiresAt,
    });

    const accessToken = await this.accessTokens.issue(userId);
    return {
      accessToken: accessToken.token,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresIn,
      accessTokenExpiresAt: new Date(Date.now() + accessToken.expiresIn * 1000),
      session: { expiresAt: absoluteExpiresAt, timeZone: 'UTC' },
    };
  }

  private getSessionTtlHours(): number {
    const value = Number(process.env.SESSION_TTL_HOURS ?? 24);
    if (!Number.isInteger(value) || value < 1 || value > 24 * 30) {
      throw new Error('SESSION_TTL_HOURS must be an integer between 1 and 720.');
    }
    return value;
  }
}
