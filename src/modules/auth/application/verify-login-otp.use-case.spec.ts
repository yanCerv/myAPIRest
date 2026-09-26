import { describe, expect, it, vi } from 'vitest';
import type { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import type { AccountActionTokenRepository } from './account-action-token.repository.js';
import type { IssueUserSessionUseCase } from './issue-user-session.use-case.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { VerifyLoginOtpUseCase } from './verify-login-otp.use-case.js';

describe('VerifyLoginOtpUseCase', () => {
  it('consumes a valid login OTP before issuing a session', async () => {
    const findUser = { execute: vi.fn().mockResolvedValue({ id: 'user-id', email: 'person@example.com', isActive: true }) } as unknown as FindUserByEmailUseCase;
    const passwordHasher = { verify: vi.fn().mockResolvedValue(true) } as unknown as PasswordHasher;
    const tokens = {
      findPending: vi.fn().mockResolvedValue({ id: 'otp-id', tokenHash: 'otp-hash', expiresAt: new Date(Date.now() + 60_000), attempts: 0 }),
      consume: vi.fn().mockResolvedValue(true),
    } as unknown as AccountActionTokenRepository;
    const sessions = { execute: vi.fn().mockResolvedValue({ accessToken: 'access-token' }) } as unknown as IssueUserSessionUseCase;
    const useCase = new VerifyLoginOtpUseCase(findUser, passwordHasher, tokens, sessions);

    await expect(useCase.execute('person@example.com', '123456')).resolves.toEqual({ accessToken: 'access-token' });
    expect(tokens.consume).toHaveBeenCalledWith('otp-id');
    expect(sessions.execute).toHaveBeenCalledWith('user-id');
  });
});
