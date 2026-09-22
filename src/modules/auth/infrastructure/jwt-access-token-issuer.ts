import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenIssuer } from '../application/access-token-issuer.port.js';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  async issue(userId: string): Promise<{ token: string; expiresIn: number }> {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);

    if (!secret || secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long.');
    }

    if (!Number.isInteger(expiresIn) || expiresIn <= 0 || expiresIn > 3600) {
      throw new Error('JWT_ACCESS_TTL_SECONDS must be an integer between 1 and 3600.');
    }

    const token = await this.jwt.signAsync(
      { sub: userId, type: 'access' },
      { secret, expiresIn },
    );

    return { token, expiresIn };
  }
}
