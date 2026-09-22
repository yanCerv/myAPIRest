import { Global, Module } from '@nestjs/common';
import { ConsoleEmailService } from './console-email.service.js';
import { EMAIL_SERVICE } from './email.service.js';
import { ResendEmailService } from './resend-email.service.js';

@Global()
@Module({
  providers: [
    ConsoleEmailService,
    ResendEmailService,
    {
      provide: EMAIL_SERVICE,
      useFactory: (
        consoleEmailService: ConsoleEmailService,
        resendEmailService: ResendEmailService,
      ) => {
        const provider = process.env.EMAIL_PROVIDER ?? 'console';
        if (provider === 'console') return consoleEmailService;
        if (provider === 'resend') {
          if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
            throw new Error('RESEND_API_KEY and EMAIL_FROM must be configured for Resend.');
          }
          return resendEmailService;
        }
        throw new Error('EMAIL_PROVIDER must be either "console" or "resend".');
      },
      inject: [ConsoleEmailService, ResendEmailService],
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
