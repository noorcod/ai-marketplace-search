import { BaseRepository } from '@common/database/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ListingReview } from '../entities/listing-review.entity';
import { DataLayerResponse } from '@common/responses/data-layer-response';

@Injectable()
export class ListingReviewsRepository extends BaseRepository<ListingReview> {
  private readonly logger = new Logger(ListingReviewsRepository.name);
  async getListingReviewStats(listingId: number) {
    try {
      const knex = this.em.getKnex();

      const result = await knex('listing_review as lr')
        .select([
          'lr.fk_listing_id',
          knex.raw('COUNT(lr.id) as total_reviews'),
          knex.raw('AVG(lr.rating) as average_rating'),
          knex.raw('SUM(CASE WHEN lr.rating = 5 THEN 1 ELSE 0 END) as excellent'),
          knex.raw('SUM(CASE WHEN lr.rating = 4 THEN 1 ELSE 0 END) as good'),
          knex.raw('SUM(CASE WHEN lr.rating = 3 THEN 1 ELSE 0 END) as average'),
          knex.raw('SUM(CASE WHEN lr.rating = 2 THEN 1 ELSE 0 END) as poor'),
          knex.raw('SUM(CASE WHEN lr.rating = 1 THEN 1 ELSE 0 END) as terrible'),
        ])
        .where({
          'lr.fk_listing_id': listingId,
          'lr.is_deleted': false,
          'lr.is_pending': false,
        })
        .groupBy('lr.fk_listing_id');

      if (!result || result.length === 0) {
        return DataLayerResponse.NotFound();
      }

      return DataLayerResponse.Ok(result[0]);
    } catch (e) {
      Logger.error('Repository', e.message);
      return DataLayerResponse.GenericError(e.message);
    }
  }

  async getShopReviewStats(shopId: number) {
    try {
      const knex = this.em.getKnex();

      const result = await knex('listing_review as lr')
        .select([
          'lr.fk_shop_id',
          knex.raw('COUNT(lr.id) as total_reviews'),
          knex.raw('AVG(lr.rating) as average_rating'),
          knex.raw('SUM(CASE WHEN lr.rating = 5 THEN 1 ELSE 0 END) as excellent'),
          knex.raw('SUM(CASE WHEN lr.rating = 4 THEN 1 ELSE 0 END) as good'),
          knex.raw('SUM(CASE WHEN lr.rating = 3 THEN 1 ELSE 0 END) as average'),
          knex.raw('SUM(CASE WHEN lr.rating = 2 THEN 1 ELSE 0 END) as poor'),
          knex.raw('SUM(CASE WHEN lr.rating = 1 THEN 1 ELSE 0 END) as terrible'),
        ])
        .where({
          'lr.fk_shop_id': shopId,
          'lr.is_deleted': false,
          'lr.is_pending': false,
        })
        .groupBy('lr.fk_shop_id');

      if (!result || result.length === 0) {
        return DataLayerResponse.NotFound();
      }

      return DataLayerResponse.Ok(result[0]);
    } catch (e) {
      Logger.error('Repository', e.message);
      return DataLayerResponse.GenericError(e.message);
    }
  }

  /**
   * Fetch review summary (totalReviews, averageRating) for multiple shops in a single query.
   * Returns a Map<shopId, { totalReviews, averageRating }>.
   */
  async getBatchShopReviewSummary(
    shopIds: number[],
  ): Promise<DataLayerResponse<Map<number, { totalReviews: number; averageRating: string }>>> {
    try {
      if (!shopIds || shopIds.length === 0) {
        return DataLayerResponse.Ok(new Map());
      }

      const knex = this.em.getKnex();

      const results = await knex('listing_review as lr')
        .select([
          'lr.fk_shop_id as shopId',
          knex.raw('COUNT(lr.id) as total_reviews'),
          knex.raw('AVG(lr.rating) as average_rating'),
        ])
        .whereIn('lr.fk_shop_id', shopIds)
        .andWhere({
          'lr.is_deleted': false,
          'lr.is_pending': false,
        })
        .groupBy('lr.fk_shop_id');

      const map = new Map<number, { totalReviews: number; averageRating: string }>();
      for (const row of results as any[]) {
        map.set(Number(row.shopId), {
          totalReviews: Number(row.total_reviews) || 0,
          averageRating: row.average_rating ? parseFloat(row.average_rating).toFixed(2) : '0.00',
        });
      }

      return DataLayerResponse.Ok(map);
    } catch (e) {
      this.logger.error('getBatchShopReviewSummary error:', e.message);
      return DataLayerResponse.GenericError(e.message);
    }
  }

  /**
   * Fetch top reviews by listing ID
   * Returns top 3 reviews ordered by rating (highest first), then by date
   */
  async fetchTopReviewsByListingId(listingId: number) {
    try {
      const result = await this.fetch(
        {
          listing: listingId,
          isPending: false,
          isDeleted: false,
        },
        {
          orderBy: [{ rating: 'DESC' }, { updatedAt: 'DESC' }],
          limit: 3,
          populate: ['user'] as any,
        },
      );

      if (!result.success || result.data.length === 0) {
        return DataLayerResponse.NotFound();
      }

      return DataLayerResponse.Ok(result.data);
    } catch (e) {
      this.logger.error('fetchTopReviewsByListingId error:', e.message);
      return DataLayerResponse.GenericError(e.message);
    }
  }
}
