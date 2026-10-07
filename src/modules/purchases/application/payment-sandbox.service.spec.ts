import { describe, expect, it } from 'vitest';
import { PaymentDeclinedError, PaymentInvalidDetailsError, PaymentSandboxService } from './payment-sandbox.service.js';

describe('PaymentSandboxService', () => {
  const service = new PaymentSandboxService();

  it('authorizes a configured sandbox card without exposing its full number', () => {
    expect(service.authorize({ cardNumber: '4242 4242 4242 4242', expiry: '10/30', cvc: '111' })).toEqual({
      method: 'VISA',
      last4: '4242',
    });
  });

  it('rejects a configured decline scenario', () => {
    expect(() => service.authorize({ cardNumber: '4000000000000002', expiry: '10/30', cvc: '111' }))
      .toThrow(PaymentDeclinedError);
  });

  it('rejects incorrect sandbox details', () => {
    expect(() => service.authorize({ cardNumber: '4242424242424242', expiry: '10/30', cvc: '999' }))
      .toThrow(PaymentInvalidDetailsError);
  });
});
