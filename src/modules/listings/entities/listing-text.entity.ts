import { Entity, OneToOne, type Opt, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Listing } from './listing.entity';

@Entity()
export class ListingText {
  @PrimaryKey({ unsigned: false })
  id!: number;

  // owning side of the one-to-one relationship
  @OneToOne(() => Listing, listing => listing.listingText, {
    fieldName: 'listing_id',
    owner: true,
  })
  listing!: Ref<Listing>;

  @Property({ columnType: 'longtext', ignoreSchemaChanges: ['type'] })
  description!: unknown;

  @Property({ type: 'text', length: 65535, nullable: true })
  notes?: string;

  @Property({ type: 'boolean', nullable: true })
  isAutoGen?: boolean = false;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}
