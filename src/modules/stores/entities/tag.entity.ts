import { Entity, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Shop } from '@modules/stores/entities/shop.entity';

@Entity()
export class Tag {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 50 })
  tagName!: string;

  @ManyToOne({
    entity: () => Shop,
    fieldName: 'shop_id',
  })
  shop!: Shop;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;
}
