import {
  Entity,
  ManyToOne,
  OneToMany,
  Collection,
  type Opt,
  PrimaryKey,
  Property,
  EntityRepositoryType,
} from '@mikro-orm/core';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';
import { CartItem } from './cart-item.entity';
import { CartRepository } from '../repositories/cart.repository';
import * as crypto from 'crypto';

@Entity({ repository: () => CartRepository })
export class Cart {
  [EntityRepositoryType]?: CartRepository;

  @PrimaryKey({ type: 'character', length: 36 })
  id: string = crypto.randomUUID();

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'user_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    index: 'user_id',
  })
  user?: MarketplaceUser | string;

  @Property()
  quantity!: number;

  @Property({ type: 'boolean' })
  isEmpty: boolean & Opt = false;

  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true, defaultRaw: `0.00` })
  totalAmount?: string;

  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true, defaultRaw: `0.00` })
  totalDiscount?: string;

  @Property({ type: 'integer', nullable: true })
  totalItems?: number = 0;

  @Property({ type: 'boolean' })
  isDummy: boolean & Opt = false;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  @OneToMany(() => CartItem, cartItem => cartItem.cart)
  cartItems = new Collection<CartItem>(this);
}
