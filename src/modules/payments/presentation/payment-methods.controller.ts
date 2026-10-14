import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from '../application/payment-methods.service.js';

@ApiTags('Payment methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethods: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'List the payment methods available in the application' })
  @ApiResponse({ status: 200, description: 'Payment methods and their current availability.' })
  list() {
    return this.paymentMethods.list();
  }
}
