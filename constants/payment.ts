export type PaymentMethod = 'cod' | 'digital';

export const PAYMENT_ACCOUNT = {
  number: '03175858934',
  name: 'Muhammad Ali Shibli',
  label: 'Easypaisa / JazzCash',
} as const;

export const PAYMENT_METHODS: { id: PaymentMethod; title: string; subtitle: string }[] = [
  { id: 'cod', title: 'Cash on Delivery', subtitle: 'Pay when your order arrives' },
  { id: 'digital', title: PAYMENT_ACCOUNT.label, subtitle: `Send to ${PAYMENT_ACCOUNT.number}` },
];

export function getPaymentLabel(method: PaymentMethod): string {
  return method === 'cod' ? 'COD' : PAYMENT_ACCOUNT.label;
}
