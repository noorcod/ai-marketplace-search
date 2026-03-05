import { Entity, EntityRepositoryType, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Order } from './order.entity';
import { OrderDeliveryAddressRepository } from '../repositories/order-delivery-address.repository';

@Entity({ repository: () => OrderDeliveryAddressRepository })
export class OrderDeliveryAddress {
  [EntityRepositoryType]?: OrderDeliveryAddressRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({ entity: () => Order, updateRule: 'cascade', deleteRule: 'cascade', index: 'order_id' })
  order!: Order;

  @Property({ length: 100 })
  name!: string;

  @Property({ length: 100, nullable: true })
  email?: string;

  @Property({ length: 15 })
  contact!: string;

  @Property({ length: 15, nullable: true })
  alternativeNumber?: string;

  @Property({ length: 100 })
  streetAddress!: string;

  @Property({ length: 45 })
  city!: string;

  @Property({ length: 45 })
  province!: string;

  @Property({ length: 45 })
  country!: string;

  @Property({ length: 45 })
  nearLandmark!: string;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;
}
