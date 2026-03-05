import { Test, TestingModule } from '@nestjs/testing';
import { BecomeSellerController } from './become-seller.controller';

describe('BecomeSellerController', () => {
  let controller: BecomeSellerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BecomeSellerController],
    }).compile();

    controller = module.get<BecomeSellerController>(BecomeSellerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
