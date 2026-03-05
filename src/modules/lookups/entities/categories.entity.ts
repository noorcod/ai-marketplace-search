import { Collection, Entity, EntityRepositoryType, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { CategoriesRepository } from '../repositories/categories.repository';
import { LegacyDeliveryCharges } from '@modules/legacy-orders/entities/legacy-delivery-charges.entity';

@Entity({ repository: () => CategoriesRepository })
export class Categories {
  [EntityRepositoryType]?: CategoriesRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 250 })
  label!: string;

  @Property()
  createdAt!: Date;

  @Property()
  isDeleted!: boolean;

  @OneToMany(() => LegacyDeliveryCharges, charge => charge.category)
  deliveryCharges? = new Collection<LegacyDeliveryCharges>(this);
}
