import { Collection, Entity, OneToMany, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { Listing } from '@modules/listings/entities/listing.entity';

@Entity()
export class GroupedListing {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ length: 300, nullable: true })
  baseTitle?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOnlinePrice?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxOnlinePrice?: string;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Listing, listing => listing.groupedListing)
  listings = new Collection<Listing>(this);
}
