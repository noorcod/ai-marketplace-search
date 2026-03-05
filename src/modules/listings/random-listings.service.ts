import { Injectable, Logger } from '@nestjs/common';
import { AppResponse } from '@common/responses/app-response';
import { Listing } from './entities/listing.entity';
import { ListingsRepository } from './repositories/listings.repository';
import { ListingFilterBuilder } from './builders/listing-filter.builder';
import { RandomListingsQueryDto } from './dtos/random-listings.dto';

@Injectable()
export class RandomListingsService {
  private readonly logger = new Logger(RandomListingsService.name);

  private static readonly CONFIG = {
    MAX_ITERATIONS: 3,
    FILTER_PRIORITY: ['shop', 'city', 'categoryName', 'brandName', 'conditionName', 'effectivePrice'],
  } as const;

  constructor(private readonly repo: ListingsRepository) {}

  async fetchRandomListings(query: RandomListingsQueryDto): Promise<AppResponse<Listing[]>> {
    const strategy = this.determineStrategy(query);
    this.logger.log(`Using ${strategy} strategy for random listings with count: ${query.count}`);

    try {
      const result =
        strategy === 'optimized' ? await this.fetchOptimizedRandom(query) : await this.fetchFallbackRandom(query);

      this.logger.log(`Successfully fetched ${result.data?.length || 0} random listings`);
      return result;
    } catch (error) {
      this.logger.error('Error fetching random listings:', error);
      return AppResponse.Err('Failed to fetch random listings') as AppResponse<Listing[]>;
    }
  }

  private determineStrategy(query: RandomListingsQueryDto): 'optimized' | 'fallback' {
    // Use optimized strategy if filters are minimal (better performance)
    const filterCount = [
      query.cityName,
      query.categoryName,
      query.brand,
      query.condition,
      query.minPrice,
      query.maxPrice,
    ].filter(Boolean).length;

    // Use optimized approach for simple queries, fallback for complex ones
    return filterCount <= 2 ? 'optimized' : 'fallback';
  }

  private async fetchOptimizedRandom(query: RandomListingsQueryDto): Promise<AppResponse<Listing[]>> {
    const filters = ListingFilterBuilder.forRandomListings({
      shopUsername: query.shopUsername,
      cityName: query.cityName,
      categoryName: query.categoryName,
      brand: query.brand,
      condition: query.condition,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });

    try {
      const result = await this.repo.fetchRandomListingsOptimized(filters, query.count);

      if (!result.success) {
        this.logger.warn(`Optimized random fetch failed: ${result.message}`);
        return AppResponse.Err(result.message || 'Failed to fetch random listings') as AppResponse<Listing[]>;
      }

      const listings = Array.isArray(result.data) ? (result.data as Listing[]) : [result.data as Listing];
      this.logger.debug(`Optimized fetch returned ${listings.length} listings`);
      return AppResponse.Ok<Listing[]>(listings);
    } catch (error) {
      this.logger.error('Error in optimized random fetch:', error);
      throw error;
    }
  }

  private async fetchFallbackRandom(query: RandomListingsQueryDto): Promise<AppResponse<Listing[]>> {
    let currentFilters = ListingFilterBuilder.forRandomListings({
      shopUsername: query.shopUsername,
      cityName: query.cityName,
      categoryName: query.categoryName,
      brand: query.brand,
      condition: query.condition,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });

    const collectedResults = new Set<number>();
    const finalResults: Listing[] = [];
    this.logger.debug('Starting fallback random listings fetch');

    for (let iteration = 0; iteration < RandomListingsService.CONFIG.MAX_ITERATIONS; iteration++) {
      const needed = query.count - finalResults.length;
      if (needed <= 0) break;

      // Request more items to account for potential duplicates
      const requestSize = Math.max(needed * 2, 10);
      this.logger.debug(`Iteration ${iteration + 1}: requesting ${requestSize} items, need ${needed} more`);

      try {
        const result = await this.repo.fetchRandomListingsOptimized(currentFilters, requestSize);

        if (result.success && result.data) {
          const listings = Array.isArray(result.data) ? (result.data as Listing[]) : [result.data as Listing];
          const newItems = listings.filter(item => !collectedResults.has(item.listingId));

          // Add new unique items up to the needed count
          const itemsToAdd = newItems.slice(0, needed);
          itemsToAdd.forEach(item => {
            collectedResults.add(item.listingId);
            finalResults.push(item);
          });

          this.logger.debug(`Added ${itemsToAdd.length} new unique items, total: ${finalResults.length}`);
        } else {
          this.logger.warn(`Iteration ${iteration + 1} failed: ${result.message}`);
        }
      } catch (error) {
        this.logger.error(`Error in fallback iteration ${iteration + 1}:`, error);
      }

      // If we have enough results, break early
      if (finalResults.length >= query.count) break;

      // Remove least important filter for next iteration to broaden search
      if (iteration < RandomListingsService.CONFIG.FILTER_PRIORITY.length) {
        const filterToRemove = RandomListingsService.CONFIG.FILTER_PRIORITY[iteration];
        delete (currentFilters as any)[filterToRemove];
        this.logger.debug(`Removed filter: ${filterToRemove}`);
      }
    }

    this.logger.log(`Fallback fetch completed with ${finalResults.length} results`);
    return AppResponse.Ok<Listing[]>(finalResults);
  }
}
