import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AppResponse } from 'src/common/responses/app-response';
import { City } from './entities/city.entity';
import { CitiesRepository } from './repositories/cities.repository';
import { ProvincesRepository } from './repositories/provinces.repository';
import { Province } from './entities/province.entity';
import { CityQueryDto } from './dtos/cities.dto';
import { PaginationSearchQueryDto } from 'src/common/dtos/pagination-search-query.dto';
import { QueryOptions, QueryWhere } from 'src/common/interfaces/repository.interface';

@Injectable()
export class AreasService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly citiesRepo: CitiesRepository,
    private readonly provincesRepo: ProvincesRepository,
  ) {}

  async getCities(query: CityQueryDto): Promise<AppResponse<Partial<City>[]>> {
    const where: QueryWhere<City> = {
      isDeleted: false,
    };

    if (query.search) {
      where.cityName = { $like: `%${query.search}%` };
    }
    if (query.provinceId) {
      where.province = query.provinceId;
    }
    const options: QueryOptions<City> = {
      limit: query.size,
      offset: (query.page - 1) * query.size,
      orderBy: { cityName: 'ASC' },
    };
    const cities = await this.citiesRepo.fetch(where, options);
    if (!cities.success) {
      return AppResponse.Err('No cities found') as AppResponse<Partial<City>[]>;
    }
    return AppResponse.fromDataLayer(cities) as AppResponse<Partial<City>[]>;
  }

  async fetchCitiesActiveForDelivery() {
    const where = { isActiveForDelivery: 1, isDeleted: false, province: { isDeleted: false } };
    const options: QueryOptions<City> = {
      populate: ['province'],
      fields: [
        'cityId',
        'cityName',
        'isActiveForDelivery',
        'province.provinceId',
        'province.provinceName',
        'createdAt',
        'updatedAt',
        'isDeleted',
      ],
    };
    const rawCities = await this.citiesRepo.fetch(where, options);
    if (!rawCities.success) {
      return AppResponse.Err('No cities found') as AppResponse<Partial<City>[]>;
    }
    return AppResponse.fromDataLayer(rawCities) as AppResponse<Partial<City>[]>;
  }

  async isCityActiveForDelivery(cityName: string) {
    if (!cityName) {
      return AppResponse.Err('City name is required') as AppResponse<Partial<City>[]>;
    }
    const where = { isActiveForDelivery: 1, isDeleted: false, cityName: { $like: `%${cityName}%` } };
    const cities = await this.citiesRepo.fetch(where);
    if (!cities.success) {
      return AppResponse.Err('No cities found') as AppResponse<Partial<City>[]>;
    }
    return AppResponse.fromDataLayer(cities) as AppResponse<Partial<City>[]>;
  }

  async getProvinces(query: PaginationSearchQueryDto): Promise<AppResponse<Partial<Province>[]>> {
    const where: QueryWhere<Province> = {
      isDeleted: false,
    };

    if (query.search) {
      where.provinceName = { $like: `%${query.search}%` };
    }
    const options = { limit: query.size, offset: (query.page - 1) * query.size };
    const provinces = await this.provincesRepo.fetchAndCount(where, options);
    if (!provinces.success) {
      return AppResponse.Err('No provinces found') as AppResponse<Partial<Province>[]>;
    }
    return AppResponse.fromDataLayer(provinces) as AppResponse<Partial<Province>[]>;
  }
}
