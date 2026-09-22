export interface AccessTokenIssuer {
  issue(userId: string): Promise<{ token: string; expiresIn: number }>;
}

export const ACCESS_TOKEN_ISSUER = Symbol('ACCESS_TOKEN_ISSUER');
