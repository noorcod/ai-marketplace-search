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
import { Province } from './province.entity';
import { CitiesRepository } from '../repositories/cities.repository';
import { LegacyDeliveryCharges } from '@modules/legacy-orders/entities/legacy-delivery-charges.entity';

@Entity({ repository: () => CitiesRepository })
export class City {
  [EntityRepositoryType]?: CitiesRepository;
  [PrimaryKeyProp]?: 'cityId';

  @PrimaryKey({ unsigned: false })
  cityId!: number;

  @Property({ length: 50 })
  cityName!: string;

  @Property({ type: 'tinyint' })
  isActiveForDelivery: number & Opt = 0;

  @ManyToOne({
    entity: () => Province,
    fieldName: 'province_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'ProvinceIdCity',
  })
  province!: Province;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'boolean' })
  isDeleted: boolean & Opt = false;

  @OneToMany(() => LegacyDeliveryCharges, charge => charge.city)
  deliveryCharges? = new Collection<LegacyDeliveryCharges>(this);
}
