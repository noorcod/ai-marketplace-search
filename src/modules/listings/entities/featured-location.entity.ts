import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core';
import { FeaturedListingsRepository } from '../repositories/featured-listings.repository';

@Entity({ repository: () => FeaturedListingsRepository })
export class FeaturedLocation {
  [EntityRepositoryType] = FeaturedListingsRepository;
  @PrimaryKey({ unsigned: false })
  id!: number;

  @Property({ unique: 'place' })
  place!: string;

  @Property()
  totalSpots!: number;

  @Property()
  availableSpots!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Property()
  spotWeight!: number;

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
