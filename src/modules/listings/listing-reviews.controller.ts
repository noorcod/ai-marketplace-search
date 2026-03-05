import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ListingReviewsService } from './listing-reviews.service';
import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { CreateListingReviewDto } from './dtos/create-listing-review.dto';

@Controller('listing-review')
export class ListingReviewsController {
  constructor(private readonly listingReviewService: ListingReviewsService) {}

  @Get('order/:orderId')
  async fetchDetailsByOrderId(@Param('orderId') orderId: number) {
    return this.listingReviewService.fetchDetailsByOrderId(orderId);
  }

  @Get('order/:orderId/status')
  async checkReviewStatus(@Param('orderId') orderId: number) {
    return this.listingReviewService.checkReviewStatus(orderId);
  }

  @Get('user/:userId')
  async fetchReviewsByUserId(
    @Param('userId') userId: string,
    @Query('onlyPending') onlyPending: boolean = false,
    @Query('page') page: number,
    @Query('size') size: number,
  ) {
    const paginationQuery: PaginationQueryDto = { page: page || 1, size: size || 10 };
    return this.listingReviewService.fetchReviewsByUserId(userId, onlyPending, paginationQuery);
  }

  @Get('listing/:listingId')
  async fetchReviewsByListingId(
    @Param('listingId') listingId: number,
    @Query('page') page: number,
    @Query('size') size: number,
  ) {
    const paginationQuery: PaginationQueryDto = { page: page || 1, size: size || 10 };
    return this.listingReviewService.fetchReviewsByListingId(listingId, paginationQuery);
  }

  @Get('listing/:listingId/top')
  async fetchTopReviewsByListingId(@Param('listingId') listingId: number) {
    return this.listingReviewService.fetchTopReviewsByListingId(listingId);
  }

  @Patch(':id')
  async addReview(@Param('id') id: number, @Body() review: CreateListingReviewDto) {
    return this.listingReviewService.addReview({ ...review, id });
  }
}
