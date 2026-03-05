import { BaseRepository } from 'src/common/database/base.repository';
import { Categories } from '../entities/categories.entity';
import { DataLayerResponse } from 'src/common/responses/data-layer-response';

export class CategoriesRepository extends BaseRepository<Categories> {
  async fetchListedCategories() {
    try {
      const knex = this.em.getKnex();
      const result = await knex
        .select(['l.category_name as label', 'l.category_id as id', knex.raw('1 as has_items')])
        .from({ l: 'listing' })
        .whereNotNull('l.activation_date')
        .whereNotNull('l.category_id')
        .whereNotNull('l.category_name')
        .where('l.is_deleted', 0)
        .distinct();

      if (result.length === 0) {
        return DataLayerResponse.NotFound();
      }
      return DataLayerResponse.Ok(result);
    } catch (e) {
      return DataLayerResponse.GenericError({ code: 'CATEGORIES_FETCH_ERROR', message: e.message, details: null });
    }
  }
}
