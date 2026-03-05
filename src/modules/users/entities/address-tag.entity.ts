import { Collection, Entity, EntityRepositoryType, OneToMany, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { AddressTagRepository } from '../repositories/address-tag.repository';
import { UserAddress } from './user-address.entity';

@Entity({ repository: () => AddressTagRepository })
export class AddressTag {
  [EntityRepositoryType]?: AddressTagRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 45 })
  label!: string;

  @Property({ type: 'boolean' })
  isDeleted: boolean & Opt = false;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  @OneToMany(() => UserAddress, address => address.tag)
  addresses = new Collection<UserAddress>(this);
}
