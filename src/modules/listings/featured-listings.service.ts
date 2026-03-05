import { Injectable } from '@nestjs/common';
import { FeaturedListingsDto } from './dtos/featured-listings.dto';
import { AppResponse } from '@common/responses/app-response';
import { QueryOptionsBuilder } from './builders/query-options.builder';
import { FeaturedListingsRepository } from './repositories/featured-listings.repository';
import { FeaturedListing } from './entities/featured-listing.entity';
import { ListingsService } from './listings.service';
import { FeaturedListingFilterBuilder } from './builders/featured-listing-filter.builder';

@Injectable()
export class FeaturedListingsService {
  constructor(
    private readonly repo: FeaturedListingsRepository,
    private readonly listingService: ListingsService,
  ) {}

  async fetchFeaturedListings(query: FeaturedListingsDto) {
    // 1. Build initial filters for featured listings
    let featuredFilters = FeaturedListingFilterBuilder.forFeaturedListings({
      place: query.place,
      city: query.city,
      category: query.category,
      shopUsername: query.shopUsername,
    });

    // 2. Fetch featured listings
    const featuredResults = await this.repo.fetch(featuredFilters, QueryOptionsBuilder.forFeaturedListing(query.count));
    let featuredListings = (featuredResults.data as FeaturedListing[]) || [];
    let finalResults: FeaturedListing[] = [];
    let needed: number = 0;

    // Fallback: if no featured listings for place, remove place filter and retry
    if (query.place && featuredListings.length === 0) {
      const fallbackFilters = { ...query };
      delete fallbackFilters.place;
      const fallbackFeaturedFilters = FeaturedListingFilterBuilder.forFeaturedListings(fallbackFilters);

      const fallbackResults = await this.repo.fetch(
        fallbackFeaturedFilters,
        QueryOptionsBuilder.forFeaturedListing(query.count),
      );

      let fallbackListings = (fallbackResults.data as FeaturedListing[]) || [];
      fallbackListings = fallbackListings.filter(
        (listing, idx, arr) => listing && listing.id && arr.findIndex(l => l.id === listing.id) === idx,
      );
      featuredListings = fallbackListings;
      finalResults = [...featuredListings];

      needed = query.count - finalResults.length;
    }

    // Deduplicate by featuredListingId
    featuredListings = featuredListings.filter(
      (listing, idx, arr) => listing && listing.id && arr.findIndex(l => l.id === listing.id) === idx,
    );

    if (finalResults.length === 0) {
      finalResults = [...featuredListings];
      needed = query.count - finalResults.length;
    }

    let attempts = 0;
    const maxAttempts = 3;

    // Only fetch and wrap randoms if needed
    while (needed > 0 && attempts < maxAttempts) {
      let randomFilters = { categoryName: query.category, cityName: query.city, shopUsername: query.shopUsername };
      if (attempts === 1) delete randomFilters.cityName;
      if (attempts === 2) delete randomFilters.categoryName;

      const randomResults = await this.listingService.fetchRandomListings({
        count: needed * 2,
        ...randomFilters,
      });
      let randomListings: any[] = Array.isArray(randomResults.data)
        ? randomResults.data
        : [randomResults.data].filter(Boolean);

      // Deduplicate by listingId (exclude those already present)
      const featuredListingIds = new Set(finalResults.map(l => l.listing?.listingId));

      const newRandoms = randomListings
        .filter(l => l && l.listingId && !featuredListingIds.has(l.listingId))
        .slice(0, needed)
        .map(l => ({
          id: null,
          listing: l,
          bookingId: null,
          displayLocation: null,
          featuredSince: null,
          allowedDuration: null,
          createdAt: null,
          updatedAt: null,
          isDeleted: false,
          isRandomPick: true,
        }));
      finalResults = [...finalResults, ...newRandoms] as FeaturedListing[];
      needed = query.count - finalResults.length;
      attempts++;
    }

    // Return up to requested count
    return AppResponse.Ok(finalResults.slice(0, query.count));
  }
}
