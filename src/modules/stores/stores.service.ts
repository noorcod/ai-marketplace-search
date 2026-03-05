import { Injectable, NotImplementedException } from '@nestjs/common';
import { ShopsRepository } from './repositories/shops.repository';
import { MikroORM, wrap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AppResponse } from '@common/responses/app-response';
import { Shop } from './entities/shop.entity';
import { DataLayerResponse } from '@common/responses/data-layer-response';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { OrderByOptions } from '@common/utilities/order-by-options';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { FetchStoreOptionsType, FetchStoresFiltersType } from './types/fetch-stores.type';
import { PaginatedResponse } from 'src/common/responses/paginated-response';
import { PaginationInfo } from '@common/types/pagination.type';
import { StoreResponseType } from './types/store-response.type';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { EnvService } from 'src/global-modules/env/env.service';
import { ThemeConfigDto } from './dtos/theme-config.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListingReviewsRepository } from '@modules/listings/repositories/listing-reviews.repository';

@Injectable()
export class StoresService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly shopsRepo: ShopsRepository,
    private readonly httpService: HttpService,
    private readonly envService: EnvService,
    private readonly eventEmitter: EventEmitter2,
    private readonly reviewsRepo: ListingReviewsRepository,
  ) {}

  async fetchStores(
    filters?: FetchStoresFiltersType,
    pagination?: PaginationOptions,
    options?: FetchStoreOptionsType,
  ): Promise<AppResponse<StoreResponseType[]>> {
    const { sort, criteria } = options ?? {};
    const orderBy = new OrderByOptions(sort ?? ['shopName', 'ASC']);

    const opt: QueryOptions<Shop> = {
      limit: pagination.limit(),
      offset: pagination.offset(),
      populate: ['locations.city'],
      fields: [
        'shopId',
        'shopName',
        'username',
        'logoPath',
        'onPayment',
        'onTrial',
        'locations.locationNick',
        'locations.locationId',
        'locations.address',
        'locations.latitude',
        'locations.longitude',
        'locations.isMain',
        'locations.city.cityId',
        'locations.city.cityName',
      ],
      orderBy: orderBy.getForQueryOption(),
    };
    const where: QueryWhere<Shop> = {
      // locations: { isMain: true },
    };
    if (filters?.search) {
      where['shopName'] = { $like: `%${filters?.search}%` };
    }
    if (filters?.cityId) {
      where['locations'] = { city: { $eq: filters?.cityId } }; // If we have any other filter in city. we will require to revamp this part
    }

    let shops: DataLayerResponse<Partial<Shop>[]>;
    let shopIds: DataLayerResponse<Partial<Shop>[]>;
    switch (criteria) {
      case 'most-listings':
        shopIds = await this.shopsRepo.fetchShopsWithMostActivatedListings(pagination, +filters?.categoryId);
        break;
      case 'most-viewed':
        throw new NotImplementedException('Criteria not implemented yet');
      case 'multi-category':
        throw new NotImplementedException('Criteria not implemented yet');
      default:
        shopIds = await this.shopsRepo.fetchShopsWithActiveListings(1, +filters?.categoryId);
        break;
    }

    if (!shopIds.success) {
      return AppResponse.Err('Criteria Unfulfilled');
    }

    where['shopId'] = { $in: shopIds.data.map(shop => shop?.shopId ?? shop?.shop) };

    // TODO: Verify populated fields and corresponding response type. This should be aligned with the Query Options from line 40
    shops = await this.shopsRepo.fetch(where, opt);

    if (!shops.success) {
      return AppResponse.Err(shops.message) as AppResponse<StoreResponseType[]>;
    }

    // Batch fetch review summaries for all shops in a single query
    const allShopIds = shops.data.map(shop => shop.shopId).filter(Boolean);
    const reviewSummaryResult = await this.reviewsRepo.getBatchShopReviewSummary(allShopIds);
    const reviewSummaryMap = (reviewSummaryResult.success ? reviewSummaryResult.data : new Map()) as Map<
      number,
      { totalReviews: number; averageRating: string }
    >;

    const response = shops?.data.map(shop => {
      // Create a main location object and collect unique cities
      const mainLocation = {};
      const cities = new Set<string>();

      // Process shop locations using for loop
      shop?.locations.map(lc => {
        // Add city name to cities set if it exists
        if (lc?.city?.cityName) {
          cities.add(lc.city.cityName);
        }

        // Extract main location information
        if (lc.isMain) {
          Object.assign(mainLocation, {
            locationName: lc.locationNick,
            latitude: lc.latitude,
            longitude: lc.longitude,
          });
        }
      });
      const plainShop = wrap(shop).toObject();
      // Add processed data back to shop
      return {
        ...plainShop,
        cities: Array.from(cities),
        locations: mainLocation,
        reviewSummary: reviewSummaryMap.get(shop.shopId) ?? { totalReviews: 0, averageRating: '0.00' },
      };
    });
    return PaginatedResponse.Ok(response as StoreResponseType[], shops.meta as PaginationInfo);
  }

  async fetchByUsername(username: string, city?: string): Promise<AppResponse<Partial<any>>> {
    const whereOptions = {
      username: { $like: username },
      isActive: true,
      isDeleted: false,
      subscription: {
        isActive: true,
        isSubscriptionCancelled: false,
      },
    };
    if (city) {
      whereOptions['locations'] = { city: { cityName: { $like: city } } };
    }
    const options: QueryOptions<Shop> = {
      exclude: ['ownerWhatsappNumber', 'ownerBackupPhoneNumber', 'ownerEmail'],
      populate: ['locations.city', 'reviews.listing', 'reviews.user'],
    };
    const shop = await this.shopsRepo.fetchOne(whereOptions, options);
    if (!shop.success) {
      return AppResponse.Err(shop.message) as AppResponse<Partial<Shop>>;
    }

    // Get shop review statistics
    const shopData = shop.data as Shop;
    const reviewStats = await this.reviewsRepo.getShopReviewStats(shopData.shopId);

    const response = {
      ...shopData,
      reviewStats: reviewStats.success
        ? {
            total: reviewStats.data['total_reviews'] || 0,
            average: reviewStats.data['average_rating']
              ? parseFloat(reviewStats.data['average_rating']).toFixed(2)
              : '0.00',
            breakdown: {
              excellent: reviewStats.data['excellent'] || 0,
              good: reviewStats.data['good'] || 0,
              average: reviewStats.data['average'] || 0,
              poor: reviewStats.data['poor'] || 0,
              terrible: reviewStats.data['terrible'] || 0,
            },
          }
        : {
            total: 0,
            average: '0.00',
            breakdown: {
              excellent: 0,
              good: 0,
              average: 0,
              poor: 0,
              terrible: 0,
            },
          },
    };

    return AppResponse.Ok(response) as AppResponse<Partial<any>>;
  }

  async fetchShopContactInformationByUsername(
    username: string,
    user?: { ip: string; userInfo: any },
  ): Promise<AppResponse<Partial<Shop>>> {
    // If user is provided, emit an event for fetching cell number
    if (user) {
      // Emit an event for fetching cell number - this is for logging or analytics purposes
      this.eventEmitter.emit('stores.fetched-cell-number', {
        username,
        ip: user.ip,
        userInfo: user.userInfo,
      });
    }

    const whereOptions = {
      username: { $like: username },
      isActive: true,
      isDeleted: false,
    };
    const options: QueryOptions<Shop> = {
      fields: ['ownerWhatsappNumber', 'ownerBackupPhoneNumber', 'shopName', 'ownerEmail'],
    };
    const shop = await this.shopsRepo.fetchOne(whereOptions, options);
    if (!shop.success) {
      return AppResponse.Err(shop.message) as AppResponse<Partial<Shop>>;
    }
    return AppResponse.fromDataLayer(shop) as AppResponse<Partial<Shop>>;
  }

  async verityShopLogin(username: string, token: string): Promise<AppResponse<Partial<Shop>>> {
    try {
      const data = await firstValueFrom(
        this.httpService.get(`${this.envService.sellerUrl}/user/seller-verification`, {
          headers: {
            Cookie: `accessToken=bearer ${token}`,
          },
        }),
      );

      if (data.data[0].username === username) {
        const whereOptions = {
          username,
          isActive: true,
          isDeleted: false,
          subscription: {
            isActive: true,
            isSubscriptionCancelled: false,
          },
        };
        const options: QueryOptions<Shop> = {
          exclude: ['ownerWhatsappNumber', 'ownerBackupPhoneNumber', 'ownerEmail'],
          populate: ['locations.city', 'shopOption'],
        };
        const shop = await this.shopsRepo.fetchOne(whereOptions, options);

        if (!shop.success) {
          return AppResponse.Err(shop.message) as AppResponse<Partial<Shop>>;
        } else if (!shop.data) {
          return AppResponse.Err('Invalid shop username') as AppResponse<Partial<Shop>>;
        } else {
          return AppResponse.fromDataLayer(shop) as AppResponse<Partial<Shop>>;
        }
      } else {
        return AppResponse.Err("Invalid User. You don't have access to this shop") as AppResponse<Partial<Shop>>;
      }
    } catch (error) {
      return AppResponse.Err('Error verifying shop login') as AppResponse<Partial<Shop>>;
    }
  }

  async addShopConfiguration(shopId: number, body: ThemeConfigDto): Promise<AppResponse<Partial<Shop>>> {
    const whereOptions = { shopId };
    const updateData: Partial<Shop> = {
      finalConfiguration: body,
    };

    const shop = await this.shopsRepo.updateEntity(whereOptions, updateData);
    if (!shop.success) {
      return AppResponse.Err(shop.message) as AppResponse<Partial<Shop>>;
    }
    return AppResponse.fromDataLayer(shop) as AppResponse<Partial<Shop>>;
  }
}
