import { Test, TestingModule } from '@nestjs/testing';
import { SaleEventsService } from './sale-events.service';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { SaleEventsRepository } from '@modules/sale-events/repositories/sale-events.repository';
import { ListingsService } from '@modules/listings/listings.service';

describe('SaleEventsService', () => {
  let service: SaleEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleEventsService,
        { provide: MikroORM, useValue: {} },
        { provide: EntityManager, useValue: {} },
        { provide: SaleEventsRepository, useValue: {} },
        { provide: ListingsService, useValue: {} },
      ],
    }).compile();

    service = module.get<SaleEventsService>(SaleEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
