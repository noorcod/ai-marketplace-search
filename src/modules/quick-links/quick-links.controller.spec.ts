import { Test, TestingModule } from '@nestjs/testing';
import { QuickLinksController } from './quick-links.controller';

describe('QuickLinksController', () => {
  let controller: QuickLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuickLinksController],
    }).compile();

    controller = module.get<QuickLinksController>(QuickLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
