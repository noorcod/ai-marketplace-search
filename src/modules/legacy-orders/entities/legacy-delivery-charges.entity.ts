import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Categories } from '@modules/lookups/entities/categories.entity';
import { City } from '@modules/lookups/entities/city.entity';
import { LegacyDeliveryChargesRepository } from '../repositories/legacy-delivery-charges.repository';

@Entity({ repository: () => LegacyDeliveryChargesRepository, tableName: 'd4u_delivery_charges' })
export class LegacyDeliveryCharges {
  [EntityRepositoryType] = LegacyDeliveryChargesRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne(() => City, { fieldName: 'city_id', index: 'city_id' })
  city!: City;

  @Property({ length: 50 })
  cityName!: string;

  @ManyToOne(() => Categories, { fieldName: 'category_id', index: 'category_id' })
  category!: Categories;

  @Property({ length: 50 })
  categoryName!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  charges!: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;
}
