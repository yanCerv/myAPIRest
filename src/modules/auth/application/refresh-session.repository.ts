export interface CreateRefreshSessionData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface RefreshSessionRepository {
  create(data: CreateRefreshSessionData): Promise<void>;
  findById(id: string): Promise<RefreshSession | null>;
  rotate(data: RotateRefreshSessionData): Promise<boolean>;
  revoke(id: string, expectedVersion: number): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const REFRESH_SESSION_REPOSITORY = Symbol('REFRESH_SESSION_REPOSITORY');

export interface RefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  version: number;
  userIsActive: boolean;
}

export interface RotateRefreshSessionData {
  id: string;
  expectedVersion: number;
  tokenHash: string;
  expiresAt: Date;
}
