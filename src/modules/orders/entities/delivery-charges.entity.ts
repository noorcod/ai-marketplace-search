import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Categories } from '@modules/lookups/entities/categories.entity';
import { City } from '@modules/lookups/entities/city.entity';
import { DeliveryChargesRepository } from '../repositories/delivery-charges.repository';

@Entity({ repository: () => DeliveryChargesRepository })
export class DeliveryCharges {
  [EntityRepositoryType]?: DeliveryChargesRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => City,
    fieldName: 'city_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'city_id',
  })
  city!: City;

  @Property({ length: 50 })
  cityName!: string;

  @ManyToOne({ entity: () => Categories, updateRule: 'cascade', deleteRule: 'cascade', index: 'category_id' })
  category!: Categories;

  @Property({ length: 50 })
  categoryName!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  averageWeight!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  interCityCharges!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  intraCityCharges!: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'tinyint' })
  isDeleted: number & Opt = 0;
}
