import { describe, expect, it } from 'vitest';
import { PaymentMethodsService } from './payment-methods.service.js';

describe('PaymentMethodsService', () => {
  it('exposes card as the only currently enabled payment method', () => {
    const response = new PaymentMethodsService().list();

    expect(response.result.map((method) => method.id)).toEqual(['card', 'paypal']);
    expect(response.result.filter((method) => method.isActive).map((method) => method.id)).toEqual(['card']);
  });
});
