import { Injectable } from '@nestjs/common';

export interface PaymentMethod {
  id: 'card' | 'paypal';
  title: string;
  iconURL: string;
  webURL: string;
  isActive: boolean;
}

export interface PaymentMethodsResponse {
  result: PaymentMethod[];
}

const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    id: 'card',
    title: 'Tarjeta de crédito / débito',
    iconURL: 'https://cdn-icons-png.flaticon.com/512/633/633611.png',
    webURL: 'https://iframe.paycard.com/form?id=33242123',
    isActive: true,
  },
  {
    id: 'paypal',
    title: 'PayPal',
    iconURL: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
    webURL: 'https://paypal.com/checkout',
    isActive: false,
  },
];

@Injectable()
export class PaymentMethodsService {
  list(): PaymentMethodsResponse {
    return { result: PAYMENT_METHODS.map((method) => ({ ...method })) };
  }
}
