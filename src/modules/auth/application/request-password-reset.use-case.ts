import { Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  EMAIL_SERVICE,
  type EmailService,
} from '../../../infrastructure/email/email.service.js';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import {
  ACCOUNT_ACTION_TOKEN_REPOSITORY,
  type AccountActionTokenRepository,
} from './account-action-token.repository.js';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher.port.js';

const OTP_TTL_MS = 15 * 60_000;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(ACCOUNT_ACTION_TOKEN_REPOSITORY)
    private readonly tokens: AccountActionTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.findUserByEmail.execute(email);
    if (!user || !user.isActive) return;

    const otp = randomInt(100_000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.tokens.replacePending({
      userId: user.id,
      purpose: 'RESET_PASSWORD',
      tokenHash: await this.passwordHasher.hash(otp),
      expiresAt,
    });

    await this.emailService.sendAccountAction({
      recipient: user.email,
      purpose: 'reset-password',
      otp,
      expiresAt,
    });
  }
}
