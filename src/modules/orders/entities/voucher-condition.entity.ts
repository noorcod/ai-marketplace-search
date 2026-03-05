import { Entity, EntityRepositoryType, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Voucher } from './voucher.entity';
import { VoucherConditionsRepository } from '../repositories/voucher-conditions.repository';

@Entity({ repository: () => VoucherConditionsRepository })
export class VoucherCondition {
  [EntityRepositoryType]?: VoucherConditionsRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => Voucher,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'voucher_condition_voucher_FK',
  })
  voucher!: Voucher;

  @Enum({ items: () => VoucherConditionConditionType })
  conditionType!: VoucherConditionConditionType;

  @Enum({ items: () => VoucherConditionOperator })
  operator!: VoucherConditionOperator;

  @Property({ type: 'json' })
  value!: any;
}

export enum VoucherConditionConditionType {
  CITY = 'CITY',
  CATEGORY = 'CATEGORY',
  PRODUCT = 'PRODUCT',
  USER = 'USER',
  USER_GROUP = 'USER_GROUP',
  SHOP = 'SHOP',
  DATE_RANGE = 'DATE_RANGE',
  PAYMENT_METHOD = 'PAYMENT_METHOD',
  MIN_ORDER = 'MIN_ORDER',
  CUSTOM = 'CUSTOM',
}

export enum VoucherConditionOperator {
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  EQ = 'EQ',
  GTE = 'GTE',
  LTE = 'LTE',
  BETWEEN = 'BETWEEN',
}
