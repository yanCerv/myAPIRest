import { describe, expect, it, vi } from 'vitest';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import { LoginUserUseCase } from './login-user.use-case.js';
import type { PasswordHasher } from './password-hasher.port.js';
import type { IssueUserSessionUseCase } from './issue-user-session.use-case.js';

describe('LoginUserUseCase', () => {
  it('creates a session for valid credentials', async () => {
    const findUserByEmail = {
      execute: vi.fn().mockResolvedValue({
        id: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
        email: 'person@example.com',
        passwordHash: 'password-hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as FindUserByEmailUseCase;
    const passwordHasher: PasswordHasher = { hash: vi.fn(), verify: vi.fn().mockResolvedValue(true) };
    const issueUserSession = {
      execute: vi.fn().mockResolvedValue({
        accessToken: 'access-token', refreshToken: 'refresh-token', tokenType: 'Bearer', expiresIn: 900,
        accessTokenExpiresAt: new Date(), session: { expiresAt: new Date(), timeZone: 'UTC' },
      }),
    } as unknown as IssueUserSessionUseCase;
    const useCase = new LoginUserUseCase(
      findUserByEmail,
      passwordHasher,
      issueUserSession,
    );

    const result = await useCase.execute({
      email: 'person@example.com',
      password: 'a-long-password-for-testing',
    });

    expect(result).toMatchObject({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    expect(issueUserSession.execute).toHaveBeenCalledWith('5b6959b2-3e13-426c-a2c5-b8770f253b28');
  });
});
