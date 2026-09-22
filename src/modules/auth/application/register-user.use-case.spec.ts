import { describe, expect, it, vi } from 'vitest';
import { CreateUserUseCase } from '../../users/application/create-user.use-case.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { RegisterUserUseCase } from './register-user.use-case.js';

describe('RegisterUserUseCase', () => {
  it('stores only a hash and returns a safe user representation', async () => {
    const createUser = {
      execute: vi.fn().mockResolvedValue({
        id: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
        email: 'person@example.com',
        passwordHash: 'argon2-hash',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    } as unknown as CreateUserUseCase;
    const passwordHasher: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('argon2-hash'),
    };
    const useCase = new RegisterUserUseCase(createUser, passwordHasher);

    await expect(
      useCase.execute({ email: 'person@example.com', password: 'secure-password' }),
    ).resolves.toEqual({
      id: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
      email: 'person@example.com',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('secure-password');
    expect(createUser.execute).toHaveBeenCalledWith({
      email: 'person@example.com',
      passwordHash: 'argon2-hash',
    });
  });
});
