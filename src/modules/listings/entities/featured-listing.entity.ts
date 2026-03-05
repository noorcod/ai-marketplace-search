import {
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Ref,
} from '@mikro-orm/core';
import { FeaturedLocation } from './featured-location.entity';
import { Listing } from './listing.entity';
import { FeaturedListingsRepository } from '../repositories/featured-listings.repository';

@Entity({ repository: () => FeaturedListingsRepository })
export class FeaturedListing {
  [EntityRepositoryType] = FeaturedListingsRepository;
  [PrimaryKeyProp]?: 'featuredListingId';

  @PrimaryKey({ unsigned: false, fieldName: 'featured_listing_id' })
  id!: number;

  @OneToOne(() => Listing, {
    fieldName: 'fk_listing_id',
    index: 'featured_listing_listing_id_constraints',
    owner: true,
  })
  listing!: Ref<Listing>;

  @Property({ nullable: true, fieldName: 'fk_booking_id' })
  bookingId?: number;

  @ManyToOne({
    entity: () => FeaturedLocation,
    fieldName: 'fk_featured_location_id',
    nullable: true,
    index: 'fk_featured_location_id',
  })
  displayLocation?: FeaturedLocation;

  @Property({ nullable: true })
  featuredSince?: Date;

  @Property({ nullable: true })
  allowedDuration?: number;

  @Property({ columnType: 'timestamp', nullable: true, defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

  @Property({
    columnType: 'timestamp',
    nullable: true,
    defaultRaw: `CURRENT_TIMESTAMP`,
    extra: 'on update CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  @Property({ type: 'boolean', nullable: true })
  isDeleted?: boolean = false;
}
