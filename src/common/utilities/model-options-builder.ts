import { Model } from '../../modules/models/entities/Model.entity';
import { FilterQuery, QueryOrder } from '@mikro-orm/mysql';
import { FindOptions } from '@mikro-orm/core/drivers/IDatabaseDriver';
import { PaginationOptions } from './pagination-options';
import { ModelOptions } from '../types/modelOptions.type';

export class ModelOptionsBuilder {
  private filterQuery: FilterQuery<Model> = {};
  private findOptions: FindOptions<Model> = {};
  private rawWhereClause: string = '';

  private allowedOrderFields = [
    'modelId',
    'modelTitle',
    'modelName',
    'brandName',
    'createdAt',
    'launchPrice',
    'releaseDate',
  ];

  constructor(
    private category: string,
    private mappings?: Record<string, string>,
  ) {
    const categoryName = this.mappings ? this.mappings['categoryName'] : 'categoryName';
    this.filterQuery = { [categoryName]: category };
  }

  public setSort(sort: string): this {
    const fallBackKey = this.mappings ? this.mappings['createdAt'] : 'createdAt';
    if (!sort || sort.length === 0) {
      this.findOptions.orderBy = { [fallBackKey]: QueryOrder.DESC };
      return this;
    }

    const normalized = sort.toLowerCase().trim().replace(/-/g, '_');
    const orderByFields: Array<{ field: string; direction: QueryOrder }> = [];

    const addOrderBy = (field: string, direction: QueryOrder) => {
      if (!this.allowedOrderFields.includes(field)) return;
      const mappedField = this.mappings ? this.mappings[field] : field;
      orderByFields.push({ field: mappedField, direction });
    };

    switch (normalized) {
      case 'newest':
        addOrderBy('createdAt', QueryOrder.DESC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'oldest':
        addOrderBy('createdAt', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.ASC);
        break;
      case 'alphabetical':
        addOrderBy('brandName', QueryOrder.ASC);
        addOrderBy('modelName', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'model_name_asc':
        addOrderBy('modelName', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'model_name_desc':
        addOrderBy('modelName', QueryOrder.DESC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'brand_name_asc':
        addOrderBy('brandName', QueryOrder.ASC);
        addOrderBy('modelName', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'brand_name_desc':
        addOrderBy('brandName', QueryOrder.DESC);
        addOrderBy('modelName', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'model_title_asc':
        addOrderBy('modelTitle', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'model_title_desc':
        addOrderBy('modelTitle', QueryOrder.DESC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'launch_price_asc':
        addOrderBy('launchPrice', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'launch_price_desc':
        addOrderBy('launchPrice', QueryOrder.DESC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'release_date_asc':
        addOrderBy('releaseDate', QueryOrder.ASC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      case 'release_date_desc':
        addOrderBy('releaseDate', QueryOrder.DESC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
      default:
        addOrderBy('createdAt', QueryOrder.DESC);
        addOrderBy('modelId', QueryOrder.DESC);
        break;
    }

    if (orderByFields.length === 0) {
      this.findOptions.orderBy = { [fallBackKey]: QueryOrder.DESC };
      return this;
    }

    // Maintain insertion order (important for multi-field sort priority)
    this.findOptions.orderBy = Object.fromEntries(orderByFields.map(o => [o.field, o.direction]));
    return this;
  }

  public setPagination(options: PaginationOptions): this {
    this.findOptions.limit = options.limit();
    this.findOptions.offset = options.offset();
    return this;
  }

  public setWhereClause(filters: { [key: string]: string | boolean | string[] }): this {
    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        const mappedKey = this.mappings ? this.mappings[key] : key;
        if (key.startsWith('is') || key.startsWith('has')) {
          // Handle boolean values
          let boolValue: boolean;
          if (typeof value === 'boolean') {
            boolValue = value;
          } else if (typeof value === 'string') {
            if (value.length === 1) {
              boolValue = Boolean(Number(value));
            } else {
              boolValue = value === 'true';
            }
          }
          Object.assign(this.filterQuery, { [mappedKey]: boolValue });
        } else {
          // Handle string values
          if (typeof value === 'string') {
            if (value.includes(',')) {
              Object.assign(this.filterQuery, { [mappedKey]: { $in: value.split(',') } });
            } else {
              Object.assign(this.filterQuery, { [mappedKey]: value });
            }
          } else if (Array.isArray(value)) {
            Object.assign(this.filterQuery, { [mappedKey]: { $in: value } });
          }
        }
      }
    }
    return this;
  }

  setRawWhereClause(filters: { [key: string]: string | boolean | string[] }): this {
    const conditions = [];
    conditions.push(`category_name = '${this.category}'`);
    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        const mappedKey = this.mappings ? this.mappings[key] : key;
        if (key.startsWith('is') || key.startsWith('has')) {
          // Handle boolean values
          let boolValue: boolean;
          if (typeof value === 'boolean') {
            boolValue = value;
          } else if (typeof value === 'string') {
            if (value.length === 1) {
              boolValue = Boolean(Number(value));
            } else {
              boolValue = value === 'true';
            }
          }
          conditions.push(`${mappedKey} = ${boolValue}`);
        } else {
          // Handle string values
          if (typeof value === 'string') {
            if (value.includes(',')) {
              conditions.push(
                `${mappedKey} IN (${value
                  .split(',')
                  .map(v => `'${v}'`)
                  .join(',')})`,
              );
            } else {
              conditions.push(`${mappedKey} = '${value}'`);
            }
          } else if (Array.isArray(value)) {
            conditions.push(`${mappedKey} IN (${value.map(v => `'${v}'`).join(',')})`);
          }
        }
      }
      const whereClause = conditions.join(' AND ');
      this.rawWhereClause = whereClause;
    } else {
      this.rawWhereClause = `category_name = '${this.category}'`;
    }
    return this;
  }

  public setSearch(search: string): this {
    const term = (search || '').trim();
    if (term.length > 0) {
      // ORM where: use LIKE (case-insensitive handled by DB collation)
      Object.assign(this.filterQuery, { modelTitle: { $like: `%${term}%` } });

      // Raw WHERE: use LOWER(model_title) LIKE '%term%'
      const safe = term.toLowerCase().replace(/'/g, "''");
      const like = `%${safe}%`;
      if (this.rawWhereClause.length > 0) {
        this.rawWhereClause += ` AND LOWER(model_title) LIKE '${like}'`;
      } else {
        this.rawWhereClause = `LOWER(model_title) LIKE '${like}'`;
      }
    }
    return this;
  }

  public build(): ModelOptions<Model> {
    if (this.rawWhereClause.length > 0) {
      return { where: this.filterQuery, options: this.findOptions, rawWhere: this.rawWhereClause };
    }
    return { where: this.filterQuery, options: this.findOptions };
  }
}
