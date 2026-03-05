import {
  Entity,
  EntityRepositoryType,
  OneToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { Shop } from './shop.entity';
import { ShopOptionsRepository } from '../repositories/shop-options.repository';

@Entity({ repository: () => ShopOptionsRepository })
export class Subscriptions {
  [EntityRepositoryType]?: ShopOptionsRepository;
  [PrimaryKeyProp]?: 'subscriptionId';

  @PrimaryKey({ unsigned: false })
  subscriptionId!: number;

  @OneToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
  })
  shop!: Shop;

  @Property({ length: 60 })
  subscriptionStatus!: string;

  @Property({ fieldName: 'current_plan_id', index: 'currentPlanId' })
  currentPlanId!: number;

  @Property({ length: 100 })
  currentPlanName!: string;

  @Property({ columnType: 'timestamp', nullable: true })
  currentPlanStartDate?: Date;

  @Property({ columnType: 'timestamp', nullable: true })
  currentPlanEndDate?: Date;

  @Property({ length: 60, nullable: true })
  currentPlanBillingFrequency?: string;

  @Property({ fieldName: 'next_plan_id', index: 'nextPlanId' })
  nextPlanId!: number;

  @Property({ length: 100, nullable: true })
  nextPlanName?: string;

  @Property({ columnType: 'timestamp', nullable: true })
  nextPlanStartDate?: Date;

  @Property({ length: 60, nullable: true })
  nextPlanBillingFrequency?: string;

  @Property()
  locationsLimit!: number;

  @Property()
  consumedLocations!: number;

  @Property()
  emailsLimit!: number;

  @Property()
  consumedEmails!: number;

  @Property()
  smsLimit!: number;

  @Property()
  consumedSms!: number;

  @Property()
  marketplaceItemsLimit!: number;

  @Property()
  consumedMarketplaceItems!: number;

  @Property()
  secondaryUsersLimit!: number;

  @Property()
  consumedSecondaryUsers!: number;

  @Property({ columnType: 'timestamp', nullable: true })
  bannerShowingStartDate?: Date;

  @Property({ columnType: 'timestamp', nullable: true })
  gracePeriodEndsOn?: Date;

  @Property({ fieldName: 'is_subscription_cancelled' })
  isSubscriptionCancelled!: boolean;

  @Property({ columnType: 'timestamp', nullable: true })
  cancelledOn?: Date;

  @Property()
  isActive!: boolean;

  @Property({ type: 'datetime', columnType: 'timestamp', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;
}
