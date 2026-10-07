import { Injectable } from '@nestjs/common';

export type SandboxPaymentMethod = 'VISA' | 'MASTERCARD' | 'AMEX';

interface SandboxCard {
  number: string;
  expiry: string;
  cvc: string;
  method: SandboxPaymentMethod;
  outcome: 'APPROVED' | 'DECLINED';
}

export class PaymentInvalidDetailsError extends Error {
  constructor() {
    super('Payment details are invalid.');
    this.name = 'PaymentInvalidDetailsError';
  }
}

export class PaymentDeclinedError extends Error {
  constructor() {
    super('Payment declined.');
    this.name = 'PaymentDeclinedError';
  }
}

const SANDBOX_CARDS: readonly SandboxCard[] = [
  { number: '4242424242424242', expiry: '10/30', cvc: '111', method: 'VISA', outcome: 'APPROVED' },
  { number: '4000000000000002', expiry: '10/30', cvc: '111', method: 'VISA', outcome: 'DECLINED' },
  { number: '5555555555554444', expiry: '10/30', cvc: '222', method: 'MASTERCARD', outcome: 'APPROVED' },
  { number: '5105105105105100', expiry: '10/30', cvc: '222', method: 'MASTERCARD', outcome: 'DECLINED' },
  { number: '378282246310005', expiry: '10/30', cvc: '3333', method: 'AMEX', outcome: 'APPROVED' },
  { number: '371449635398431', expiry: '10/30', cvc: '3333', method: 'AMEX', outcome: 'DECLINED' },
];

@Injectable()
export class PaymentSandboxService {
  authorize(input: { cardNumber: string; expiry: string; cvc: string }): {
    method: SandboxPaymentMethod;
    last4: string;
  } {
    const cardNumber = input.cardNumber.replaceAll(/\s/g, '');
    const card = SANDBOX_CARDS.find((candidate) => candidate.number === cardNumber);

    if (!card || card.expiry !== input.expiry || card.cvc !== input.cvc) {
      throw new PaymentInvalidDetailsError();
    }

    if (card.outcome === 'DECLINED') throw new PaymentDeclinedError();

    return { method: card.method, last4: card.number.slice(-4) };
  }
}
