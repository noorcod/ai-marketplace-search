import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AppResponse } from 'src/common/responses/app-response';
import { Categories } from './entities/categories.entity';
import { CategoriesRepository } from './repositories/categories.repository';
import { PaginationSearchQueryDto } from 'src/common/dtos/pagination-search-query.dto';
import { QueryOptions } from 'src/common/interfaces/repository.interface';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly categoriesRepo: CategoriesRepository,
  ) {}

  async fetchAllCategories(query: PaginationSearchQueryDto): Promise<AppResponse<Partial<Categories>[]>> {
    const where: QueryOptions<Categories> = {
      isDeleted: false,
    };
    if (query.search) {
      where.label = { $like: `%${query.search}%` };
    }
    const options = { limit: query.size, offset: (query.page - 1) * query.size };
    const categories = await this.categoriesRepo.fetch(where, options);
    if (!categories.success) {
      return AppResponse.Err('No categories found') as AppResponse<Partial<Categories>[]>;
    }
    return AppResponse.fromDataLayer(categories) as AppResponse<Partial<Categories>[]>;
  }

  async fetchListedCategories() {
    const categories = await this.categoriesRepo.fetchListedCategories();
    if (!categories.success) {
      return AppResponse.Err('No Categories found') as AppResponse<Partial<Categories>[]>;
    }
    return AppResponse.fromDataLayer(categories) as AppResponse<Partial<Categories>[]>;
  }
}
