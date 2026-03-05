import { Test, TestingModule } from '@nestjs/testing';
import { ListingReviewsController } from './listing-reviews.controller';

describe('ListingReviewsController', () => {
  let controller: ListingReviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingReviewsController],
    }).compile();

    controller = module.get<ListingReviewsController>(ListingReviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
