import { Entity, EntityRepositoryType, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { ProvincesRepository } from '../repositories/provinces.repository';

@Entity({ repository: () => ProvincesRepository })
export class Province {
  [EntityRepositoryType]?: ProvincesRepository;

  [PrimaryKeyProp]?: 'provinceId';

  @PrimaryKey({ unsigned: false })
  provinceId!: number;

  @Property({ length: 30 })
  provinceName!: string;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property()
  isDeleted!: boolean;
}
