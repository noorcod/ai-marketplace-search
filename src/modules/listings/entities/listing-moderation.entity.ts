import { Entity, OneToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Listing } from './listing.entity';

@Entity()
export class ListingModeration {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @OneToOne(() => Listing, {
    fieldName: 'listing_id',
  })
  listing!: Listing;

  @Property({ fieldName: 'moderator_id', index: 'moderator_id' })
  moderator!: number;

  @Property({ type: 'enum', length: 8 })
  status!: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  reason?: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}
