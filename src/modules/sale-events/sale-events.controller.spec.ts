import { Test, TestingModule } from '@nestjs/testing';
import { SaleEventsController } from './sale-events.controller';
import { SaleEventsService } from './sale-events.service';

describe('SaleEventsController', () => {
  let controller: SaleEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleEventsController],
      providers: [{ provide: SaleEventsService, useValue: {} }],
    }).compile();

    controller = module.get<SaleEventsController>(SaleEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
