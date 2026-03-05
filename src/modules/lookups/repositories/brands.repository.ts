import { BaseRepository } from 'src/common/database/base.repository';
import { Brand } from '../entities/brand.entity';
import { PaginationInfo } from 'src/common/types/pagination.type';
import { BrandQueryDto, TopBrand } from '../dtos/brands.dto';
import { determineRawWhereClause } from 'src/common/utilities/determine-category';
import { DataLayerResponse } from 'src/common/responses/data-layer-response';
import { HttpStatus } from '@nestjs/common';

export class BrandsRepository extends BaseRepository<Brand> {
  async fetchListedBrandsByCategory(query: BrandQueryDto) {
    try {
      const knex = this.em.getConnection().getKnex();
      const { size: limit, page: currentPage } = query || {};
      const offset = (currentPage - 1) * limit;
      const subQuery = knex
        .select('l.brand_name as label', 'l.brand_id as id')
        .from('listing as l')
        .whereNotNull('l.activation_date')
        .as('lb');
      const brandQuery = knex('brand as b')
        .distinct('b.id', 'b.label')
        .select(knex.raw('IF(lb.id IS NULL, 0, 1) AS has_items'))
        .leftJoin(subQuery, 'b.id', 'lb.id')
        .where('b.is_deleted', 0)
        .orderBy([
          { column: 'has_items', order: 'desc' },
          { column: 'b.label', order: 'asc' },
        ]);
      if (offset && limit) {
        brandQuery.offset(offset).limit(limit);
      }
      const countQuery = knex('brand as b')
        .leftJoin(subQuery, 'b.id', 'lb.id')
        .where('b.is_deleted', 0)
        .countDistinct('b.id as total');
      if (query.search) {
        brandQuery.andWhereILike('b.label', `%${query.search}%`);
        countQuery.andWhereILike('b.label', `%${query.search}%`);
      }
      if (query.categoryId) {
        const rawWhereClause = determineRawWhereClause(query.categoryId);
        if (!rawWhereClause) {
          return DataLayerResponse.GenericError(
            { message: 'Invalid category id', code: 'INVALID_CATEGORY_ID' },
            HttpStatus.BAD_REQUEST,
          );
        }
        brandQuery.andWhereRaw(rawWhereClause);
        countQuery.andWhereRaw(rawWhereClause);
      }
      const result = await brandQuery;
      const countQueryResult = await countQuery;
      if (result.length === 0) {
        return DataLayerResponse.EmptyPage();
      }
      const count = Number(countQueryResult[0].total);
      const paginationInfo: PaginationInfo = {
        totalItems: count,
        currentPage: offset / limit + 1,
        perPage: limit,
        totalPages: Math.ceil(count / limit),
      };
      return DataLayerResponse.OkWithPagination(result, paginationInfo);
    } catch (error) {
      return DataLayerResponse.GenericError(error.message);
    }
  }

  async fetchBrandsForNav() {
    try {
      const knex = this.em.getConnection().getKnex();
      const result = await knex.select('*').from('v_nav_brands');
      if (result.length === 0) {
        return DataLayerResponse.EmptyPage();
      }
      const response = {};
      result.map(
        (row: { brand_id: number; brand: string; total_listings: number; category: string; category_id: number }) => {
          const brand = {
            id: row.brand_id,
            label: row.brand,
            total_listings: row.total_listings,
          };
          if (response[row.category_id]) {
            response[row.category_id].brands.push(brand);
          } else {
            response[row.category_id] = {
              id: row.category_id,
              label: row.category,
              brands: [brand],
            };
          }
        },
      );
      return DataLayerResponse.Ok(response);
    } catch (error) {
      return DataLayerResponse.GenericError(error.message);
    }
  }

  async fetchTop10ListedBrands() {
    try {
      const knex = this.em.getConnection().getKnex();
      const result = await knex.select('*').from('top_10_listed_brands');
      if (result.length === 0) {
        return DataLayerResponse.EmptyPage();
      }
      const categoryWiseBrands = {};
      result.map((row: TopBrand) => {
        if (!categoryWiseBrands[row.category_id]) {
          categoryWiseBrands[row.category_id] = {
            category: row.category,
            category_id: row.category_id,
            brands: [
              {
                id: row.id,
                label: row.label,
                count: row.total_listings,
                logo: row.logo,
              },
            ],
          };
        } else {
          categoryWiseBrands[row.category_id].brands.push({
            id: row.id,
            label: row.label,
            count: row.total_listings,
            logo: row.logo,
          });
        }
      });
      return DataLayerResponse.Ok(categoryWiseBrands);
    } catch (error) {
      return DataLayerResponse.GenericError(error.message);
    }
  }
}
