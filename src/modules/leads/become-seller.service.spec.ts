import { Test, TestingModule } from '@nestjs/testing';
import { BecomeSellerService } from './become-seller.service';

describe('BecomeSellerService', () => {
  let service: BecomeSellerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BecomeSellerService],
    }).compile();

    service = module.get<BecomeSellerService>(BecomeSellerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
