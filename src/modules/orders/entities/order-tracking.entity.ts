import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { DeliveryPartner } from './delivery-partner.entity';
import { Order } from './order.entity';
import { OrderTrackingRepository } from '../repositories/order-tracking.repository';

@Entity({ repository: () => OrderTrackingRepository })
export class OrderTracking {
  [EntityRepositoryType]?: OrderTrackingRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ type: 'boolean' })
  isSelfManaged: boolean & Opt = false;

  @Property({ type: 'boolean' })
  isTrackable: boolean & Opt = false;

  @Property({ type: 'enum', length: 17 })
  status: string & Opt = 'Pending';

  @Property({ nullable: true, length: 45 })
  trackingId?: string;

  @Property({ length: 100, nullable: true })
  postmanName?: string;

  @Property({ length: 20, nullable: true })
  postmanPhone?: string;

  @ManyToOne({ entity: () => Order, updateRule: 'cascade', deleteRule: 'cascade', index: 'order_id' })
  order!: Order;

  @ManyToOne({
    entity: () => DeliveryPartner,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    nullable: true,
    index: 'delivery_partner_id',
  })
  deliveryPartner?: DeliveryPartner;
}
