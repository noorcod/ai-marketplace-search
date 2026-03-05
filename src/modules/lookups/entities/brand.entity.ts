import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core';
import { BrandsRepository } from '../repositories/brands.repository';

@Entity({ repository: () => BrandsRepository })
export class Brand {
  [EntityRepositoryType]?: BrandsRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 250 })
  label!: string;

  @Property()
  isMobile!: boolean;

  @Property()
  isLaptop!: boolean;

  @Property()
  isDesktop!: boolean;

  @Property()
  isTab!: boolean;

  @Property()
  isLed!: boolean;

  @Property()
  isAccessory!: boolean;

  @Property()
  createdAt!: Date;

  @Property()
  isDeleted!: boolean;

  @Property({ nullable: true })
  logo?: string;
}
