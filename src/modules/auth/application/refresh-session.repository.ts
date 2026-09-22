export interface CreateRefreshSessionData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshSessionRepository {
  create(data: CreateRefreshSessionData): Promise<void>;
}

export const REFRESH_SESSION_REPOSITORY = Symbol('REFRESH_SESSION_REPOSITORY');
