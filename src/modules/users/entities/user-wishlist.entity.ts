import { Entity, EntityRepositoryType, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { MarketplaceUser } from './marketplace-user.entity';
import { UserWishlistRepository } from '../repositories/user-wishlist.repository';
import { Listing } from '@modules/listings/entities/listing.entity';

@Entity({ repository: () => UserWishlistRepository })
export class UserWishlist {
  [EntityRepositoryType]?: UserWishlistRepository;

  @PrimaryKey({ unsigned: false })
  id!: number;

  @ManyToOne({
    entity: () => MarketplaceUser,
    fieldName: 'fk_user_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_user_id',
  })
  userId!: MarketplaceUser | string;

  @ManyToOne({
    entity: () => Listing,
    fieldName: 'fk_listing_id',
    updateRule: 'cascade',
    deleteRule: 'cascade',
    index: 'fk_listing_id',
  })
  listing!: Listing | number;

  @Property()
  createdAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date;
}
