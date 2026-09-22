import { describe, expect, it, vi } from 'vitest';
import { CreateUserUseCase } from './create-user.use-case.js';
import {
  EmailAlreadyInUseError,
  InvalidUserEmailError,
} from '../domain/user.errors.js';
import type { UserRepository } from '../domain/user.repository.js';

const createdUser = {
  id: '5b6959b2-3e13-426c-a2c5-b8770f253b28',
  email: 'person@example.com',
  passwordHash: 'hash',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createRepository(): UserRepository {
  return {
    create: vi.fn().mockResolvedValue(createdUser),
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn(),
  };
}

describe('CreateUserUseCase', () => {
  it('normalizes the email before creating the user', async () => {
    const users = createRepository();
    const useCase = new CreateUserUseCase(users);

    await useCase.execute({
      email: ' Person@Example.COM ',
      passwordHash: 'hash',
    });

    expect(users.create).toHaveBeenCalledWith({
      email: 'person@example.com',
      passwordHash: 'hash',
    });
  });

  it('rejects an invalid email', async () => {
    const useCase = new CreateUserUseCase(createRepository());

    await expect(
      useCase.execute({ email: 'not-an-email', passwordHash: 'hash' }),
    ).rejects.toBeInstanceOf(InvalidUserEmailError);
  });

  it('rejects an email already in use', async () => {
    const users = createRepository();
    vi.mocked(users.findByEmail).mockResolvedValue(createdUser);
    const useCase = new CreateUserUseCase(users);

    await expect(
      useCase.execute({ email: 'person@example.com', passwordHash: 'hash' }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });
});
