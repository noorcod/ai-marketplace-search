import { Collection, Entity, EntityRepositoryType, OneToMany, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { UserWishlist } from './user-wishlist.entity';
import * as crypto from 'crypto';
import { UserSearches } from './user-searches.entity';
import { UserEvents } from './user-events.entity';
import { MarketplaceUsersRepository } from '../repositories/marketplace-users.repository';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';
import { LegacyOrder } from '@modules/legacy-orders/entities/legacy-order.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { Cart } from '@modules/carts/entities/cart.entity';
import { UserAddress } from '@modules/users/entities/user-address.entity';
import { VoucherUsageLog } from '@modules/orders/entities/voucher-usage-log.entity';

@Entity({ repository: () => MarketplaceUsersRepository })
export class MarketplaceUser {
  [EntityRepositoryType]?: MarketplaceUsersRepository;

  @PrimaryKey({ type: 'uuid', fieldName: 'uuid' })
  id: string = crypto.randomUUID();

  @Property({ length: 150, nullable: true })
  email?: string;

  @Property({ length: 45 })
  firstName!: string;

  @Property({ length: 45, nullable: true })
  lastName?: string;

  @Property({ length: 45, nullable: true, unique: 'phone_number' })
  phoneNumber?: string;

  @Property({ type: 'character' })
  authType!: string;

  @Property({ type: 'tinyint' })
  isEmailVerified: boolean & Opt = false;

  @Property({ type: 'tinyint' })
  isPhoneNumberVerified: boolean & Opt = false;

  @Property({ type: 'datetime', defaultRaw: `2023-07-24 06:48:48` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

  // One-to-Many Relationship with user wishlist
  @OneToMany(() => UserWishlist, wishlist => wishlist.userId)
  wishlists = new Collection<UserWishlist>(this);

  // One-to-Many Relationship with user searches
  @OneToMany(() => UserSearches, searches => searches.user)
  searches = new Collection<UserSearches>(this);

  // One-to-Many Relationship with user events
  @OneToMany(() => UserEvents, events => events.userId)
  events = new Collection<UserEvents>(this);

  @OneToMany(() => ListingReview, review => review.user)
  reviews = new Collection<ListingReview>(this);

  @OneToMany(() => LegacyOrder, order => order.customer)
  legacyOrders = new Collection<LegacyOrder>(this);

  @OneToMany(() => Order, order => order.user)
  orders = new Collection<Order>(this);

  @OneToMany(() => Cart, cart => cart.user)
  carts = new Collection<Cart>(this);

  // TODO: Add one-to-many relationship for user-reviews

  //  user-addresses
  @OneToMany(() => UserAddress, address => address.user)
  address = new Collection<UserAddress>(this);

  @OneToMany(() => VoucherUsageLog, voucherUsageLog => voucherUsageLog.user)
  voucherUsageLogs = new Collection<VoucherUsageLog>(this);
}
