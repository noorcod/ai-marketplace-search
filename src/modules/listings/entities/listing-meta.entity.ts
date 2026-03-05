import { Entity, OneToOne, type Opt, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Listing } from './listing.entity';

@Entity()
export class ListingMeta {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @OneToOne(() => Listing, listing => listing.listingMetadata, {
    fieldName: 'listing_id',
    owner: true,
  })
  listing!: Ref<Listing>;

  @Property({ type: 'enum', length: 11 })
  metaKey!: string;

  @Property({ type: 'text', length: 65535 })
  metaValue!: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}
