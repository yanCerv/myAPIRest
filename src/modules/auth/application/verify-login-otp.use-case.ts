import { Inject, Injectable } from '@nestjs/common';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import {
  ACCOUNT_ACTION_TOKEN_REPOSITORY,
  type AccountActionTokenRepository,
} from './account-action-token.repository.js';
import { IssueUserSessionUseCase } from './issue-user-session.use-case.js';
import type { LoginResult } from './login-user.use-case.js';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher.port.js';

export class InvalidLoginOtpError extends Error {
  constructor() {
    super('Invalid or expired login code.');
    this.name = 'InvalidLoginOtpError';
  }
}

@Injectable()
export class VerifyLoginOtpUseCase {
  constructor(
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCOUNT_ACTION_TOKEN_REPOSITORY)
    private readonly tokens: AccountActionTokenRepository,
    private readonly issueUserSession: IssueUserSessionUseCase,
  ) {}

  async execute(email: string, otp: string): Promise<LoginResult> {
    const user = await this.findUserByEmail.execute(email);
    if (!user || !user.isActive) throw new InvalidLoginOtpError();

    const token = await this.tokens.findPending(user.id, 'LOGIN_OTP');
    if (
      !token ||
      token.attempts >= 5 ||
      token.expiresAt <= new Date() ||
      !(await this.passwordHasher.verify(token.tokenHash, otp))
    ) {
      if (token && token.attempts < 5 && token.expiresAt > new Date()) {
        await this.tokens.registerFailedAttempt(token.id);
      }
      throw new InvalidLoginOtpError();
    }

    if (!(await this.tokens.consume(token.id))) throw new InvalidLoginOtpError();
    return this.issueUserSession.execute(user.id);
  }
}
