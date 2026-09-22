import { describe, expect, it, vi } from 'vitest';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import type { AccessTokenIssuer } from './access-token-issuer.port.js';
import { LoginUserUseCase } from './login-user.use-case.js';
import type { PasswordHasher } from './password-hasher.port.js';
import type { RefreshSessionRepository } from './refresh-session.repository.js';

describe('LoginUserUseCase', () => {
  it('issues an access token and stores only the refresh token hash', async () => {
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
    const passwordHasher: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('refresh-token-hash'),
      verify: vi.fn().mockResolvedValue(true),
    };
    const accessTokens: AccessTokenIssuer = {
      issue: vi.fn().mockResolvedValue({ token: 'access-token', expiresIn: 900 }),
    };
    const sessions: RefreshSessionRepository = {
      create: vi.fn(),
    };
    const useCase = new LoginUserUseCase(
      findUserByEmail,
      passwordHasher,
      accessTokens,
      sessions,
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
    expect(result.refreshToken).toContain('.');
    expect(result.refreshToken).not.toBe('refresh-token-hash');
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
        tokenHash: 'refresh-token-hash',
      }),
    );
  });
});
