export type ExternalIdentityProvider = 'GOOGLE' | 'APPLE';

export interface ExternalIdentity {
  userId: string;
  provider: ExternalIdentityProvider;
  providerUserId: string;
}

export interface ExternalIdentityRepository {
  findByProviderUserId(
    provider: ExternalIdentityProvider,
    providerUserId: string,
  ): Promise<ExternalIdentity | null>;
  create(identity: ExternalIdentity): Promise<void>;
}

export const EXTERNAL_IDENTITY_REPOSITORY = Symbol('EXTERNAL_IDENTITY_REPOSITORY');
