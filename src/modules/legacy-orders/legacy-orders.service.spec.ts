import { Test, TestingModule } from '@nestjs/testing';
import { LegacyOrdersService } from './legacy-orders.service';

describe('LegacyOrdersService', () => {
  let service: LegacyOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegacyOrdersService],
    }).compile();

    service = module.get<LegacyOrdersService>(LegacyOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
