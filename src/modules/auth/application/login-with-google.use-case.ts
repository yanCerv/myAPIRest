import { Inject, Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../../users/application/create-user.use-case.js';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import { FindUserByIdUseCase } from '../../users/application/find-user-by-id.use-case.js';
import { EXTERNAL_IDENTITY_REPOSITORY } from './external-identity.repository.js';
import type { ExternalIdentityRepository } from './external-identity.repository.js';
import { GOOGLE_IDENTITY_VERIFIER } from './google-identity-verifier.port.js';
import type { GoogleIdentityVerifier } from './google-identity-verifier.port.js';
import { IssueUserSessionUseCase } from './issue-user-session.use-case.js';
import type { LoginResult } from './login-user.use-case.js';

export class GoogleAccountLinkRequiredError extends Error {
  constructor() {
    super('Google account link required.');
    this.name = 'GoogleAccountLinkRequiredError';
  }
}

export class InvalidGoogleIdentityError extends Error {
  constructor() {
    super('Invalid Google ID token.');
    this.name = 'InvalidGoogleIdentityError';
  }
}

@Injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @Inject(GOOGLE_IDENTITY_VERIFIER)
    private readonly googleIdentity: GoogleIdentityVerifier,
    @Inject(EXTERNAL_IDENTITY_REPOSITORY)
    private readonly identities: ExternalIdentityRepository,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly findUserByEmail: FindUserByEmailUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly issueUserSession: IssueUserSessionUseCase,
  ) {}

  async execute(idToken: string): Promise<LoginResult> {
    let identity;
    try {
      identity = await this.googleIdentity.verify(idToken);
    } catch {
      throw new InvalidGoogleIdentityError();
    }

    const existingIdentity = await this.identities.findByProviderUserId(
      'GOOGLE',
      identity.subject,
    );
    if (existingIdentity) {
      const user = await this.findUserById.execute(existingIdentity.userId);
      if (!user || !user.isActive) throw new InvalidGoogleIdentityError();
      return this.issueUserSession.execute(user.id);
    }

    // An email match alone must not silently attach a new provider identity.
    // The user must first authenticate with their existing account and link it
    // through a dedicated, authenticated endpoint (to be added later).
    if (await this.findUserByEmail.execute(identity.email)) {
      throw new GoogleAccountLinkRequiredError();
    }

    const user = await this.createUser.execute({
      email: identity.email,
      passwordHash: null,
    });
    await this.identities.create({
      userId: user.id,
      provider: 'GOOGLE',
      providerUserId: identity.subject,
    });

    return this.issueUserSession.execute(user.id);
  }
}
