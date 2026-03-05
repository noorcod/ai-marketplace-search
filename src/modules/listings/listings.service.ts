import { Injectable, Logger } from '@nestjs/common';
import { ListingsRepository } from './repositories/listings.repository';
import { Listing } from './entities/listing.entity';
import { AppResponse } from '@common/responses/app-response';
import { PaginatedResponse } from '@common/responses/paginated-response';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { QueryOptionsBuilder } from './builders/query-options.builder';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { RandomListingsQueryDto } from './dtos/random-listings.dto';
import { RandomListingsService } from './random-listings.service';
import { SectionListingsDto } from './dtos/section-listings.dto';
import { ListingFilterBuilder } from './builders/listing-filter.builder';
import { ListingStatus } from '@common/enums/listing-status.enum';
import { MostViewedListingsDto } from './dtos/most-viewed-listings.dto';
import { TopDiscountedListingsQueryDto } from './dtos/top-discounted-listings.dto';
import { FetchListingsByIdsDto } from './dtos/fetch-listings-by-ids.dto';
import { ListingResponseTransformer } from '@common/transformers/listing-response.transformer';
import { Loaded } from '@mikro-orm/mysql';
import { ListingsQueryDto } from '@modules/listings/dtos/listings-query.dto';
import { ListingsQueryOptionsBuilder } from './builders/listings-query.builder';
import { Model } from '@modules/models/entities/Model.entity';

