import { BaseRepository } from '@common/database/base.repository';
import { Shop } from '../entities/shop.entity';
import { DataLayerResponse } from '@common/responses/data-layer-response';
import { raw } from '@mikro-orm/core';
import { Listing } from '@modules/listings/entities/listing.entity';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { ListingStatus } from '@common/enums/listing-status.enum';

export class ShopsRepository extends BaseRepository<Shop> {
  // TODO: Later we can move this to listings repo

  /**
   * Fetches shops with the most activated listings.
   * @param pagination Pagination options for limiting and offsetting results.
   * @param categoryId Optional The ID of the category to filter listings by.
   * @returns A promise that resolves to a DataLayerResponse containing an array of shops with their listing counts.
   */
  async fetchShopsWithMostActivatedListings(
    pagination: PaginationOptions,
    categoryId?: number,
  ): Promise<DataLayerResponse<Partial<Shop>[]>> {
    try {
      const qb = this.em.createQueryBuilder(Listing, 'l');
      const whereConditions = {
        'l.status': ListingStatus.VALIDATED_ACTIVE,
        'l.isDeleted': false,
        'l.listedQty': { $gt: 0 },
        'l.archivedOn': null,
        'l.activationDate': { $ne: null },
        's.isActive': true,
        's.isDeleted': false,
        'sub.isActive': true,
        'sub.isSubscriptionCancelled': false,
      };

      if (categoryId) {
        whereConditions['l.category'] = categoryId;
      }

      qb.select('shop')
        .addSelect(raw('COUNT(l.listing_id) as listingCount'))
        .innerJoin('l.shop', 's')
        .innerJoin('s.subscription', 'sub')
        .where(whereConditions);

      qb.andWhere('s.shop_name NOT LIKE ?', ['%test%'])
        .andWhere('s.shop_name NOT LIKE ?', ['%demo%'])
        .andWhere('s.username NOT LIKE ?', ['%test%'])
        .andWhere('s.username NOT LIKE ?', ['%demo%'])
        .andWhere('s.owner_email NOT LIKE ?', ['%test%'])
        .andWhere('s.owner_email NOT LIKE ?', ['%demo%'])
        .groupBy('l.shop')
        .offset(pagination.offset())
        .limit(pagination.limit())
        .orderBy({ [raw('COUNT(l.listing_id)')]: 'DESC' });

      const result = await qb.execute();
      if (result.length === 0) {
        return DataLayerResponse.NotFound();
      }
      return DataLayerResponse.Ok(result);
    } catch (error) {
      return DataLayerResponse.GenericError(error.message);
    }
  }

  /**
   * Fetches shops with active listings based on the provided criteria.
   * @param minCriteria Minimum number of active listings required for a shop to be included.
   * @param categoryId Optional category ID to filter listings by category.
   * @returns A promise that resolves to a DataLayerResponse containing an array of shops with active listings.
   */
  async fetchShopsWithActiveListings(
    minCriteria?: number,
    categoryId?: number,
  ): Promise<DataLayerResponse<Partial<Shop>[]>> {
    try {
      const qb = this.em.createQueryBuilder(Shop, 's'); // Create base where conditions
      const whereConditions = {
        's.isActive': true,
        's.isDeleted': false,
        'sub.isActive': true,
        'sub.isSubscriptionCancelled': false,
        'l.isDeleted': false,
        'l.archivedOn': null,
        'l.activationDate': { $ne: null },
        'l.listedQty': { $gt: 0 },
      };

      if (categoryId) {
        whereConditions['l.category'] = categoryId;
      }

      qb.select(['s.shopId'], true)
        .innerJoin('s.subscription', 'sub')
        .innerJoin('s.listings', 'l')
        .where(whereConditions)
        .andWhere('s.shop_name NOT LIKE ?', ['%test%'])
        .andWhere('s.shop_name NOT LIKE ?', ['%demo%'])
        .andWhere('s.username NOT LIKE ?', ['%test%'])
        .andWhere('s.username NOT LIKE ?', ['%demo%'])
        .andWhere('s.owner_email NOT LIKE ?', ['%test%'])
        .andWhere('s.owner_email NOT LIKE ?', ['%demo%']);

      // Optionally filter by minimum criteria (e.g., minimum listings)
      if (minCriteria) {
        qb.andWhere(
          raw(
            `(SELECT COUNT(*) FROM listing l2 WHERE l2.shop_id = s.shop_id AND l2.status = '${ListingStatus.VALIDATED_ACTIVE}' AND l2.is_deleted = 0 AND l2.archived_on IS NULL) >= ?`,
            [minCriteria],
          ),
        );
      }

      const result = await qb.execute();
      if (result.length === 0) {
        return DataLayerResponse.NotFound();
      }
      return DataLayerResponse.Ok(result);
    } catch (error) {
      return DataLayerResponse.GenericError(error.message);
    }
  }
}
