import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AppResponse } from 'src/common/responses/app-response';
import { Condition } from './entities/condition.entity';
import { ConditionsRepository } from './repositories/conditions.repository';
import { PaginationSearchQueryDto } from 'src/common/dtos/pagination-search-query.dto';
import { QueryOptions } from 'src/common/interfaces/repository.interface';
@Injectable()
export class ConditionsService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
  ) {}

  async fetchAllConditions(query: PaginationSearchQueryDto): Promise<AppResponse<Partial<Condition>[]>> {
    const where: QueryOptions<Condition> = {
      isDeleted: false,
    };
    if (query.search) {
      where.label = { $like: `%${query.search}%` };
    }
    const options = { limit: query.size, offset: (query.page - 1) * query.size };
    const conditions = await this.conditionsRepo.fetch(where, options);
    if (!conditions.success) {
      return AppResponse.Err('No conditions found') as AppResponse<Partial<Condition>[]>;
    }
    return AppResponse.fromDataLayer(conditions) as AppResponse<Partial<Condition>[]>;
  }
}
