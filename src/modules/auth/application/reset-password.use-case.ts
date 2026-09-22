import { Inject, Injectable } from '@nestjs/common';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import { USER_REPOSITORY, type UserRepository } from '../../users/domain/user.repository.js';
import {
  ACCOUNT_ACTION_TOKEN_REPOSITORY,
  type AccountActionTokenRepository,
} from './account-action-token.repository.js';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher.port.js';
import { REFRESH_SESSION_REPOSITORY, type RefreshSessionRepository } from './refresh-session.repository.js';

export class InvalidPasswordResetCodeError extends Error {
  constructor() {
    super('Invalid or expired password reset code.');
    this.name = 'InvalidPasswordResetCodeError';
  }
}

export interface ResetPasswordCommand {
  email: string;
  otp: string;
  newPassword: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCOUNT_ACTION_TOKEN_REPOSITORY)
    private readonly tokens: AccountActionTokenRepository,
    @Inject(REFRESH_SESSION_REPOSITORY)
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const user = await this.findUserByEmail.execute(command.email);
    if (!user || !user.isActive) throw new InvalidPasswordResetCodeError();

    const token = await this.tokens.findPending(user.id, 'RESET_PASSWORD');
    if (
      !token ||
      token.attempts >= 5 ||
      token.expiresAt <= new Date() ||
      !(await this.passwordHasher.verify(token.tokenHash, command.otp))
    ) {
      if (token && token.attempts < 5 && token.expiresAt > new Date()) {
        await this.tokens.registerFailedAttempt(token.id);
      }
      throw new InvalidPasswordResetCodeError();
    }

    const passwordHash = await this.passwordHasher.hash(command.newPassword);
    if (!(await this.tokens.consume(token.id))) throw new InvalidPasswordResetCodeError();

    await this.users.updatePassword(user.id, passwordHash);
    await this.sessions.revokeAllForUser(user.id);
  }
}
