import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { BaseRepository } from '@common/database/base.repository';
import { Listing } from '../entities/listing.entity';
import { QueryWhere } from '@common/interfaces/repository.interface';
import { DataLayerResponse } from '@common/responses/data-layer-response';
import { FilterSource } from '../types/filter.types';

@Injectable()
export class ListingsRepository extends BaseRepository<Listing> {
  private readonly logger: Logger = new Logger(ListingsRepository.name);

  constructor(em: EntityManager) {
    super(em, Listing);
  }

  // Optimized method using offset-based random selection
  async fetchRandomListingsOptimized(where: QueryWhere<Listing>, count: number) {
    try {
      const knex = this.em.getConnection().getKnex();

      // Get total count of matching records
      const totalCountQuery = knex('listing as l')
        .join('items as i', 'i.item_id', 'l.item_id')
        .join('shop as s', 's.shop_id', 'l.shop_id')
        .count('* as total');

      if (where.city?.cityName) {
        totalCountQuery.join('city as c', 'c.city_id', 'l.city_id');
      }

      this.applyFiltersOptimized(totalCountQuery, where);

      const [{ total }] = await totalCountQuery;
      const totalCount = Number(total);

      if (totalCount === 0) {
        return DataLayerResponse.Ok([]);
      }

      // Generate random offsets for better distribution
      const requestCount = Math.min(count * 2, totalCount);
      const randomOffsets = this.generateRandomOffsets(requestCount, totalCount);

      // Fetch records using random offsets
      const queries = randomOffsets
        .slice(0, Math.min(count, randomOffsets.length))
        .map(offset => this.buildSingleRandomQuery(where, offset));

      const results = await Promise.all(queries);
      const flatResults = results.flat().filter(Boolean);

      // Map raw results to entity format and shuffle
      const mappedResults = flatResults.map(result => this.mapRawResultToEntity(result));
      const shuffled = this.shuffleArray(mappedResults);
      return DataLayerResponse.Ok(shuffled.slice(0, count));
    } catch (error) {
      console.error('Error in fetchRandomListingsOptimized:', error);
      return DataLayerResponse.QueryError();
    }
  }

  private generateRandomOffsets(count: number, total: number): number[] {
    const offsets = new Set<number>();
    const maxAttempts = count * 3; // Prevent infinite loops
    let attempts = 0;

    while (offsets.size < count && attempts < maxAttempts && offsets.size < total) {
      offsets.add(Math.floor(Math.random() * total));
      attempts++;
    }

    return Array.from(offsets);
  }

  private async buildSingleRandomQuery(where: QueryWhere<Listing>, offset: number): Promise<any[]> {
    const knex = this.em.getConnection().getKnex();

    const query = knex
      .select(this.getOptimizedSelectFields())
      .from('listing as l')
      .join('items as i', 'i.item_id', 'l.item_id')
      .join('shop as s', 's.shop_id', 'l.shop_id')
      .join('location as loc', 'loc.location_id', 'l.location_id')
      .offset(offset)
      .limit(1);

    // Conditionally join city table
    if (where.city?.cityName) {
      query.join('city as c', 'c.city_id', 'l.city_id');
      query.select(['c.city_id', 'c.city_name', 'c.is_active_for_delivery']);
    }

    this.applyFiltersOptimized(query, where);

    try {
      return await query;
    } catch (error) {
      // Log error and return empty array to prevent breaking the entire operation
      console.error('Error in buildSingleRandomQuery:', error);
      return [];
    }
  }

  private getOptimizedSelectFields(): string[] {
    return [
      'l.listing_id',
      'l.listing_title',
      'l.url',
      'l.visits',
      'l.is_featured',
      'l.effective_discount',
      'l.primary_image',
      'l.status',
      'l.activation_date',
      'l.effective_price',
      'l.condition_name',
      'l.rating',
      'l.category_name',
      'l.created_at',
      'l.updated_at',
      'l.total_reviews',
      'l.total_ratings',
      'l.category_id',
      'l.color_id',
      'l.color',
      'l.archived_on',
      'l.is_deleted',
      'l.listed_qty',
      'loc.address',
      'loc.location_nick',
      'loc.latitude',
      'loc.longitude',
      's.shop_id',
      's.shop_name',
      's.logo_path',
      's.username',
      's.on_payment',
      's.on_trial',
    ];
  }

