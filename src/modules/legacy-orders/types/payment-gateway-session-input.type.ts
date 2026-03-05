export type PaymentGatewaySessionInputType = {
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  clientTransactionId: string;
  cardSave: boolean;
  language: string;
  operation: string;
};
