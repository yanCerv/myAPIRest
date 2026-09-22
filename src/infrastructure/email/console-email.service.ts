import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailService,
  SendAccountActionEmailInput,
} from './email.service.js';

@Injectable()
export class ConsoleEmailService implements EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  async sendAccountAction(input: SendAccountActionEmailInput): Promise<void> {
    this.logger.log({
      event: 'account-action-email',
      recipient: input.recipient,
      purpose: input.purpose,
      otp: input.otp,
      expiresAt: input.expiresAt.toISOString(),
    });
  }
}
