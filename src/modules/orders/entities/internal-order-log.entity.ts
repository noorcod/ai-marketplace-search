import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Order } from './order.entity';

@Entity()
export class InternalOrderLog {
  [PrimaryKeyProp]?: 'postmanId';

  @PrimaryKey({ unsigned: false })
  postmanId!: number;

  @Property({ length: 100 })
  postmanName!: string;

  @Property({ length: 45 })
  postmanPhone!: string;

  @ManyToOne({ entity: () => Order, updateRule: 'cascade', deleteRule: 'cascade', index: 'fk_order_id' })
  order!: Order;

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
