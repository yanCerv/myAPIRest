import { describe, expect, it, vi } from 'vitest';
import { LoginWithGoogleUseCase } from './login-with-google.use-case.js';

const verifiedIdentity = {
  subject: 'google-subject-123',
  email: 'person@example.com',
};

function createUseCase() {
  const googleIdentity = { verify: vi.fn().mockResolvedValue(verifiedIdentity) };
  const identities = {
    findByProviderUserId: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
  };
  const findUserById = { execute: vi.fn() };
  const findUserByEmail = { execute: vi.fn().mockResolvedValue(null) };
  const createUser = {
    execute: vi.fn().mockResolvedValue({ id: 'user-id', ...verifiedIdentity, isActive: true }),
  };
  const issueSession = { execute: vi.fn().mockResolvedValue({ accessToken: 'access-token' }) };

  const dependencies = [
    googleIdentity,
    identities,
    findUserById,
    findUserByEmail,
    createUser,
    issueSession,
  ] as unknown as ConstructorParameters<typeof LoginWithGoogleUseCase>;
  return {
    useCase: new LoginWithGoogleUseCase(...dependencies),
    googleIdentity,
    identities,
    findUserById,
    findUserByEmail,
    createUser,
    issueSession,
  };
}

describe('LoginWithGoogleUseCase', () => {
  it('creates a passwordless account from a verified Google identity', async () => {
    const { useCase, createUser, identities, issueSession } = createUseCase();

    await useCase.execute('google-id-token');

    expect(createUser.execute).toHaveBeenCalledWith({
      email: 'person@example.com',
      passwordHash: null,
    });
    expect(identities.create).toHaveBeenCalledWith({
      userId: 'user-id',
      provider: 'GOOGLE',
      providerUserId: 'google-subject-123',
    });
    expect(issueSession.execute).toHaveBeenCalledWith('user-id');
  });

  it('uses the existing user for a known Google subject', async () => {
    const { useCase, identities, findUserById, createUser, issueSession } = createUseCase();
    vi.mocked(identities.findByProviderUserId).mockResolvedValue({
      userId: 'existing-user-id', provider: 'GOOGLE', providerUserId: 'google-subject-123',
    });
    vi.mocked(findUserById.execute).mockResolvedValue({ id: 'existing-user-id', isActive: true });

    await useCase.execute('google-id-token');

    expect(createUser.execute).not.toHaveBeenCalled();
    expect(issueSession.execute).toHaveBeenCalledWith('existing-user-id');
  });
});
