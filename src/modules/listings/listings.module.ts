import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Listing } from './entities/listing.entity';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './repositories/listings.repository';
import { RandomListingsService } from './random-listings.service';
import { FeaturedListingsService } from './featured-listings.service';
import { FeaturedListing } from './entities/featured-listing.entity';
import { ListingReviewsController } from './listing-reviews.controller';
import { ListingReviewsService } from './listing-reviews.service';
import { ListingReview } from './entities/listing-review.entity';
import { ListingsFilterService } from './listings-filter.service';
import { ListingSpecification } from './entities/listing-specification.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Listing, FeaturedListing, ListingReview, ListingSpecification])],
  controllers: [ListingsController, ListingReviewsController],
  providers: [
    ListingsService,
    ListingsRepository,
    RandomListingsService,
    FeaturedListingsService,
    ListingReviewsService,
    ListingsFilterService,
  ],
  exports: [ListingsService, ListingsRepository],
})
export class ListingsModule {}
