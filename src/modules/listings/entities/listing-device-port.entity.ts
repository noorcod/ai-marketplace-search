import { Entity, ManyToOne, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Listing } from './listing.entity';

@Entity()
export class ListingDevicePort {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne(() => Listing, { fieldName: 'listing_id' })
  listing!: Listing | number;

  @Property({ length: 30 })
  portName!: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;
}
