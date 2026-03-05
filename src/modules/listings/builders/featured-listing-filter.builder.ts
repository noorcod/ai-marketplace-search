import { QueryWhere } from '@common/interfaces/repository.interface';
import { Listing } from '../entities/listing.entity';

export interface FilterOptions {
  cityName?: string;
  categoryName?: string;
  shopUsername?: string;
  onPayment?: boolean;
  includeGeneralClauses?: boolean;
}

export class FeaturedListingFilterBuilder {
  private whereCondition: QueryWhere<Listing> = {};

  constructor() {
    this.reset();
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): FeaturedListingFilterBuilder {
    this.whereCondition = {};
    return this;
  }

  /**
   * Add general listing clauses (archived, activation, deletion, quantity checks)
   */
  withGeneralClauses(): FeaturedListingFilterBuilder {
    this.whereCondition = {
      ...this.whereCondition,
      listing: {
        archivedOn: null,
        activationDate: { $ne: null },
        isDeleted: false,
        listedQty: { $gt: 0 },
      },
    };
    return this;
  }

  /**
   * Add item-related filters
   */
  withItemFilters(): FeaturedListingFilterBuilder {
    this.whereCondition = {
      ...this.whereCondition,
      listing: {
        ...(this.whereCondition.listing || {}),
        item: { quantity: { $gt: 0 }, isDeleted: false },
      },
    };
    return this;
  }

  /**
   * Add city filter
   */
  withCity(cityName?: string): FeaturedListingFilterBuilder {
    if (cityName) {
      this.whereCondition.listing = {
        ...(this.whereCondition.listing || {}),
        location: { city: { cityName } },
      };
    }
    return this;
  }

  /**
   * Add category filter
   */
  withCategory(categoryName?: string): FeaturedListingFilterBuilder {
    if (categoryName) {
      this.whereCondition.listing = {
        ...(this.whereCondition.listing || {}),
        categoryName: categoryName,
      };
    }
    return this;
  }

  /**
   * Add shop filter
   */
  withShop(shopUsername?: string, onPayment?: boolean): FeaturedListingFilterBuilder {
    if (shopUsername) {
      this.whereCondition.listing = {
        ...(this.whereCondition.listing || {}),
        shop: { username: { $like: `%${shopUsername}%` } },
      };
    } else if (onPayment !== undefined) {
      this.whereCondition.listing = {
        ...(this.whereCondition.listing || {}),
        shop: { onPayment },
      };
    }
    return this;
  }

  /**
   * Add shop filter for random listings (different logic)
   */
  withShopForRandom(shopUsername?: string): FeaturedListingFilterBuilder {
    this.whereCondition.listing = {
      ...(this.whereCondition.listing || {}),
      shop: shopUsername ? { username: shopUsername } : { onPayment: true },
    };
    return this;
  }

  /**
   * Add custom where condition
   */
  withCustomCondition(condition: Partial<QueryWhere<Listing>>): FeaturedListingFilterBuilder {
    this.whereCondition = {
      ...this.whereCondition,
      ...condition,
    };
    return this;
  }

  /**
   * Remove a specific filter
   */
  without(field: keyof QueryWhere<Listing>): FeaturedListingFilterBuilder {
    delete this.whereCondition[field];
    return this;
  }

  /**
   * Build and return the final where condition
   */
  build(): QueryWhere<Listing> {
    return { ...this.whereCondition };
  }

  static forFeaturedListings(options: {
    place?: string;
    city?: string;
    category?: string;
    shopUsername?: string;
  }): QueryWhere {
    const builder = new FeaturedListingFilterBuilder()
      .withGeneralClauses()
      .withItemFilters()
      .withShop(options.shopUsername)
      .withCategory(options.category)
      .withCity(options.city)
      .withCustomCondition({ listing: { isFeatured: true } });
    if (options.place) {
      builder.withCustomCondition({ displayLocation: { place: { $like: `%${options.place}%` } } });
    }
    return builder.build();
  }

  /**
   * Create a new instance for chaining
   */
  static create(): FeaturedListingFilterBuilder {
    return new FeaturedListingFilterBuilder();
  }
}
