import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { BannersRepository } from './banners.repository';
import { QueryOptions } from 'src/common/interfaces/repository.interface';
import { MarketplaceBanner } from './entities/marketplace-banner.entity';
import { AppResponse } from 'src/common/responses/app-response';
import { MikroORM } from '@mikro-orm/core';

@Injectable()
export class BannersService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: BannersRepository,
  ) {}

  async fetchBannersByPage(page: string, source?: string) {
    try {
      if (!page) {
        return AppResponse.Err('Page is required') as AppResponse<Partial<MarketplaceBanner>[]>;
      }
      const whereCondition = {
        page: page,
        isDeleted: 0,
      };
      if (source && source === 'mobile') {
        whereCondition['isMobileBanner'] = true;
      }
      const options: QueryOptions = {
        populate: [],
        fields: ['id', 'style', 'page', 'location', 'img', 'link', 'sequence', 'expiresOn', 'isMobileBanner'],
        orderBy: {
          createdAt: 'ASC',
          sequence: 'ASC',
        },
      };
      const banners = await this.repo.fetch(whereCondition, options);
      if (!banners.success) {
        return AppResponse.Err('No banners found') as AppResponse<Partial<MarketplaceBanner>[]>;
      }
      const data = (banners.data as MarketplaceBanner[]).reduce((acc, item) => {
        if (!acc[item.location]) {
          acc[item.location] = [];
        }
        acc[item.location].push(item);
        return acc;
      }, {});
      const groupedArray = Object.values(data) as MarketplaceBanner[];
      banners.data = groupedArray;
      return AppResponse.fromDataLayer(banners) as AppResponse<Partial<MarketplaceBanner>[]>;
    } catch (error) {
      return AppResponse.Err(error.message) as AppResponse<Partial<MarketplaceBanner>[]>;
    }
  }
}
