import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class ListingViews {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ fieldName: 'fk_listing_id', index: 'fk_listing_id' })
  listing!: number;

  @Property({ fieldName: 'fk_user_id', type: 'character', length: 36, nullable: true, index: 'fk_user_id' })
  user?: string;

  @Property({ length: 45, nullable: true })
  ip?: string;

  @Property()
  createdAt!: Date;
}
