import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { BrandsRepository } from './repositories/brands.repository';
import { AppResponse } from 'src/common/responses/app-response';
import { Brand } from './entities/brand.entity';
import { BrandQueryDto } from './dtos/brands.dto';
import { determineCategoryWhereClause } from 'src/common/utilities/determine-category';
import { QueryOptions, QueryWhere } from 'src/common/interfaces/repository.interface';
@Injectable()
export class BrandsService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: BrandsRepository,
  ) {}

  async fetchAllBrands(query: BrandQueryDto): Promise<AppResponse<Partial<Brand>[]>> {
    const where: QueryWhere<Brand> = {
      isDeleted: false,
    };
    if (query.search) {
      where.label = { $like: `%${query.search}%` };
    }
    if (query.categoryId) {
      const dynamicClause = determineCategoryWhereClause(query.categoryId);
      where[dynamicClause.key] = dynamicClause.value;
    }

    const options: QueryOptions<Brand> = {
      limit: query.size,
      offset: (query.page - 1) * query.size,
      orderBy: { label: 'ASC' },
      fields: ['id', 'label'],
    };
    const brands = await this.repo.fetch(where, options);
    if (!brands.success) {
      return AppResponse.Err('No categories found') as AppResponse<Partial<Brand>[]>;
    }
    return AppResponse.fromDataLayer(brands) as AppResponse<Partial<Brand>[]>;
  }
  async fetchListedBrandsByCategory(query: BrandQueryDto): Promise<AppResponse<Partial<Brand>[]>> {
    const brands = await this.repo.fetchListedBrandsByCategory(query);
    if (!brands.success) {
      return AppResponse.Err(brands.message) as AppResponse<Partial<Brand>[]>;
    }
    return AppResponse.fromDataLayer(brands) as AppResponse<Partial<Brand>[]>;
  }

  async fetchListedBrandsForAllCategories(): Promise<AppResponse<Partial<Brand>[]>> {
    const brands = await this.repo.fetchBrandsForNav();
    if (!brands.success) {
      return AppResponse.Err(brands.message) as AppResponse<Partial<Brand>[]>;
    }
    return AppResponse.fromDataLayer(brands) as AppResponse<Partial<Brand>[]>;
  }

  async fetchTop10ListedBrands(): Promise<AppResponse<Partial<Brand>[]>> {
    const brands = await this.repo.fetchTop10ListedBrands();
    if (!brands.success) {
      return AppResponse.Err(brands.message) as AppResponse<Partial<Brand>[]>;
    }
    return AppResponse.fromDataLayer(brands) as AppResponse<Partial<Brand>[]>;
  }
}
