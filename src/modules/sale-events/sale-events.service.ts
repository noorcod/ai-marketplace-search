import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MikroORM, wrap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { SaleEventsRepository } from '@modules/sale-events/repositories/sale-events.repository';
import { ListingsService } from '@modules/listings/listings.service';
import { AppResponse } from '@common/responses/app-response';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { Sale } from '@modules/sale-events/entities/sale.entity';
import { PaginatedResponse } from '@common/responses/paginated-response';

@Injectable()
export class SaleEventsService {
  private readonly logger = new Logger(SaleEventsService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly saleEventsRepository: SaleEventsRepository,
    private readonly listingsService: ListingsService,
  ) {}

  async fetchAllSales() {
    try {
      const now = new Date();

      const where: QueryWhere<Sale> = {
        isDeleted: false,
        isActive: true,
        $and: [
          {
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
          },
          {
            $or: [{ endDate: null }, { endDate: { $gte: now } }],
          },
        ],
      };

      const options: QueryOptions<Sale> = {
        limit: 10,
        orderBy: { startDate: 'DESC', id: 'DESC' },
        populate: ['banners'],
        populateWhere: {
          banners: { isDeleted: false },
        },
      };

      const sales = await this.saleEventsRepository.fetch(where, options);
      if (!sales.success) {
        return PaginatedResponse.Empty();
      }

      return PaginatedResponse.fromDataLayer(sales);
    } catch (error) {
      this.logger.error(`Error in fetchAllSales: ${error.message}`, error.stack);
      return PaginatedResponse.GenericError(`Failed to fetch sale events: ${error.message}`);
    }
  }

  async fetchSaleByName(name: string) {
    try {
      if (!name) {
        return AppResponse.Err('Sale name is required') as AppResponse<Partial<Sale>>;
      }

      const now = new Date();
      const where: QueryWhere<Sale> = {
        name,
        isDeleted: false,
        $and: [
          {
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
          },
        ],
      };

      const options: QueryOptions<Sale> = {
        populate: ['banners'],
        populateWhere: {
          banners: { isDeleted: false },
        },
      };

      const saleRes = await this.saleEventsRepository.fetchOne(where, options);
      if (!saleRes.success || !saleRes.data) {
        return AppResponse.Err('Sale not found', HttpStatus.NOT_FOUND) as AppResponse<Partial<Sale>>;
      }

      const sale = saleRes.data as Sale;
      const responsePayload: any = wrap(sale).toObject();

      const saleEnded = Boolean((sale as any).endDate && new Date((sale as any).endDate).getTime() < now.getTime());
      responsePayload.saleEnded = saleEnded;

      if (saleEnded) {
        responsePayload.listings = [];
        return AppResponse.Ok(responsePayload) as AppResponse<Partial<Sale>>;
      }

      const ids = (sale as any).listings.map((entry: any) => entry.value);
      const listingsRes = await this.listingsService.fetchListingsByIds({ ids } as any);
      if ((listingsRes as any)?.success) {
        responsePayload.listings = (listingsRes as any).data?.listings ?? (listingsRes as any).data?.listings;
      }

      return AppResponse.Ok(responsePayload);
    } catch (error) {
      this.logger.error(`Error in fetchSaleByName: ${error.message}`, error.stack);
      return AppResponse.Err(`Failed to fetch sale event: ${error.message}`);
    }
  }
}
