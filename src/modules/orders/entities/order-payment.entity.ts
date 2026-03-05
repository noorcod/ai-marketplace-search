import { Entity, EntityRepositoryType, OneToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Order } from './order.entity';
import { OrderPaymentRepository } from '../repositories/order-payment.repository';

@Entity({ repository: () => OrderPaymentRepository })
export class OrderPayment {
  [EntityRepositoryType]?: OrderPaymentRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @OneToOne({ entity: () => Order, updateRule: 'cascade', deleteRule: 'cascade', index: 'order_id' })
  order!: Order;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amountReceivable!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountReceived?: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  trxFailureMessage?: string;

  @Property({ type: 'enum', length: 4 })
  trxMethod: string & Opt = 'Cash';

  @Property({ type: 'datetime', nullable: true })
  trxTime!: Date & Opt;

  @Property({ type: 'string', length: 100, nullable: true })
  trxId?: string;

  @Property({ type: 'decimal', precision: 3, scale: 2 })
  trxAmount!: string;

  @Property({ type: 'decimal', precision: 3, scale: 2 })
  mdr_percent!: string;

  @Property({ type: 'decimal', precision: 3, scale: 2 })
  taxPercent!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  platformCharges!: string;

  @Property({ nullable: true })
  trxProof?: string;

  @Property({ type: 'enum', length: 14 })
  trxStatus: string & Opt = 'PENDING';

  @Property({ type: 'character', length: 36, nullable: true })
  trxSessionId?: string;

  @Property({ type: 'character', length: 36, nullable: true })
  trxUuid?: string;

  @Property({ type: 'enum', length: 7 })
  trxRefundStatus: string & Opt = 'NA';

  @Property({ type: 'text', length: 65535, nullable: true })
  trxRefundReason?: string;

  @Property({ nullable: true })
  trxRefundDatetime?: Date;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  trxRefundAmount?: string;

  @Property({ type: 'character', length: 36, nullable: true })
  trxRefundId?: string;

  @Property({ fieldName: 'handler_id', nullable: true, index: 'handler_id' })
  handler?: number;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ nullable: true })
  deletedAt?: Date;

  @Property({ type: 'boolean' })
  isDummy: boolean & Opt = false;
}
