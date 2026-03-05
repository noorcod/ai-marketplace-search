import { Injectable, HttpStatus } from '@nestjs/common';
import { AppResponse } from '@common/responses/app-response';
import { ListingReview } from './entities/listing-review.entity';
import { ListingReviewsRepository } from './repositories/listing-reviews.repository';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { LISTING_REVIEWS_POPULATE } from '@common/constants/populate-tables.constants';
import { LISTING_REVIEWS_COLUMNS } from '@common/constants/column-selections.constants';
import { CreateListingReviewDto } from './dtos/create-listing-review.dto';
import { dateTime } from '@common/utilities/date-time';

@Injectable()
export class ListingReviewsService {
  constructor(private readonly repo: ListingReviewsRepository) {}

  async fetchDetailsByOrderId(orderId: number) {
    const reviewPopulatedTables = nestedObjectToDotFields(LISTING_REVIEWS_POPULATE);
    const reviewColumns = nestedObjectToDotFields(LISTING_REVIEWS_COLUMNS);

    const where: QueryWhere<ListingReview> = { order: orderId };
    const options: QueryOptions<ListingReview> = { populate: reviewPopulatedTables, fields: reviewColumns };

    const result = await this.repo.fetchOne(where, options);
    if (!result.success) {
      return AppResponse.Err('No entry found for the given order id');
    }
    const review = result.data as ListingReview;
    if (!review.isPending) {
      return AppResponse.Err('A review has already been submitted for this order');
    }
    return AppResponse.fromDataLayer(result) as AppResponse<ListingReview>;
  }

  async fetchReviewsByUserId(userId: string, onlyPending: boolean, paginationOptions: PaginationQueryDto) {
    const reviewPopulatedTables = nestedObjectToDotFields(LISTING_REVIEWS_POPULATE);
    const reviewColumns = nestedObjectToDotFields(LISTING_REVIEWS_COLUMNS);

    const where: QueryWhere<ListingReview> = { user: userId };
    if (onlyPending) {
      where.isPending = true;
    }

    const options: QueryOptions<ListingReview> = {
      populate: reviewPopulatedTables,
      fields: reviewColumns,
      page: paginationOptions.page,
      limit: paginationOptions.size,
    };
    const result = await this.repo.fetch(where, options);
    if (result.data.length === 0) {
      return AppResponse.Err('No reviews found for the given user id');
    }
    return AppResponse.fromDataLayer(result) as AppResponse<ListingReview[]>;
  }

  async fetchReviewsByListingId(listingId: number, paginationOptions: PaginationQueryDto) {
    const reviewPopulatedTables = nestedObjectToDotFields(LISTING_REVIEWS_POPULATE);
    const reviewColumns = nestedObjectToDotFields(LISTING_REVIEWS_COLUMNS);

    const where: QueryWhere<ListingReview> = { listing: listingId, isDeleted: false, isPending: false };
    const options: QueryOptions<ListingReview> = {
      populate: reviewPopulatedTables,
      fields: reviewColumns,
      page: paginationOptions.page,
      limit: paginationOptions.size,
      orderBy: { updatedAt: 'DESC' }, // Most recent reviews first
    };
    const result = await this.repo.fetch(where, options);
    if (!result.success || result.data.length === 0) {
      return AppResponse.Err('No reviews found for the given listing id');
    }
    const reviewStats = await this.repo.getListingReviewStats(listingId);
    const mappedReviews = result.data.map(r => ({
      reviewDate: r.updatedAt,
      reviewer: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Guest User',
      review: r.review,
      rating: r.rating,
    }));

    const stats = {
      total: reviewStats['total_reviews'],
      average: reviewStats['average_rating'],
      breakdown: {
        excellent: reviewStats['excellent'],
        good: reviewStats['good'],
        average: reviewStats['average'],
        poor: reviewStats['poor'],
        terrible: reviewStats['terrible'],
      },
    };

    return {
      status: 200,
      success: true,
      message: 'Reviews fetched successfully',
      data: {
        reviews: mappedReviews,
        stats,
      },
      meta: {
        totalItems: result.data.length,
        currentPage: paginationOptions.page,
        perPage: paginationOptions.size,
        totalPages: Math.ceil(result.data.length / paginationOptions.size),
      },
    };
  }

  async addReview(review: CreateListingReviewDto) {
    // fetch and verify the existing review row
    const row = await this.repo.fetchOne({ id: review.id });
    if (!row.success || !row.data) {
      return AppResponse.Err('No review found for the given id');
    }
    const existingReview = row.data as ListingReview;
    if (!existingReview.isPending) {
      return AppResponse.Err('You cannot resubmit a review for this order');
    }

    // update the existing review
    const updateReview = await this.repo.updateEntity(
      { id: review.id },
      {
        ...review,
        isPending: false,
        updatedAt: dateTime(),
      },
    );

    if (!updateReview) {
      return AppResponse.Err('An error occurred while updating the review');
    }

    return AppResponse.fromDataLayer(updateReview) as AppResponse<ListingReview>;
  }

  /**
   * Check review status for an order - consolidated endpoint
   * Returns: reviewId, isPending, requiresAuth
   */
  async checkReviewStatus(orderId: number) {
    // Fetch review by order ID
    const reviewResult = await this.repo.fetchOne(
      { order: orderId },
      { fields: ['id', 'isPending', 'user'] as any, populate: ['order.user'] as any },
    );

    if (!reviewResult.success || !reviewResult.data) {
      return AppResponse.Err('No review found for this order', HttpStatus.NOT_FOUND);
    }

    const review = reviewResult.data as ListingReview;

    // Determine if authentication is required
    // If order has a user (not guest), authentication is required
    const requiresAuth = review.order && typeof review.order === 'object' ? !!(review.order as any).user : false;

    return AppResponse.Ok({
      reviewId: review.id,
      isPending: review.isPending ?? true,
      requiresAuth,
    });
  }

  /**
   * Fetch top reviews by listing ID
   * Returns top 3 reviews ordered by rating (highest first), then by date
   */
  async fetchTopReviewsByListingId(listingId: number) {
    const result = await this.repo.fetchTopReviewsByListingId(listingId);

    if (!result.success || !result.data || result.data.length === 0) {
      return AppResponse.Err('No reviews found for the given listing id', HttpStatus.NOT_FOUND);
    }

    return AppResponse.fromDataLayer(result) as AppResponse<ListingReview[]>;
  }
}
