import { QueryWhere } from '@common/interfaces/repository.interface';
import { Listing } from '../entities/listing.entity';

export interface FilterOptions {
  cityName?: string;
  categoryName?: string;
  brand?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  shopUsername?: string;
  onPayment?: boolean;
  effectivePrice?: number;
  priceTolerancePercent?: number;
  includeGeneralClauses?: boolean;
}

export class ListingFilterBuilder {
  private whereCondition: QueryWhere<Listing> = {};

  constructor() {
    this.reset();
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): ListingFilterBuilder {
    this.whereCondition = {};
    return this;
  }

  /**
   * Add general listing clauses (archived, activation, deletion, quantity checks)
   */
  withGeneralClauses(): ListingFilterBuilder {
    this.whereCondition = {
      ...this.whereCondition,
      archivedOn: null,
      activationDate: { $ne: null },
      isDeleted: false,
      listedQty: { $gt: 0 },
    };
    return this;
  }

  /**
   * Add item-related filters
   */
  withItemFilters(): ListingFilterBuilder {
    this.whereCondition = {
      ...this.whereCondition,
      item: { quantity: { $gt: 0 }, isDeleted: false },
    };
    return this;
  }

  /**
   * Add city filter
   */
  withCity(cityName?: string): ListingFilterBuilder {
    if (cityName) {
      this.whereCondition.city = { cityName };
    }
    return this;
  }

  /**
   * Add category filter
   */
  withCategory(categoryName?: string): ListingFilterBuilder {
    if (categoryName) {
      this.whereCondition.categoryName = categoryName;
    }
    return this;
  }

  /**
   * Add brand filter
   */
  withBrand(brandName?: string): ListingFilterBuilder {
    if (brandName) {
      this.whereCondition.brandName = brandName;
    }
    return this;
  }

  /**
   * Add condition filter
   */
  withCondition(conditionName?: string): ListingFilterBuilder {
    if (conditionName) {
      this.whereCondition.conditionName = conditionName;
    }
    return this;
  }

  /**
   * Add price range filter
   */
  withPriceRange(minPrice?: number, maxPrice?: number): ListingFilterBuilder {
    if (minPrice !== undefined || maxPrice !== undefined) {
      this.whereCondition.effectivePrice = {
        ...(minPrice !== undefined && { $gte: minPrice }),
        ...(maxPrice !== undefined && { $lte: maxPrice }),
      };
    }
    return this;
  }

  /**
   * Add price tolerance filter (for related products)
   */
  withPriceTolerance(basePrice: number, tolerancePercent: number): ListingFilterBuilder {
    const minPrice = basePrice - (basePrice * tolerancePercent) / 100;
    const maxPrice = basePrice + (basePrice * tolerancePercent) / 100;

    this.whereCondition.effectivePrice = {
      $gte: minPrice,
      $lte: maxPrice,
      $ne: basePrice,
    };
    return this;
  }

  /**
   * Add shop filter
   */
  withShop(shopUsername?: string, onPayment?: boolean): ListingFilterBuilder {
    if (shopUsername) {
      this.whereCondition.shop = { username: { $like: `%${shopUsername}%` } };
    } else if (onPayment !== undefined) {
      this.whereCondition.shop = { onPayment };
    }
    return this;
  }

  /**
   * Add shop filter for random listings (different logic)
   */
  withShopForRandom(shopUsername?: string): ListingFilterBuilder {
    this.whereCondition.shop = shopUsername ? { username: shopUsername } : { onPayment: true };
    return this;
  }

  /**
   * Add category ID filter
   */
  withCategoryId(categoryId: number): ListingFilterBuilder {
    this.whereCondition.category = categoryId;
    return this;
  }

  /**
   * Add effective price greater than filter
   */
  withEffectivePriceGreaterThan(price: number): ListingFilterBuilder {
    this.whereCondition.effectivePrice = {
      ...this.whereCondition.effectivePrice,
      $gt: price,
    };
    return this;
  }

  /**
   * Add listing specification filter
   */
  withListingSpecification(listing: Listing, categoryId: number): ListingFilterBuilder {
    if (listing?.listingSpecification?.brand) {
      this.whereCondition.listingSpecification = {
        brand: listing.listingSpecification.brand,
        ...(Number(categoryId) === 6 &&
          listing.listingSpecification.accessoryType && {
            accessoryType: listing.listingSpecification.accessoryType,
          }),
      };
    }
    return this;
  }

  /**
   * Add custom where condition
   */
  withCustomCondition(condition: Partial<QueryWhere<Listing>>): ListingFilterBuilder {
    this.whereCondition = {
      ...this.whereCondition,
      ...condition,
    };
    return this;
  }

  /**
   * Remove a specific filter
   */
  without(field: keyof QueryWhere<Listing>): ListingFilterBuilder {
    delete this.whereCondition[field];
    return this;
  }

  /**
   * Build and return the final where condition
   */
  build(): QueryWhere<Listing> {
    return { ...this.whereCondition };
  }

  /**
   * Static factory method for common filter patterns
   */
  static forRandomListings(options: FilterOptions): QueryWhere<Listing> {
    return new ListingFilterBuilder()
      .withShopForRandom(options.shopUsername)
      .withCity(options.cityName)
      .withCategory(options.categoryName)
      .withBrand(options.brand)
      .withCondition(options.condition)
      .withPriceRange(options.minPrice, options.maxPrice)
      .build();
  }

  /**
   * Static factory method for most viewed listings
   */
  static forMostViewedListings(options: FilterOptions): QueryWhere<Listing> {
    return new ListingFilterBuilder()
      .withGeneralClauses()
      .withItemFilters()
      .withShop(options.shopUsername, true)
      .withCity(options.cityName)
      .withCategory(options.categoryName)
      .withBrand(options.brand)
      .withCondition(options.condition)
      .withPriceRange(options.minPrice, options.maxPrice)
      .build();
  }

  /**
   * Static factory method for top discounted listings
   */
  static forTopDiscountedListings(options: FilterOptions): QueryWhere<Listing> {
    const builder = new ListingFilterBuilder().withGeneralClauses().withEffectivePriceGreaterThan(0).withItemFilters();

    if (options.cityName) {
      builder.withCity(options.cityName);
    }

    if (options.categoryName) {
      builder.withCategory(options.categoryName);
    }

    return builder.build();
  }

  /**
   * Static factory method for related products
   */
  static forRelatedProducts(
    listing: Listing,
    categoryId: number,
    effectivePrice: number,
    priceTolerancePercent: number,
  ): QueryWhere<Listing> {
    return new ListingFilterBuilder()
      .withCategoryId(categoryId)
      .withPriceTolerance(effectivePrice, priceTolerancePercent)
      .withListingSpecification(listing, categoryId)
      .build();
  }

  /**
   * Create a new instance for chaining
   */
  static create(): ListingFilterBuilder {
    return new ListingFilterBuilder();
  }
}
