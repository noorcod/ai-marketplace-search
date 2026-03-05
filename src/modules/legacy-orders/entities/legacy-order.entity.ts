import {
  BeforeCreate,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToOne,
  OneToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { LegacyVoucher } from './legacy-voucher.entity';
import { Listing } from '../../listings/entities/listing.entity';
import { Shop } from '@modules/stores/entities/shop.entity';
import { Location } from '@modules/stores/entities/location.entity';
import { Items } from '@modules/listings/entities/items.entity';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';
import { LegacyOrderRepository } from '../repositories/legacy-order.repository';

import {
  LegacyOrderStatus,
  LegacyOrderOrderHandledBy,
  LegacyOrderTrxMethod,
  LegacyOrderTrxStatus,
  LegacyOrderTrxRefundStatus,
  DiscountUnit,
} from '../types/legacy-order.types';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';

@Entity({ repository: () => LegacyOrderRepository, tableName: 'd4u_order' })
export class LegacyOrder {
  [EntityRepositoryType] = LegacyOrderRepository;

  [PrimaryKeyProp]?: 'orderId';

  @PrimaryKey({ unsigned: false })
  orderId!: number;

  @Property({ length: 18 })
  orderNumber!: string;

  @Property({ length: 300 })
  productTitle!: string;

  @Property()
  quantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice!: number;

  @Enum({ items: () => DiscountUnit })
  discountUnit!: DiscountUnit;

  @ManyToOne({ entity: () => LegacyVoucher, nullable: true, index: 'fk_voucher_id_ct' })
  voucher?: LegacyVoucher;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  discountValue!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2, defaultRaw: `0.00` })
  voucherDiscount!: number & Opt;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  deliveryCharges!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;

  @Enum({ items: () => LegacyOrderStatus })
  status: LegacyOrderStatus & Opt = LegacyOrderStatus.PENDING;

  @Property({ type: 'text', length: 65535, nullable: true })
  notes?: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  reason?: string;

  @Enum({ items: () => LegacyOrderOrderHandledBy })
  orderHandledBy: LegacyOrderOrderHandledBy = LegacyOrderOrderHandledBy.SUPPORT;

  @Property({ length: 70 })
  customerName!: string;

  @Property({ length: 100 })
  customerEmail!: string;

  @Property({ length: 18 })
  customerPhone!: string;

  @Property({ type: 'text', length: 65535 })
  customerAddress!: string;

  @Property({ type: 'text', length: 255, nullable: true })
  trxProof?: string;

  @Enum({ items: () => LegacyOrderTrxMethod })
  trxMethod: LegacyOrderTrxMethod & Opt = LegacyOrderTrxMethod.CASH;

  @Enum({ items: () => LegacyOrderTrxStatus })
  trxStatus: LegacyOrderTrxStatus & Opt = LegacyOrderTrxStatus.PENDING;

  @Property({ type: 'character', length: 36, nullable: true })
  trxSessionId?: string;

  @Property({ type: 'character', length: 36, nullable: true })
  trxUuid?: string;

  @Enum({ items: () => LegacyOrderTrxRefundStatus })
  trxRefundStatus: LegacyOrderTrxRefundStatus & Opt = LegacyOrderTrxRefundStatus.NA;

  @Property({ type: 'text', length: 65535, nullable: true })
  trxRefundReason?: string;

  @Property({ nullable: true })
  trxRefundDatetime?: Date;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  trxRefundAmount?: string;

  @Property({ type: 'character', length: 36, nullable: true })
  trxRefundId?: string;

  @ManyToOne(() => Listing, { fieldName: 'fk_listing_id', index: 'd4u_order_fk_listing_id' })
  listing!: Listing;

  @ManyToOne(() => MarketplaceUser, {
    fieldName: 'fk_customer_id',
    type: 'character',
    length: 36,
    nullable: true,
    index: 'd4u_order_fk_customer_id',
  })
  customer?: MarketplaceUser | string;

  @ManyToOne(() => Shop, { fieldName: 'fk_shop_id', nullable: true, index: 'd4u_order_fk_shop_id' })
  shop?: Shop;

  @ManyToOne(() => Location, { fieldName: 'fk_location_id', nullable: true, index: 'd4u_order_fk_location_id' })
  location?: Location;

  @ManyToOne(() => Items, { fieldName: 'fk_item_id', nullable: true, index: 'd4u_order_fk_item_id' })
  item?: Items;

  @Property({ fieldName: 'fk_handler_id', nullable: true, index: 'd4u_order_fk_handler_id' })
  handler?: number;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;

  @Property({ nullable: true })
  deletedAt?: Date;

  @OneToOne(() => ListingReview, review => review.legacyOrder)
  review?: ListingReview;

  @BeforeCreate()
  assignOrderNumber() {
    if (!this.orderNumber) {
      if (typeof this.customer === 'string') {
        this.orderNumber = generateOrderNumber(this.customer);
      } else {
        this.orderNumber = generateOrderNumber(this.customer?.id ?? null);
      }
    }
  }
}

function generateOrderNumber(fk_customer_id: string | null): string {
  const prefix = 'TB'; // 2 characters
  const timestamp = Date.now().toString(); // 13 digits
  const isRegistered = fk_customer_id ? '1' : '0'; // 1 or 0

  return `${prefix}-${timestamp}-${isRegistered}`;
}
