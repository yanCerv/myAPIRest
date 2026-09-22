import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type {
  EmailService,
  SendAccountActionEmailInput,
} from './email.service.js';

@Injectable()
export class ResendEmailService implements EmailService {
  private readonly logger = new Logger(ResendEmailService.name);

  async sendAccountAction(input: SendAccountActionEmailInput): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      throw new Error('RESEND_API_KEY and EMAIL_FROM must be configured.');
    }

    const action = input.purpose === 'reset-password'
      ? 'restablecer tu contraseña'
      : 'restaurar tu cuenta';
    const expiresAt = input.expiresAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [input.recipient],
      subject: `Tu código para ${action}`,
      text: `Tu código para ${action} es: ${input.otp}. Caduca el ${expiresAt}. Si no solicitaste esta acción, ignora este correo.`,
      html: `<p>Tu código para <strong>${action}</strong> es:</p><p style="font-size: 24px; letter-spacing: 4px;"><strong>${input.otp}</strong></p><p>Caduca el ${expiresAt}.</p><p>Si no solicitaste esta acción, ignora este correo.</p>`,
    });

    if (error) {
      this.logger.error(`Resend rejected an account action email: ${error.message}`);
      throw new Error('Unable to send account action email.');
    }
  }
}
