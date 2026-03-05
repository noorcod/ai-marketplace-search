import {
  Entity,
  EntityRepositoryType,
  OneToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { Shop } from './shop.entity';
import { ShopOptionsRepository } from '../repositories/shop-options.repository';

@Entity({ repository: () => ShopOptionsRepository })
export class ShopOption {
  [EntityRepositoryType]?: ShopOptionsRepository;
  [PrimaryKeyProp]?: 'id';

  @PrimaryKey({ unsigned: false })
  id!: number;

  @OneToOne({
    entity: () => Shop,
    fieldName: 'fk_shop_id',
  })
  shop: Shop;

  @Property({ type: 'tinyint' })
  isD4uEnabled: number & Opt = 0;

  @Property({ type: 'tinyint' })
  isD4uModuleIncluded: number & Opt = 0;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}