  private applyFiltersOptimized(query: any, where: QueryWhere<Listing>): void {
    // Base filters for active listings
    query
      .whereNull('l.archived_on')
      .whereNotNull('l.activation_date')
      .where('l.is_deleted', false)
      .where('l.listed_qty', '>', 0);

    // Apply item filters - items table should always be joined
    query.where('i.quantity', '>', 0).where('i.is_deleted', false);

    // Dynamic filters with proper null checks
    if (where.shop?.username) {
      query.where('s.username', 'like', `%${where.shop.username}%`);
    } else if (where.shop?.onPayment !== undefined) {
      query.where('s.on_payment', where.shop.onPayment);
    }

    if (where.categoryName) {
      query.where('l.category_name', 'like', `%${where.categoryName}%`);
    }

    if (where.city?.cityName) {
      query.where('c.city_name', 'like', `%${where.city.cityName}%`);
    }

    if (where.brandName) {
      query.where('l.brand_name', 'like', `%${where.brandName}%`);
    }

    if (where.conditionName) {
      query.where('l.condition_name', 'like', `%${where.conditionName}%`);
    }

    if (where.effectivePrice) {
      if (where.effectivePrice.$gte !== undefined) {
        query.where('l.effective_price', '>=', where.effectivePrice.$gte);
      }
      if (where.effectivePrice.$lte !== undefined) {
        query.where('l.effective_price', '<=', where.effectivePrice.$lte);
      }
    }
  }

