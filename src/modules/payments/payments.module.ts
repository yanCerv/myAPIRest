import { Module } from '@nestjs/common';
import { PaymentMethodsService } from './application/payment-methods.service.js';
import { PaymentMethodsController } from './presentation/payment-methods.controller.js';

@Module({
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
})
export class PaymentsModule {}
