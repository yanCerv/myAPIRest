import { describe, expect, it, vi } from 'vitest';
import { LoginWithGoogleUseCase } from './login-with-google.use-case.js';

const verifiedIdentity = {
  subject: 'google-subject-123',
  email: 'person@example.com',
  firstName: 'Person',
  lastName: 'Example',
  avatarUrl: 'https://example.com/avatar.jpg',
  locale: 'en',
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
  const findUserProfile = { execute: vi.fn().mockResolvedValue(null) };
  const upsertUserProfile = { execute: vi.fn() };
  const issueSession = { execute: vi.fn().mockResolvedValue({ accessToken: 'access-token' }) };

  const dependencies = [
    googleIdentity,
    identities,
    findUserById,
    findUserByEmail,
    createUser,
    findUserProfile,
    upsertUserProfile,
    issueSession,
  ] as unknown as ConstructorParameters<typeof LoginWithGoogleUseCase>;
  return {
    useCase: new LoginWithGoogleUseCase(...dependencies),
    googleIdentity,
    identities,
    findUserById,
    findUserByEmail,
    createUser,
    findUserProfile,
    upsertUserProfile,
    issueSession,
  };
}

describe('LoginWithGoogleUseCase', () => {
  it('creates a passwordless account from a verified Google identity', async () => {
    const { useCase, createUser, upsertUserProfile, identities, issueSession } = createUseCase();

    await useCase.execute('google-id-token');

    expect(createUser.execute).toHaveBeenCalledWith({
      email: 'person@example.com',
      passwordHash: null,
    });
    expect(upsertUserProfile.execute).toHaveBeenCalledWith({
      userId: 'user-id',
      firstName: 'Person',
      lastName: 'Example',
      avatarUrl: 'https://example.com/avatar.jpg',
      locale: 'en',
    });
    expect(identities.create).toHaveBeenCalledWith({
      userId: 'user-id',
      provider: 'GOOGLE',
      providerUserId: 'google-subject-123',
    });
    expect(issueSession.execute).toHaveBeenCalledWith('user-id');
  });

  it('uses the existing user for a known Google subject', async () => {
    const { useCase, identities, findUserById, createUser, findUserProfile, upsertUserProfile, issueSession } = createUseCase();
    vi.mocked(identities.findByProviderUserId).mockResolvedValue({
      userId: 'existing-user-id', provider: 'GOOGLE', providerUserId: 'google-subject-123',
    });
    vi.mocked(findUserById.execute).mockResolvedValue({ id: 'existing-user-id', isActive: true });

    await useCase.execute('google-id-token');

    expect(createUser.execute).not.toHaveBeenCalled();
    expect(findUserProfile.execute).toHaveBeenCalledWith('existing-user-id');
    expect(upsertUserProfile.execute).toHaveBeenCalledWith({
      userId: 'existing-user-id',
      firstName: 'Person',
      lastName: 'Example',
      avatarUrl: 'https://example.com/avatar.jpg',
      locale: 'en',
    });
    expect(issueSession.execute).toHaveBeenCalledWith('existing-user-id');
  });
});
