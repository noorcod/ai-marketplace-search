import {
  Collection,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OneToMany,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { Shop } from './shop.entity';
import { City } from '@modules/lookups/entities/city.entity';
import { Province } from '@modules/lookups/entities/province.entity';
import { LocationsRepository } from '../repositories/locations.repository';
import { LegacyOrder } from '@modules/legacy-orders/entities/legacy-order.entity';
import { CartItem } from '@modules/carts/entities/cart-item.entity';
import { OrderSource } from '@modules/orders/entities/order-source.entity';

@Entity({ repository: () => LocationsRepository })
export class Location {
  [EntityRepositoryType]?: LocationsRepository;
  [PrimaryKeyProp]?: 'locationId';

  @PrimaryKey({ fieldName: 'location_id', unsigned: false })
  locationId!: number;

  @ManyToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'ShopIdLocation',
  })
  shop!: Shop;

  @ManyToOne({
    entity: () => City,
    fieldName: 'city_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'CityIdLocation',
  })
  city!: City;

  @ManyToOne({
    entity: () => Province,
    updateRule: 'cascade',
    deleteRule: 'cascade',
    fieldName: 'province_id',
    index: 'ProvinceIdLocation',
  })
  province!: Province;

  @Property({ length: 500 })
  address!: string;

  @Property({ type: 'decimal', precision: 10, scale: 6 })
  latitude!: string;

  @Property({ type: 'decimal', precision: 10, scale: 6 })
  longitude!: string;

  @Property({ length: 150, nullable: true })
  shopWorkingDays?: string;

  @Property({ length: 100 })
  locationNick!: string;

  @Property({ length: 18 })
  locationNumber!: string;

  @Property()
  isContactNoOnInvoice!: boolean;

  @Property({ length: 18, nullable: true })
  locationBackupNumber?: string;

  @Property()
  isAlternativeNoOnInvoice!: boolean;

  @Property()
  isMain!: boolean;

  @Property({ nullable: true })
  activeTill?: Date;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'boolean' })
  isActive: boolean & Opt = true;

  @Property({ type: 'boolean' })
  isDeleted: boolean & Opt = false;

  @OneToMany(() => LegacyOrder, order => order.location)
  deliveryForYouOrders? = new Collection<LegacyOrder>(this);

  @OneToMany(() => CartItem, cartItem => cartItem.location)
  cartItems? = new Collection<CartItem>(this);

  @OneToMany(() => OrderSource, orderSource => orderSource.location)
  orderSources? = new Collection<OrderSource>(this);
}
