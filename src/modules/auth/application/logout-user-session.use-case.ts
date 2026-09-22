import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { parseRefreshToken } from './refresh-token.js';
import { REFRESH_SESSION_REPOSITORY } from './refresh-session.repository.js';
import type { RefreshSessionRepository } from './refresh-session.repository.js';

@Injectable()
export class LogoutUserSessionUseCase {
  constructor(
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(token: string): Promise<void> {
    const parsed = parseRefreshToken(token);
    if (!parsed) return;
    const session = await this.sessions.findById(parsed.sessionId);
    if (!session || session.revokedAt) return;
    if (!(await this.passwordHasher.verify(session.tokenHash, parsed.rawToken))) return;
    await this.sessions.revoke(session.id, session.version);
  }
}
