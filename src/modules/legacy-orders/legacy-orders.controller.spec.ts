import { Test, TestingModule } from '@nestjs/testing';
import { LegacyOrdersService } from './legacy-orders.service';
import { LegacyOrdersController } from './legacy-orders.controller';

describe('LegacyOrdersController', () => {
  let controller: LegacyOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegacyOrdersController],
      providers: [LegacyOrdersService],
    }).compile();

    controller = module.get<LegacyOrdersController>(LegacyOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
