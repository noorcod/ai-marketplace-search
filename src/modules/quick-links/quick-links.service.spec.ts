import { Test, TestingModule } from '@nestjs/testing';
import { QuickLinksService } from './quick-links.service';

describe('QuickLinksService', () => {
  let service: QuickLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuickLinksService],
    }).compile();

    service = module.get<QuickLinksService>(QuickLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