  private mapRawResultToEntity(rawResult: any): any {
    return {
      listingId: rawResult.listing_id,
      listingTitle: rawResult.listing_title,
      url: rawResult.url,
      visits: rawResult.visits,
      isFeatured: rawResult.is_featured,
      effectiveDiscount: rawResult.effective_discount,
      primaryImage: rawResult.primary_image,
      status: rawResult.status,
      activationDate: rawResult.activation_date,
      effectivePrice: rawResult.effective_price,
      conditionName: rawResult.condition_name,
      rating: rawResult.rating,
      categoryName: rawResult.category_name,
      createdAt: rawResult.created_at,
      updatedAt: rawResult.updated_at,
      categoryId: rawResult.category_id,
      color: rawResult.color_id,
      colorName: rawResult.color,
      archivedOn: rawResult.archived_on,
      isDeleted: rawResult.is_deleted,
      listedQty: rawResult.listed_qty,
      // Location fields - create partial object with only available fields
      location: rawResult.address
        ? {
            address: rawResult.address,
            locationNick: rawResult.location_nick,
            latitude: rawResult.latitude,
            longitude: rawResult.longitude,
          }
        : undefined,
      // Shop fields - create partial object with only available fields
      shop: rawResult.shop_id
        ? {
            shopId: rawResult.shop_id,
            shopName: rawResult.shop_name,
            logoPath: rawResult.logo_path,
            username: rawResult.username,
            onPayment: rawResult.on_payment,
            onTrial: rawResult.on_trial,
          }
        : undefined,
      // City fields - create partial object with only available fields
      city: rawResult.city_id
        ? {
            cityId: rawResult.city_id,
            cityName: rawResult.city_name,
            isActiveForDelivery: rawResult.is_active_for_delivery,
          }
        : undefined,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  applyFilters = (query: any, where: QueryWhere<Listing>) => {
    query
      .whereNull('l.archived_on')
      .whereNotNull('l.activation_date')
      .where('l.is_deleted', false)
      .where('l.listed_qty', '>', 0)
      .where('i.quantity', '>', 0)
      .where('i.is_deleted', false);

    // Dynamic filters
    if (where.shop) {
      if (where.shop.username) {
        query.whereRaw('LOWER(s.username) LIKE ?', [`%${where.shop.username.toLowerCase()}%`]);
      } else if (where.shop.onPayment !== undefined) {
        query.where('s.on_payment', where.shop.onPayment);
      }
    }

    if (where.categoryName) {
      query.whereRaw('LOWER(l.category_name) LIKE ?', [`%${where.categoryName.toLowerCase()}%`]);
    }

    if (where.city) {
      query.whereRaw('LOWER(c.city_name) LIKE ?', [`%${where.city.cityName.toLowerCase()}%`]);
    }

    if (where.brandName) {
      query.whereRaw('LOWER(l.brand_name) LIKE ?', [`%${where.brandName.toLowerCase()}%`]);
    }

    if (where.conditionName) {
      query.whereRaw('LOWER(l.condition_name) LIKE ?', [`%${where.conditionName.toLowerCase()}%`]);
    }

    if (where.effectivePrice) {
      if (where.effectivePrice.$gte !== undefined) {
        query.where('l.effective_price', '>=', where.effectivePrice.$gte);
      }
      if (where.effectivePrice.$lte !== undefined) {
        query.where('l.effective_price', '<=', where.effectivePrice.$lte);
      }
    }
  };

  /**
   * Fetch distinct values for a specific filter with counts
   */
  async fetchFilterValues(
    filterName: string,
    dbColumn: string,
    source: FilterSource,
    appliedFilters: Record<string, any> = {},
    categoryName?: string,
    limit: number = 10,
    search?: string,
    joinConfig?: {
      table: string;
      alias: string;
      onColumn: string;
      joinColumn: string;
      selectColumn: string;
    },
    offset: number = 0,
  ): Promise<DataLayerResponse> {
    try {
      const knex = this.em.getConnection().getKnex();

      // Build the base query based on source
      let query: any;

      if (source === FilterSource.LISTING) {
        // Check if we need to join another table for this filter
        if (joinConfig) {
          // For filters that require joining another table (e.g., cityName)
          query = knex('listing as l')
            .select(knex.raw(`${joinConfig.alias}.${joinConfig.selectColumn} as value`))
            .count('* as count')
            .join(
              `${joinConfig.table} as ${joinConfig.alias}`,
              `${joinConfig.alias}.${joinConfig.joinColumn}`,
              `l.${joinConfig.onColumn}`,
            )
            .whereNotNull(`${joinConfig.alias}.${joinConfig.selectColumn}`)
            .where(`${joinConfig.alias}.${joinConfig.selectColumn}`, '!=', '')
            .where(`${joinConfig.alias}.${joinConfig.selectColumn}`, '!=', 'ns');
        } else {
          // Standard listing table filter
          query = knex('listing as l')
            .select(knex.raw(`l.${dbColumn} as value`))
            .count('* as count')
            .whereNotNull(`l.${dbColumn}`)
            .where(`l.${dbColumn}`, '!=', '')
            .where(`l.${dbColumn}`, '!=', 'ns');
        }
      } else {
        query = knex('listing as l')
          .select(knex.raw(`ls.${dbColumn} as value`))
          .count('* as count')
          .join('listing_specification as ls', 'ls.listing_id', 'l.listing_id')
          .whereNotNull(`ls.${dbColumn}`)
          .where(`ls.${dbColumn}`, '!=', '')
          .where(`ls.${dbColumn}`, '!=', 'ns')
          .where(`ls.${dbColumn}`, '!=', '-1');
      }

      // Apply base filters
      query
        .whereNull('l.archived_on')
        .whereNotNull('l.activation_date')
        .where('l.is_deleted', false)
        .where('l.listed_qty', '>', 0);

      // Apply category filter if specified
      if (categoryName) {
        query.where('l.category_name', categoryName);
      }

      // Apply other filters to show interdependent filtering
      this.applyInterdependentFilters(query, appliedFilters, filterName, source);

      // Apply search if provided
      if (search) {
        let searchColumn: string;
        if (joinConfig) {
          searchColumn = `${joinConfig.alias}.${joinConfig.selectColumn}`;
        } else if (source === FilterSource.LISTING) {
          searchColumn = `l.${dbColumn}`;
        } else {
          searchColumn = `ls.${dbColumn}`;
        }
        query.whereRaw(`LOWER(${searchColumn}) LIKE ?`, [`%${search.toLowerCase()}%`]);
      }

      // Group and order
      query.groupBy('value').orderBy('count', 'desc').orderBy('value', 'asc').offset(offset).limit(limit);

      const results = await query;

      // Format results
      const formattedResults = results.map(row => ({
        value: row.value,
        label: this.formatLabel(row.value),
        count: Number(row.count),
      }));

      return DataLayerResponse.Ok(formattedResults);
    } catch (error) {
      this.logger.error(`Error fetching filter values for ${filterName}: ${error.message}`);
      return DataLayerResponse.GenericError(error);
    }
  }

  /**
   * Fetch min and max values for range filters (e.g., price)
   */
  async fetchRangeFilterValues(
    dbColumn: string,
    appliedFilters: Record<string, any> = {},
    categoryName?: string,
  ): Promise<DataLayerResponse> {
    try {
      const knex = this.em.getConnection().getKnex();

      const query = knex('listing as l')
        .min(`l.${dbColumn} as min`)
        .max(`l.${dbColumn} as max`)
        .whereNotNull(`l.${dbColumn}`)
        .where(`l.${dbColumn}`, '>', 0);

      // Apply base filters
      query
        .whereNull('l.archived_on')
        .whereNotNull('l.activation_date')
        .where('l.is_deleted', false)
        .where('l.listed_qty', '>', 0);

      // Apply category filter if specified
      if (categoryName) {
        query.where('l.category_name', categoryName);
      }

      // Apply other filters
      this.applyInterdependentFilters(query, appliedFilters, 'price', FilterSource.LISTING);

      const [result] = await query;

      return DataLayerResponse.Ok({
        min: Number(result.min) || 0,
        max: Number(result.max) || 0,
      });
    } catch (error) {
      this.logger.error(`Error fetching range filter values: ${error.message}`);
      return DataLayerResponse.GenericError(error);
    }
  }

  /**
   * Apply interdependent filters to show how selections affect other filters
   */
  private applyInterdependentFilters(
    query: any,
    appliedFilters: Record<string, any>,
    excludeFilter: string,
    filterSource: FilterSource,
  ): void {
    Object.entries(appliedFilters).forEach(([key, value]) => {
      // Skip the filter we're currently fetching values for
      if (key === excludeFilter) return;

      // Skip empty values
      if (!value || (Array.isArray(value) && value.length === 0)) return;

      // Apply filters based on their type
      switch (key) {
        case 'categoryName':
          if (value && !Array.isArray(value)) {
            query.where('l.category_name', value);
          }
          break;

        case 'conditionName':
          if (Array.isArray(value)) {
            query.whereIn('l.condition_name', value);
          } else {
            query.where('l.condition_name', value);
          }
          break;

        case 'cityName':
          if (Array.isArray(value)) {
            // Check if city table is already joined
            const tableInfo = query.toSQL();
            const sqlString = tableInfo.sql || '';
            const hasCity = sqlString.includes('city as c') || sqlString.includes('`city` as `c`');
            if (!hasCity) {
              query.join('city as c', 'c.city_id', 'l.city_id');
            }
            query.whereIn('c.city_name', value);
          } else if (value) {
            // Single city filter
            const tableInfo = query.toSQL();
            const sqlString = tableInfo.sql || '';
            const hasCity = sqlString.includes('city as c') || sqlString.includes('`city` as `c`');
            if (!hasCity) {
              query.join('city as c', 'c.city_id', 'l.city_id');
            }
            query.where('c.city_name', value);
          }
          break;

        case 'brandName':
          if (Array.isArray(value)) {
            query.whereIn('l.brand_name', value);
          } else {
            query.where('l.brand_name', value);
          }
          break;

        case 'colorName':
          if (Array.isArray(value)) {
            query.whereIn('l.color', value);
          } else {
            query.where('l.color', value);
          }
          break;

        case 'minPrice':
          if (value) {
            query.where('l.effective_price', '>=', value);
          }
          break;

        case 'maxPrice':
          if (value) {
            query.where('l.effective_price', '<=', value);
          }
          break;

        case 'store':
          if (value) {
            // Check if shop table is already joined
            const tableInfo = query.toSQL();
            const sqlString = tableInfo.sql || '';
            const hasShop = sqlString.includes('shop as s') || sqlString.includes('`shop` as `s`');
            if (!hasShop) {
              query.join('shop as s', 's.shop_id', 'l.shop_id');
            }

            if (Array.isArray(value)) {
              // Handle multiple store IDs or names
              const isNumeric = value.every(v => !isNaN(Number(v)));
              if (isNumeric) {
                query.whereIn(
                  's.shop_id',
                  value.map(v => Number(v)),
                );
              } else {
                query.whereIn('s.shop_name', value);
              }
            } else {
              // Single store filter
              const isNumeric = !isNaN(Number(value));
              if (isNumeric) {
                query.where('s.shop_id', Number(value));
              } else {
                query.where('s.shop_name', value);
              }
            }
          }
          break;

        case 'search':
          if (value && typeof value === 'string') {
            // Apply search filter on listing title
            query.whereRaw('LOWER(l.listing_title) LIKE ?', [`%${value.toLowerCase()}%`]);
          }
          break;

        // Handle specification filters
        default:
          if (this.isSpecificationFilter(key)) {
            const column = this.getSpecificationColumn(key);
            if (column) {
              if (Array.isArray(value)) {
                query.whereIn(`ls.${column}`, value);
              } else if (typeof value === 'boolean') {
                query.where(`ls.${column}`, value);
              } else {
                query.where(`ls.${column}`, value);
              }
            }
          }
          break;
      }
    });
  }

  /**
   * Format label for display
   */
  private formatLabel(value: string | number | boolean): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'string') {
      // Handle special values
      if (value === 'ns' || value === '-1') {
        return 'Not Specified';
      }

      // Capitalize first letter of each word
      return value
        .split(/[\s_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    return String(value);
  }

  /**
   * Check if a filter belongs to specification table
   */
  private isSpecificationFilter(filterName: string): boolean {
    const specificationFilters = [
      'laptopType',
      'ramType',
      'ramCapacity',
      'primaryStorageType',
      'primaryStorageCapacity',
      'secondaryStorageType',
      'secondaryStorageCapacity',
      'processor',
      'generation',
      'graphicsCardName',
      'graphicsCardType',
      'graphicsCardMemory',
      'screenSize',
      'screenType',
      'screenProtection',
      'resolution',
      'keyboard',
      'speaker',
      'batteryType',
      'batteryCapacity',
      'isTouchScreen',
      'isBacklitKeyboard',
      'fingerprint',
      'isPtaApproved',
      'cameraSpecs',
      'isESim',
      'networkBand',
      'refreshRate',
      'simType',
      'bodyType',
      'isSimSupport',
      'displayType',
      'operatingSystem',
      'isSmartTv',
      'isWebcam',
      'isTvCertified',
      'desktopType',
      'accessoryType',
      'tvMonitorType',
    ];

    return specificationFilters.includes(filterName);
  }

  /**
   * Get database column name for specification filter
   */
  private getSpecificationColumn(filterName: string): string | null {
    const columnMap: Record<string, string> = {
      laptopType: 'laptop_type',
      ramType: 'ram_type',
      ramCapacity: 'ram_capacity',
      primaryStorageType: 'primary_storage_type',
      primaryStorageCapacity: 'primary_storage_capacity',
      secondaryStorageType: 'secondary_storage_type',
      secondaryStorageCapacity: 'secondary_storage_capacity',
      processor: 'processor',
      generation: 'generation',
      graphicsCardName: 'graphics_card_name',
      graphicsCardType: 'graphics_card_type',
      graphicsCardMemory: 'graphics_card_memory',
      screenSize: 'screen_size',
      screenType: 'screen_type',
      screenProtection: 'screen_protection',
      resolution: 'resolution',
      keyboard: 'keyboard',
      speaker: 'speaker',
      batteryType: 'battery_type',
      batteryCapacity: 'battery_capacity',
      isTouchScreen: 'is_touch_screen',
      isBacklitKeyboard: 'is_backlit_keyboard',
      fingerprint: 'fingerprint',
      isPtaApproved: 'is_pta_approved',
      cameraSpecs: 'camera_specs',
      isESim: 'is_e_sim',
      networkBand: 'network_band',
      refreshRate: 'refresh_rate',
      simType: 'sim_type',
      bodyType: 'body_type',
      isSimSupport: 'is_sim_support',
      displayType: 'display_type',
      operatingSystem: 'operating_system',
      isSmartTv: 'is_smart_tv',
      isWebcam: 'is_webcam',
      isTvCertified: 'is_tv_certified',
      desktopType: 'desktop_type',
      accessoryType: 'accessory_type',
      tvMonitorType: 'tv_monitor_type',
    };

    return columnMap[filterName] || null;
  }

  /**
   * Get total count of listings with filters applied
   */
  async getFilteredListingsCount(appliedFilters: Record<string, any> = {}, categoryName?: string): Promise<number> {
    try {
      const knex = this.em.getConnection().getKnex();

      const query = knex('listing as l').count('* as total').join('items as i', 'i.item_id', 'l.item_id');

      // Join specification table if needed
      const needsSpecification = Object.keys(appliedFilters).some(key => this.isSpecificationFilter(key));

      if (needsSpecification) {
        query.join('listing_specification as ls', 'ls.listing_id', 'l.listing_id');
      }

      // Apply base filters
      query
        .whereNull('l.archived_on')
        .whereNotNull('l.activation_date')
        .where('l.is_deleted', false)
        .where('l.listed_qty', '>', 0)
        .where('i.quantity', '>', 0)
        .where('i.is_deleted', false);

      // Apply category filter
      if (categoryName) {
        query.where('l.category_name', categoryName);
      }

      // Apply all other filters
      this.applyInterdependentFilters(
        query,
        appliedFilters,
        '', // Don't exclude any filter for count
        needsSpecification ? FilterSource.SPECIFICATION : FilterSource.LISTING,
      );

      const [result] = await query;
      return Number(result.total) || 0;
    } catch (error) {
      this.logger.error(`Error getting filtered listings count: ${error.message}`);
      return 0;
    }
  }
}
