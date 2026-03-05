export type ApgCardTrxResponseType = {
  ResponseCode: string;
  Description: string;
  MerchantId: string;
  MerchantName: string;
  StoreId: string;
  StoreName: string;
  TransactionTypeId: string;
  TransactionReferenceNumber: string;
  OrderDateTime: string;
  TransactionId: string;
  TransactionDateTime: string;
  AccountNumber: string | null;
  TransactionAmount: string;
  MobileNumber: string;
  TransactionStatus: string;
};
