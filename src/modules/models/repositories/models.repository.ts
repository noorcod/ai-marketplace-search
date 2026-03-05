import { BaseRepository } from '../../../common/database/base.repository';
import { Model } from '../entities/Model.entity';
import { DatabaseError } from '../../../common/errors/database-error';
import { DataLayerResponse } from '../../../common/responses/data-layer-response';
import { raw } from '@mikro-orm/core';
import { PaginationInfo } from '../../../common/types/pagination.type';
import { Loaded } from '@mikro-orm/mysql';

export class ModelsRepository extends BaseRepository<Model> {
  async fetchAllModels(filterOptions: any, findOptions: any, rawWhere?: string) {
    try {
      const orderByEntries: Array<[string, any]> = Object.entries(findOptions?.orderBy || {});
      const knex = this.em.getKnex();

      const imCte = knex
        .select('images_id', 'model_id', 'img0')
        .select(knex.raw('ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY images_id) as img_row'))
        .from('images');
      const modelCte = knex
        .select('model_id', 'model_name', 'model_title', 'brand_name', 'created_at')
        .select(knex.raw('ROW_NUMBER() OVER (PARTITION BY model_name, brand_name ORDER BY model_name) as variant'))
        .from('model');

      if (rawWhere) {
        // modelCte.where(filterOptions);
        modelCte.whereRaw(rawWhere);
      }

      const query = knex
        .with('im_cte', imCte)
        .with('model_cte', modelCte)
        .select('m.model_id', 'm.model_title', 'm.model_name', 'm.brand_name', 'i.images_id', 'i.img0', 'm.created_at')
        .from({ m: 'model_cte' })
        .innerJoin({ i: 'im_cte' }, 'm.model_id', 'i.model_id')
        .where('i.img_row', 1)
        .andWhere('m.variant', 1)
        .limit(findOptions.limit)
        .offset(findOptions.offset);

      // Apply sorting (supports multiple orderBy fields)
      if (orderByEntries.length > 0) {
        for (const [column, order] of orderByEntries) {
          query.orderBy(column, String(order).toLowerCase() as 'asc' | 'desc');
        }
      } else {
        query.orderBy('m.created_at', 'desc');
      }

      // Stable tie-breaker to prevent reordering between pages
      if (!orderByEntries.some(([c]) => c === 'm.model_id' || c === 'model_id')) {
        query.orderBy('m.model_id', 'desc');
      }

      const countQuery = knex
        .select()
        .from(function () {
          const sub = this.select('model_name', 'brand_name').from('model');
          if (rawWhere) {
            sub.whereRaw(rawWhere);
          } else if (filterOptions && Object.keys(filterOptions).length > 0) {
            sub.where(filterOptions);
          }
          sub.groupBy(['model_name', 'brand_name']).as('subquery');
        })
        .count('* as total_rows');

      let [result, countRows] = await Promise.all([
        this.em.getConnection().execute(query),
        this.em.getConnection().execute(countQuery),
      ]);
      const count = countRows[0]?.total_rows || 0;

      if (result.length === 0) {
        return DataLayerResponse.EmptyPage();
      }

      result = result.map(r => {
        return {
          modelId: r.model_id,
          modelTitle: r.model_title,
          modelName: r.model_name,
          brandName: r.brand_name,
          images: [
            {
              imagesId: r.images_id,
              img0: r.img0,
            },
          ],
          createdAt: r.created_at,
        };
      });

      return DataLayerResponse.OkWithPagination(result, {
        totalItems: count,
        currentPage: findOptions.offset / findOptions.limit + 1,
        perPage: findOptions.limit,
        totalPages: Math.ceil(count / findOptions.limit),
      });
    } catch (e) {
      throw new DatabaseError(e.message);
    }
  }

