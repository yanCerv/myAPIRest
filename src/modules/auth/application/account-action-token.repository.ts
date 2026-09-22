export type AccountActionPurpose = 'RESET_PASSWORD' | 'RESTORE_ACCOUNT';

export interface CreateAccountActionTokenData {
  userId: string;
  purpose: AccountActionPurpose;
  tokenHash: string;
  expiresAt: Date;
}

export interface AccountActionTokenRepository {
  replacePending(data: CreateAccountActionTokenData): Promise<void>;
  findPending(userId: string, purpose: AccountActionPurpose): Promise<AccountActionToken | null>;
  registerFailedAttempt(tokenId: string): Promise<void>;
  consume(tokenId: string): Promise<boolean>;
}

export const ACCOUNT_ACTION_TOKEN_REPOSITORY = Symbol(
  'ACCOUNT_ACTION_TOKEN_REPOSITORY',
);

export interface AccountActionToken {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  attempts: number;
}
