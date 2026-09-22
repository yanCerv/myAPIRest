import { describe, expect, it, vi } from 'vitest';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import type { AccountActionTokenRepository } from './account-action-token.repository.js';
import type { PasswordHasher } from './password-hasher.port.js';
import type { RefreshSessionRepository } from './refresh-session.repository.js';
import { InvalidPasswordResetCodeError, ResetPasswordUseCase } from './reset-password.use-case.js';

describe('ResetPasswordUseCase', () => {
  const user = { id: '5b6959b2-3e13-426c-a2c5-b8770f253b28', email: 'person@example.com', isActive: true };

  it('updates the password, consumes the OTP, and revokes all sessions', async () => {
    const findUser = { execute: vi.fn().mockResolvedValue(user) } as unknown as FindUserByEmailUseCase;
    const users: UserRepository = { updatePassword: vi.fn() } as UserRepository;
    const passwordHasher: PasswordHasher = { hash: vi.fn().mockResolvedValue('new-password-hash'), verify: vi.fn().mockResolvedValue(true) };
    const tokens: AccountActionTokenRepository = {
      findPending: vi.fn().mockResolvedValue({ id: 'token-id', tokenHash: 'otp-hash', expiresAt: new Date(Date.now() + 60_000), attempts: 0 }),
      consume: vi.fn().mockResolvedValue(true), replacePending: vi.fn(), registerFailedAttempt: vi.fn(),
    };
    const sessions: RefreshSessionRepository = { revokeAllForUser: vi.fn() } as RefreshSessionRepository;
    const useCase = new ResetPasswordUseCase(findUser, users, passwordHasher, tokens, sessions);

    await useCase.execute({ email: user.email, otp: '123456', newPassword: 'new-secure-password' });

    expect(tokens.consume).toHaveBeenCalledWith('token-id');
    expect(users.updatePassword).toHaveBeenCalledWith(user.id, 'new-password-hash');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(user.id);
  });

  it('counts a failed OTP attempt and leaves password and sessions untouched', async () => {
    const findUser = { execute: vi.fn().mockResolvedValue(user) } as unknown as FindUserByEmailUseCase;
    const users: UserRepository = { updatePassword: vi.fn() } as UserRepository;
    const passwordHasher: PasswordHasher = { hash: vi.fn(), verify: vi.fn().mockResolvedValue(false) };
    const tokens: AccountActionTokenRepository = {
      findPending: vi.fn().mockResolvedValue({ id: 'token-id', tokenHash: 'otp-hash', expiresAt: new Date(Date.now() + 60_000), attempts: 0 }),
      consume: vi.fn(), replacePending: vi.fn(), registerFailedAttempt: vi.fn(),
    };
    const sessions: RefreshSessionRepository = { revokeAllForUser: vi.fn() } as RefreshSessionRepository;
    const useCase = new ResetPasswordUseCase(findUser, users, passwordHasher, tokens, sessions);

    await expect(useCase.execute({ email: user.email, otp: '123456', newPassword: 'new-secure-password' }))
      .rejects.toBeInstanceOf(InvalidPasswordResetCodeError);
    expect(tokens.registerFailedAttempt).toHaveBeenCalledWith('token-id');
    expect(users.updatePassword).not.toHaveBeenCalled();
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });
});