  async fetchOneFilter(key: keyof Model | string, filterOptions: any, findOptions: any) {
    try {
      let whereClause = {};
      if ((key as string).startsWith('is') || (key as string).startsWith('has')) {
        whereClause = { ...filterOptions };
      } else {
        whereClause = { [key]: { $ne: 'nil' }, ...filterOptions };
      }
      const query = this.em
        .createQueryBuilder(Model)
        .select([key, raw('COUNT(model_id) as count')])
        .where(whereClause)
        .orderBy({ [raw('count(model_id)')]: 'DESC' })
        .groupBy([key]);
      if (findOptions.offset || findOptions.limit) {
        query.offset(findOptions.offset).limit(findOptions.limit);
      }
      const result = await query.execute();
      if (result.length === 0) {
        return DataLayerResponse.NotFound();
      }
      return DataLayerResponse.Ok(result);
    } catch (e) {
      throw new DatabaseError(e.message);
    }
  }

  async fetchAccessoryTypes() {
    try {
      const query = this.em
        .createQueryBuilder(Model)
        .select('accessoryType')
        .where({ accessoryType: { $ne: 'nil' }, isDeleted: false })
        .groupBy('accessoryType')
        .orderBy({ [raw('count(model_id)')]: 'DESC' });
      const result = await query.execute();
      if (result.length === 0) {
        return DataLayerResponse.NotFound();
      }
      return DataLayerResponse.Ok(result);
    } catch (e) {
      throw new DatabaseError(e.message);
    }
  }

  async fetchRelatedModelsUsingCategoryAndBrand(
    model: Loaded<Partial<Model>>,
    findOptions?: { offset: number; limit: number },
  ) {
    try {
      const knex = this.em.getKnex();
      const query = knex
        .with('grouped_models_cte', qb => {
          qb.select(knex.raw('model_name, max(model_id) as model_id'))
            .from('model')
            .where('model_id', '!=', model.modelId)
            .andWhere('category_name', model.categoryName)
            .andWhere('brand_name', model.brandName)
            .groupBy('model_name')
            .orderBy('model_name', 'desc');
        })
        .with('im_cte', qb => {
          qb.select(knex.raw('gm_cte.model_id, MIN(i.images_id) as images_id, MIN(i.img0) as img0'))
            .from('images as i')
            .innerJoin('grouped_models_cte as gm_cte', 'gm_cte.model_id', 'i.model_id')
            .groupBy('gm_cte.model_id');
        })
        .from('model as m')
        .innerJoin('im_cte', 'm.model_id', 'im_cte.model_id')
        .innerJoin('grouped_models_cte', 'm.model_id', 'grouped_models_cte.model_id')
        .orderBy('m.model_name', 'asc');

      // create a clone of query for count
      const countQuery = query.clone().select(knex.raw('count(*) as model_count'));

      let [count, result] = await Promise.all([
        this.em.getConnection().execute(countQuery),
        this.em
          .getConnection()
          .execute(
            query
              .select('m.model_id', 'm.model_name', 'm.brand_name', 'm.model_title', 'm.category_name', 'im_cte.img0')
              .limit(findOptions.limit)
              .offset(findOptions.offset),
          ),
      ]);

      if (result.length === 0) {
        return DataLayerResponse.EmptyPage();
      }
      result = result.map(r => {
        return {
          modelId: r.model_id,
          modelName: r.model_name,
          brandName: r.brand_name,
          modelTitle: r.model_title,
          categoryName: r.category_name,
          images: [
            {
              img0: r.img0,
            },
          ],
        };
      });
      const paginationInfo: PaginationInfo = {
        totalItems: count[0].model_count,
        currentPage: findOptions.offset / findOptions.limit + 1,
        perPage: findOptions.limit,
        totalPages: Math.ceil(count[0].model_count / findOptions.limit),
      };
      return DataLayerResponse.OkWithPagination(result, paginationInfo);
    } catch (e) {
      throw new DatabaseError(e.message);
    }
  }

  async fetchModelVariants(model: Loaded<Partial<Model>>) {
    try {
      const query = this.em
        .createQueryBuilder(Model, 'm')
        .select(['m.modelId', 'm.modelTitle'])
        .where({ 'm.isDeleted': false, 'm.brandName': model.brandName, 'm.modelName': model.modelName });

      const result = await query.execute();
      if (result.length === 0) {
        return DataLayerResponse.NotFound();
      }
      return DataLayerResponse.Ok(result);
    } catch (e) {
      throw new DatabaseError(e.message);
    }
  }
}
