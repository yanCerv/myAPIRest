import { describe, expect, it, vi } from 'vitest';
import type { EmailService } from '../../../infrastructure/email/email.service.js';
import type { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import type { AccountActionTokenRepository } from './account-action-token.repository.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { RequestLoginOtpUseCase } from './request-login-otp.use-case.js';

describe('RequestLoginOtpUseCase', () => {
  it('stores a hashed one-time login code for an active user', async () => {
    const findUser = { execute: vi.fn().mockResolvedValue({ id: 'user-id', email: 'person@example.com', isActive: true }) } as unknown as FindUserByEmailUseCase;
    const passwordHasher = { hash: vi.fn().mockResolvedValue('otp-hash') } as unknown as PasswordHasher;
    const tokens = { replacePending: vi.fn() } as unknown as AccountActionTokenRepository;
    const emailService = { sendAccountAction: vi.fn() } as unknown as EmailService;
    const useCase = new RequestLoginOtpUseCase(findUser, passwordHasher, tokens, emailService);

    await useCase.execute('person@example.com');

    expect(tokens.replacePending).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-id', purpose: 'LOGIN_OTP', tokenHash: 'otp-hash',
    }));
    expect(emailService.sendAccountAction).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'person@example.com', purpose: 'login', otp: expect.stringMatching(/^\d{6}$/),
    }));
  });
});
