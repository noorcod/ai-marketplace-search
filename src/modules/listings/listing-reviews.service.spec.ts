import { Test, TestingModule } from '@nestjs/testing';
import { ListingReviewsService } from './listing-reviews.service';

describe('ListingReviewsService', () => {
  let service: ListingReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListingReviewsService],
    }).compile();

    service = module.get<ListingReviewsService>(ListingReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
