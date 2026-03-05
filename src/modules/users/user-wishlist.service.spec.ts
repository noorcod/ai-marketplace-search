import { Test, TestingModule } from '@nestjs/testing';
import { UserWishlistService } from './user-wishlist.service';

describe('UserWishlistService', () => {
  let service: UserWishlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserWishlistService],
    }).compile();

    service = module.get<UserWishlistService>(UserWishlistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
