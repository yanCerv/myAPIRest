import { describe, expect, it, vi } from 'vitest';
import type { EmailService } from '../../../infrastructure/email/email.service.js';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import type { AccountActionTokenRepository } from './account-action-token.repository.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case.js';

describe('RequestPasswordResetUseCase', () => {
  it('creates a hashed OTP and sends it for an active user', async () => {
    const findUser = {
      execute: vi.fn().mockResolvedValue({
      id: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
      email: 'person@example.com',
      passwordHash: 'password-hash',
      isActive: true,
      }),
    } as unknown as FindUserByEmailUseCase;
    const passwordHasher: PasswordHasher = { hash: vi.fn().mockResolvedValue('otp-hash') };
    const tokens: AccountActionTokenRepository = { replacePending: vi.fn() };
    const emailService: EmailService = { sendAccountAction: vi.fn() };
    const useCase = new RequestPasswordResetUseCase(findUser, passwordHasher, tokens, emailService);

    await useCase.execute('person@example.com');

    expect(passwordHasher.hash).toHaveBeenCalledWith(expect.stringMatching(/^\d{6}$/));
    expect(tokens.replacePending).toHaveBeenCalledWith(expect.objectContaining({
      userId: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
      purpose: 'RESET_PASSWORD',
      tokenHash: 'otp-hash',
      expiresAt: expect.any(Date),
    }));
    expect(emailService.sendAccountAction).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'person@example.com',
      purpose: 'reset-password',
      otp: expect.stringMatching(/^\d{6}$/),
      expiresAt: expect.any(Date),
    }));
  });

  it('does nothing when no active account matches the email', async () => {
    const findUser = { execute: vi.fn().mockResolvedValue(null) } as unknown as FindUserByEmailUseCase;
    const passwordHasher: PasswordHasher = { hash: vi.fn() };
    const tokens: AccountActionTokenRepository = { replacePending: vi.fn() };
    const emailService: EmailService = { sendAccountAction: vi.fn() };
    const useCase = new RequestPasswordResetUseCase(findUser, passwordHasher, tokens, emailService);

    await useCase.execute('unknown@example.com');

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(tokens.replacePending).not.toHaveBeenCalled();
    expect(emailService.sendAccountAction).not.toHaveBeenCalled();
  });
});
