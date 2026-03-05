import { Entity, EntityRepositoryType, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { AddressTag } from './address-tag.entity';
import { MarketplaceUser } from '@modules/users/entities/marketplace-user.entity';
import { UserAddressRepository } from '../repositories/user-address.repository';

@Entity({ repository: () => UserAddressRepository })
export class UserAddress {
  [EntityRepositoryType]?: UserAddressRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'user_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'user_id',
  })
  user!: MarketplaceUser;

  @ManyToOne({ entity: () => AddressTag, updateRule: 'cascade', deleteRule: 'cascade', index: 'tag_id' })
  tag!: AddressTag;

  @Property()
  streetAddress!: string;

  @Property({ length: 45 })
  cityId!: number;

  @Property({ length: 45 })
  provinceId!: number;

  @Property({ length: 45 })
  city!: string;

  @Property({ length: 45 })
  province!: string;

  @Property({ length: 45 })
  country!: string;

  @Property({ type: 'boolean' })
  isMain: boolean & Opt = false;

  @Property({ length: 75, nullable: true })
  nearLandmark?: string;

  @Property({ length: 5 })
  zipCode?: string;

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
