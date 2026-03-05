import { Entity, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Listing } from './listing.entity';

@Entity()
export class ListingTag {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne(() => Listing, {
    fieldName: 'listing_id',
  })
  listing!: Listing;

  @Property({ fieldName: 'tag_id', index: 'tag_id' })
  tag!: number;

  @Property({ length: 50 })
  tagName!: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}
