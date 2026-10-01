export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  locale?: string;
}

export interface GoogleIdentityVerifier {
  verify(idToken: string): Promise<VerifiedGoogleIdentity>;
}

export const GOOGLE_IDENTITY_VERIFIER = Symbol('GOOGLE_IDENTITY_VERIFIER');