@Injectable()
export class ListingsService {
  private generalClauseForListings = {
    archivedOn: null,
    activationDate: { $ne: null },
    isDeleted: false,
    listedQty: { $gt: 0 },
  };
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly repo: ListingsRepository,
    private readonly randomListingsService: RandomListingsService,
  ) {}

  async fetchAllListings(pagination: PaginationOptions, filters: ListingsQueryDto) {
    const { where, options } = new ListingsQueryOptionsBuilder(filters, pagination).build();
    const listings = await this.repo.fetch(where, options);
    if (!listings.success) {
      return AppResponse.Err(listings.message) as AppResponse<Partial<Listing>[]>;
    }
    return PaginatedResponse.fromDataLayer(listings);
  }

  async fetchListingDetailById(listingId: number) {
    const whereCondition = {
      listingId: listingId,
    };
    const options = QueryOptionsBuilder.forPDP();
    const itemDetail = await this.repo.fetchOne(whereCondition, options);
    const data = itemDetail.data as Listing;
    if (!itemDetail.success) {
      return AppResponse.Err(itemDetail.message) as AppResponse<Partial<Listing>[]>;
    }
    itemDetail.data = new ListingResponseTransformer((data as Loaded<Listing>).categoryName).transformListingResponse(
      itemDetail.data as Loaded<Partial<Listing>>,
    );
    return AppResponse.fromDataLayer(itemDetail) as AppResponse<Partial<Listing>>;
  }

  async fetchRandomListings(query: RandomListingsQueryDto) {
    return this.randomListingsService.fetchRandomListings(query);
  }

  async fetchMostViewedListings(query: MostViewedListingsDto) {
    const whereCondition = ListingFilterBuilder.forMostViewedListings({
      shopUsername: query.shopUsername,
      cityName: query.cityName,
      categoryName: query.categoryName,
      brand: query.brand,
      condition: query.condition,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    });
    const queryOptions = QueryOptionsBuilder.forMostViewed(query.count);
    const result = await this.repo.fetch(whereCondition, queryOptions);
    if (!result.success) {
      return AppResponse.Err(result.message) as AppResponse<Partial<Listing>[]>;
    }
    return AppResponse.fromDataLayer(result) as AppResponse<Partial<Listing>>;
  }

  async fetchTopDiscountedListings(query: TopDiscountedListingsQueryDto) {
    const { count, criteria, category, city } = query;

    const baseWhere = ListingFilterBuilder.forTopDiscountedListings({
      cityName: city,
      categoryName: criteria === 'category' ? category : undefined,
    });

    const queryOptions = QueryOptionsBuilder.forTopDiscounted();

    // Shared fetch logic with fallback support
    const fetchWithFallback = async (where: QueryWhere<Listing>, limit: number) => {
      const result = await this.repo.fetch(where, { ...queryOptions, limit });
      if (!result.success) return result;

      let finalResults = [...(result.data as Listing[])];

      if (finalResults.length < limit) {
        const remaining = limit - finalResults.length;

        const fallbackWhere = { ...where };
        delete fallbackWhere.city;

        const fallbackResults = await this.repo.fetch(fallbackWhere, { ...queryOptions, limit: remaining });

        const existingIds = new Set(finalResults.map(l => l.listingId));
        const uniqueFallback = (fallbackResults.data as Listing[]).filter(r => !existingIds.has(r.listingId));

        finalResults.push(...uniqueFallback);
      }
      result.data = finalResults as Listing[];
      return result;
    };
    const result = await fetchWithFallback(baseWhere, count);
    if (!result.success) {
      return AppResponse.Err(result.message) as AppResponse<Partial<Listing>[]>;
    }

    return AppResponse.fromDataLayer(result) as AppResponse<Partial<Listing>>;
  }

  async fetchListingsForSections(sectionListings: SectionListingsDto[]) {
    try {
      // Input validation
      if (!sectionListings || sectionListings.length === 0) {
        return AppResponse.Err('Section listings array cannot be empty');
      }

      // Optimized ID collection using Set.add() instead of spread operator
      const uniqueListingIds = new Set<number>();
      for (const section of sectionListings) {
        if (!section.sectionItems || section.sectionItems.length === 0) {
          this.logger.warn(`Section '${section.sectionName}' has no items`);
          continue;
        }
        for (const id of section.sectionItems) {
          uniqueListingIds.add(id);
        }
      }

      if (uniqueListingIds.size === 0) {
        return AppResponse.Err('No valid listing IDs found in sections');
      }

      // Fetch all listings at once
      const listingIdsArray = Array.from(uniqueListingIds);
      const whereCondition: QueryWhere<Listing> = {
        listingId: { $in: listingIdsArray },
      };
      const queryOptions = QueryOptionsBuilder.forListings();

      this.logger.debug(`Fetching ${listingIdsArray.length} unique listings for ${sectionListings.length} sections`);

      const listings = await this.repo.fetch(whereCondition, queryOptions);
      if (!listings.success) {
        this.logger.error(`Database error fetching listings: ${listings.message}`);
        return AppResponse.Err(`Failed to fetch listings: ${listings.message}`);
      }

      const listingsData = listings.data as Listing[];

      // Create a Map for O(1) lookup instead of O(n) find operations
      const listingsMap = new Map<number, Listing>();
      for (const listing of listingsData) {
        listingsMap.set(listing.listingId, listing);
      }

      // Build response with optimized lookup
      const response = [];
      const missingListings: number[] = [];

      for (const section of sectionListings) {
        const sectionItems = [];

        for (const id of section.sectionItems) {
          const listing = listingsMap.get(id);
          if (listing) {
            sectionItems.push(listing);
          } else {
            missingListings.push(id);
            sectionItems.push(null); // Maintain order but mark as missing
          }
        }

        response.push({
          sectionName: section.sectionName,
          sectionItems: sectionItems,
        });
      }

      // Log missing listings for monitoring
      if (missingListings.length > 0) {
        this.logger.warn(`Missing listings: ${missingListings.join(', ')}`);
      }

      this.logger.debug(`Successfully processed ${response.length} sections with ${listingsData.length} listings`);
      return AppResponse.Ok(response);
    } catch (error) {
      this.logger.error(`Error in fetchListingsForSections: ${error.message}`, error.stack);
      return AppResponse.Err(`Failed to fetch listings for sections: ${error.message}`);
    }
  }

  async fetchListingsByIds(query: FetchListingsByIdsDto) {
    try {
      // Input validation
      if (!query.ids || query.ids.length === 0) {
        return AppResponse.Err('Listing IDs array cannot be empty');
      }

      // Remove duplicates and validate IDs
      const uniqueIds = [...new Set(query.ids)];
      const validIds = uniqueIds.filter(id => id > 0);

      if (validIds.length === 0) {
        return AppResponse.Err('No valid listing IDs provided');
      }

      this.logger.debug(`Fetching ${validIds.length} listings by IDs`);

      // Fetch listings with optional listingPrice relation
      const whereCondition: QueryWhere<Listing> = {
        listingId: { $in: validIds },
      };
      let queryOptions: QueryOptions<Listing>;
      if (query.includeListingPrice) {
        const baseOptions = QueryOptionsBuilder.forListings();
        const basePopulate = Array.isArray(baseOptions.populate) ? baseOptions.populate : [];
        queryOptions = QueryOptionsBuilder.create()
          .withType('listing')
          .withPopulate([...basePopulate, 'listingPrice'])
          .build();
      } else {
        queryOptions = QueryOptionsBuilder.forListings();
      }

      const listings = await this.repo.fetch(whereCondition, queryOptions);
      if (!listings.success) {
        this.logger.error(`Database error fetching listings by IDs: ${listings.message}`);
        return AppResponse.Err(`Failed to fetch listings: ${listings.message}`);
      }

      const listingsData = listings.data as Listing[];

      // Create a map for preserving order and tracking missing listings
      const listingsMap = new Map<number, Listing>();
      for (const listing of listingsData) {
        listingsMap.set(listing.listingId, listing);
      }

      // Build ordered response and track missing IDs
      const orderedListings = [];
      const missingIds: number[] = [];

      for (const id of validIds) {
        const listing = listingsMap.get(id);
        if (listing) {
          orderedListings.push(listing);
        } else {
          missingIds.push(id);
        }
      }

      // Log missing listings for monitoring
      if (missingIds.length > 0) {
        this.logger.warn(`Missing listings with IDs: ${missingIds.join(', ')}`);
      }

      this.logger.debug(`Successfully fetched ${orderedListings.length} out of ${validIds.length} requested listings`);

      return AppResponse.Ok({
        listings: orderedListings,
        requestedCount: validIds.length,
        foundCount: orderedListings.length,
        missingIds: missingIds,
      });
    } catch (error) {
      this.logger.error(`Error in fetchListingsByIds: ${error.message}`, error.stack);
      return AppResponse.Err(`Failed to fetch listings by IDs: ${error.message}`);
    }
  }

  async fetchRelatedProducts(listingId: number, paginationOptions: PaginationOptions) {
    const where: QueryWhere<Listing> = {
      listingId: listingId,
    };
    const listingDetail = await this.repo.fetchOne(where);

    if (!listingDetail?.success) {
      return listingDetail?.data
        ? this.fetchRandomListings({ count: 10, categoryName: null, cityName: null })
        : (AppResponse.Err(listingDetail.message) as AppResponse<Partial<Listing>[]>);
    }

    const listing = listingDetail.data as Listing;
    const status = listing?.status;
    const categoryId = listing?.category?.id;
    const effectivePrice = Number(listing?.effectivePrice || 0);

    // Add null safety checks
    if (!listing || !categoryId) {
      return this.fetchRandomListings({ count: 10, categoryName: null, cityName: null });
    }

    if (status !== ListingStatus.VALIDATED_ACTIVE) {
      // The product in question is no longer available, need to try something else
      return this.fetchRandomListings({ count: 10, categoryName: null, cityName: null });
    }

    const queryOptions = QueryOptionsBuilder.forRelated();
    // First query with ±20%
    let whereCondition = ListingFilterBuilder.forRelatedProducts(listing, Number(categoryId), effectivePrice, 20);

    let result = await this.repo.fetch(whereCondition, queryOptions);

    // Retry with ±30% if too few results
    if (result?.data.length < 4 && paginationOptions.currentPage === 1) {
      whereCondition = ListingFilterBuilder.forRelatedProducts(listing, Number(categoryId), effectivePrice, 30);
      result = await this.repo.fetch(whereCondition, queryOptions);
    }

    return PaginatedResponse.fromDataLayer(result);
  }

  /**
   * Fetch listings availability for a given specifications model.
   * Returns a minimal availability DTO with matchedOn, searchTerm, total, and up to 5 samples.
   */
  async fetchListingsAvailabilityForSpecsModel(data: Partial<Model>, criteria?: string) {
    try {
      const { modelId, modelTitle, modelName, brandId, brandName, categoryId, categoryName } = (data || {}) as any;

      const buildDto = (
        matchedOn: 'modelTitle' | 'modelName' | 'brandName' | 'none',
        searchTerm: string | null,
        list: Listing[],
      ) => {
        const samples = list.slice(0, 5).map(l => ({
          listingId: l.listingId,
          listingTitle: l.listingTitle,
          effectivePrice: l.effectivePrice ? Number(l.effectivePrice) : undefined,
          cityName: (l as any)?.city?.cityName,
          conditionName: l.conditionName,
          shopName: (l as any)?.shop?.shopName,
          shopUsername: (l as any)?.shop?.username,
        }));

        return AppResponse.Ok({
          model: {
            id: Number(modelId) || undefined,
            title: modelTitle || modelName || undefined,
            name: modelName || undefined,
            brandId: Number(brandId) || undefined,
            brandName: brandName || undefined,
            categoryId: Number(categoryId) || undefined,
            categoryName: categoryName || undefined,
          },
          result: {
            matchedOn,
            searchTerm,
            total: Array.isArray(list) ? list.length : 0,
          },
          samples,
        });
      };

      // 1) Try listingTitle OR modelTitle with modelTitle
      let whereCondition: QueryWhere<Listing> = {
        ...this.generalClauseForListings,
        $or: [{ listingTitle: { $like: `%${modelTitle}%` } }, { modelTitle: { $like: `%${modelTitle}%` } }],
      };
      const listings = await this.repo.fetch(whereCondition, { populateJoins: false });
      if (listings.success && (listings.data as Listing[]).length > 0) {
        return buildDto('modelTitle', modelTitle ?? null, listings.data as Listing[]);
      }

      // 2) Try modelName against listingTitle (fix: was 'title')
      whereCondition = {
        ...this.generalClauseForListings,
        listingTitle: { $like: `%${modelName}%` },
      };
      const listingsByModelName = await this.repo.fetch(whereCondition, { populateJoins: false });
      if (listingsByModelName.success && (listingsByModelName.data as Listing[]).length > 0) {
        return buildDto('modelName', modelName ?? null, listingsByModelName.data as Listing[]);
      }

      // 3) Try brandName
      whereCondition = {
        ...this.generalClauseForListings,
        brandName: { $like: `%${brandName}%` },
      };
      const listingsByBrandName = await this.repo.fetch(whereCondition, { populateJoins: false });
      if (listingsByBrandName.success && (listingsByBrandName.data as Listing[]).length > 0) {
        return buildDto('brandName', brandName ?? null, listingsByBrandName.data as Listing[]);
      }

      // None matched
      return AppResponse.Ok({
        model: {
          id: Number(modelId) || undefined,
          title: modelTitle || modelName || undefined,
          name: modelName || undefined,
          brandId: Number(brandId) || undefined,
          brandName: brandName || undefined,
          categoryId: Number(categoryId) || undefined,
          categoryName: categoryName || undefined,
        },
        result: { matchedOn: 'none', searchTerm: null, total: 0 },
        samples: [],
      });
    } catch (error) {
      return AppResponse.Err(error.message);
    }
  }

  async fetchSearchSuggestions(searchTerm: string, limit: number) {
    try {
      const term = (searchTerm ?? '').trim();
      if (!term || term.length === 0) {
        return AppResponse.Err('Search term cannot be empty');
      }

      if (term.length < 3) {
        return AppResponse.Err('Search term must be at least 3 characters long');
      }

      const whereCondition: QueryWhere<Listing> = {
        ...this.generalClauseForListings,
        listingTitle: { $like: `%${term}%` },
      };

      // Over-fetch to ensure we can return desired number of unique suggestions
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 10);
      const fetchLimit = Math.min(safeLimit * 3, 50);

      const queryOptions: QueryOptions<Listing> = {
        limit: fetchLimit,
        fields: ['listingId', 'listingTitle', 'primaryImage'],
        orderBy: {
          // listingTitle: 'ASC',
          shop: { onPayment: 'DESC' },
          updatedAt: 'DESC',
        },
      };

      const listings = await this.repo.fetchSimple(whereCondition, queryOptions);
      if (!listings.success) {
        return AppResponse.Err(`Failed to fetch search suggestions: ${listings.message}`);
      }

      // Build minimal objects and de-duplicate by title
      const uniqueByTitle = new Map<string, { id: number; title: string; primaryImage: string }>();
      for (const listing of listings.data as Listing[]) {
        const title = listing.listingTitle;
        if (title && !uniqueByTitle.has(title)) {
          uniqueByTitle.set(title, {
            id: Number(listing.listingId),
            title: title,
            primaryImage: listing.primaryImage,
          });
        }
      }

      const suggestions = Array.from(uniqueByTitle.values()).slice(0, safeLimit);

      return AppResponse.Ok({ suggestions });
    } catch (error) {
      return AppResponse.Err(`Error fetching search suggestions: ${error.message}`);
    }
  }

  /**
   * Fetch Listing (Simple Response) by id
   */
  async fetchListingById(listingId: number) {
    const whereCondition: QueryWhere<Listing> = {
      listingId: listingId,
    };
    // TODO: Adjust fields
    const queryOptions: QueryOptions<Listing> = {
      populateJoins: false,
    };
    const listingResult = await this.repo.fetchOne(whereCondition, queryOptions);
    if (!listingResult.success) {
      return AppResponse.Err(listingResult.message) as AppResponse<Partial<Listing>>;
    }
    return AppResponse.fromDataLayer(listingResult) as AppResponse<Partial<Listing>>;
  }
}
