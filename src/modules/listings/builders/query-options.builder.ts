import { QueryOptions } from '@common/interfaces/repository.interface';
import { Listing } from '../entities/listing.entity';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import {
  FEATURED_LISTINGS_COLUMNS,
  LISTINGS_COLUMNS,
  PDP_LISTING_COLUMNS,
  RELATED_LISTINGS_COLUMNS,
} from '@common/constants/column-selections.constants';
import {
  FEATURED_LISTING_POPULATE,
  LISTING_POPULATE,
  PDP_POPULATE,
  RELATED_LISTINGS_POPULATE,
} from '@common/constants/populate-tables.constants';
import { FeaturedListing } from '../entities/featured-listing.entity';

export type QueryOptionsType = 'listing' | 'pdp' | 'related' | 'featured';
export type OrderDirection = 'ASC' | 'DESC';

export interface OrderByOption {
  field: string;
  direction: OrderDirection;
}

export class QueryOptionsBuilder {
  private options: QueryOptions<Listing> = {};

  constructor() {
    this.reset();
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): QueryOptionsBuilder {
    this.options = {};
    return this;
  }

  /**
   * Set populate and fields based on predefined types
   */
  withType(type: QueryOptionsType): QueryOptionsBuilder {
    const configs = {
      listing: { populate: LISTING_POPULATE, fields: LISTINGS_COLUMNS },
      pdp: { populate: PDP_POPULATE, fields: PDP_LISTING_COLUMNS },
      related: { populate: RELATED_LISTINGS_POPULATE, fields: RELATED_LISTINGS_COLUMNS },
      featured: { populate: FEATURED_LISTING_POPULATE, fields: FEATURED_LISTINGS_COLUMNS },
    };

    const config = configs[type];
    this.options.populate = nestedObjectToDotFields(config.populate);
    this.options.fields = nestedObjectToDotFields(config.fields);

    return this;
  }

  /**
   * Set custom populate fields
   */
  withPopulate(populate: string[]): QueryOptionsBuilder {
    this.options.populate = populate;
    return this;
  }

  /**
   * Set custom fields selection
   */
  withFields(fields: string[]): QueryOptionsBuilder {
    this.options.fields = fields;
    return this;
  }

  /**
   * Set limit for results
   */
  withLimit(limit: number): QueryOptionsBuilder {
    this.options.limit = limit;
    return this;
  }

  /**
   * Set offset for pagination
   */
  withOffset(offset: number): QueryOptionsBuilder {
    this.options.offset = offset;
    return this;
  }

  /**
   * Add single order by clause
   */
  withOrderBy(field: keyof Listing, direction: OrderDirection = 'ASC'): QueryOptionsBuilder {
    if (!this.options.orderBy) {
      this.options.orderBy = [];
    }

    (this.options.orderBy as any[]).push({ [field as string]: direction });
    return this;
  }

  /**
   * Add multiple order by clauses
   */
  withOrderByMultiple(orders: OrderByOption[]): QueryOptionsBuilder {
    this.options.orderBy = orders.map(order => ({ [order.field as string]: order.direction }));
    return this;
  }

  /**
   * Add order by for a populated relation using nested object syntax.
   * Example: withRelationOrderBy('shop', { onPayment: 'DESC' })
   */
  withRelationOrderBy(relation: string, relationOrders: Record<string, OrderDirection>): QueryOptionsBuilder {
    const nested: Record<string, any> = { [relation]: {} };
    for (const [field, dir] of Object.entries(relationOrders)) {
      (nested[relation] as any)[field] = dir;
    }

    // Normalize existing orderBy into an array, then append nested order
    const current = this.options.orderBy;
    if (!current) {
      this.options.orderBy = [nested];
    } else if (Array.isArray(current)) {
      (current as any[]).push(nested);
      this.options.orderBy = current;
    } else {
      // If it's an object, convert to array for consistency and append
      this.options.orderBy = [current as any, nested];
    }
    return this;
  }

  /**
   * Add order by visits descending (for most viewed)
   */
  withMostViewedOrder(): QueryOptionsBuilder {
    return this.withOrderByMultiple([
      { field: 'visits', direction: 'DESC' },
      { field: 'activationDate', direction: 'DESC' },
    ]);
  }

  /**
   * Add order by discount descending (for top discounted)
   */
  withTopDiscountedOrder(): QueryOptionsBuilder {
    return this.withOrderByMultiple([
      { field: 'effectiveDiscount', direction: 'DESC' },
      { field: 'activationDate', direction: 'DESC' },
    ]);
  }

  withFeaturedListingOrder(): QueryOptionsBuilder {
    // MikroORM expects nested object syntax for orderBy on populated relations
    this.options.orderBy = {
      listing: { isFeatured: 'DESC', activationDate: 'ASC' },
    };
    return this;
  }

  /**
   * Build and return the final query options
   */
  build(): QueryOptions<Listing> {
    return { ...this.options };
  }

  /**
   * Static factory methods for common patterns
   */
  static forListings(limit?: number): QueryOptions<Listing> {
    const builder = new QueryOptionsBuilder().withType('listing');

    if (limit) {
      builder.withLimit(limit);
    }

    return builder.build();
  }

  static forMostViewed(limit?: number): QueryOptions<Listing> {
    const builder = new QueryOptionsBuilder().withType('listing').withMostViewedOrder();

    if (limit) {
      builder.withLimit(limit);
    }

    return builder.build();
  }

  static forTopDiscounted(limit?: number): QueryOptions<Listing> {
    const builder = new QueryOptionsBuilder().withType('listing').withTopDiscountedOrder();

    if (limit) {
      builder.withLimit(limit);
    }

    return builder.build();
  }

  static forPDP(): QueryOptions<Listing> {
    return new QueryOptionsBuilder().withType('pdp').build();
  }

  static forRelated(): QueryOptions<Listing> {
    return new QueryOptionsBuilder().withType('related').build();
  }

  static forFeaturedListing(limit?: number): QueryOptions<FeaturedListing> {
    const builder = new QueryOptionsBuilder().withType('featured').withFeaturedListingOrder();

    if (limit) {
      builder.withLimit(limit);
    }

    return builder.build() as unknown as QueryOptions<FeaturedListing>;
  }

  /**
   * Create a new instance for chaining
   */
  static create(): QueryOptionsBuilder {
    return new QueryOptionsBuilder();
  }
}
