export interface SendAccountActionEmailInput {
  recipient: string;
  purpose: 'reset-password' | 'restore-account' | 'login';
  otp: string;
  expiresAt: Date;
}

export interface EmailService {
  sendAccountAction(input: SendAccountActionEmailInput): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
