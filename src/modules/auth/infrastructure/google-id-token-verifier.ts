import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import type {
  GoogleIdentityVerifier,
  VerifiedGoogleIdentity,
} from '../application/google-identity-verifier.port.js';

@Injectable()
export class GoogleIdTokenVerifier implements GoogleIdentityVerifier {
  private readonly client = new OAuth2Client();

  async verify(idToken: string): Promise<VerifiedGoogleIdentity> {
    const audience = process.env.GOOGLE_IOS_CLIENT_ID;
    if (!audience) throw new Error('GOOGLE_IOS_CLIENT_ID must be configured.');

    const ticket = await this.client.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error('Google identity is missing a verified email.');
    }

    return {
      subject: payload.sub,
      email: payload.email.trim().toLowerCase(),
      firstName: payload.given_name,
      lastName: payload.family_name,
      avatarUrl: payload.picture,
      locale: payload.locale,
    };
  }
}
