export type ApgUpdateOrderType = {
  updatedAt: Date;
  trxTime: string;
  trxExpectedSettlementAmount: number;
  trxAmount: string;
  trxId: string;
  trxStatus: string;
  status: string;
  mdrPercent: number;
  taxPercent: number;
};
