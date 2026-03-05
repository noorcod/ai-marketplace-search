import { Test, TestingModule } from '@nestjs/testing';
import { ApgService } from './apg.service';

describe('ApgService', () => {
  let service: ApgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApgService],
    }).compile();

    service = module.get<ApgService>(ApgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
