import { DataLayerResponse } from '../responses/data-layer-response';

// Repository interface abstractions to decouple from MikroORM-specific types

export interface QueryWhere<T = any> {
  [key: string]: any;
}

export interface QueryOptions<T = any> {
  limit?: number;
  offset?: number;
  /**
   * Ordering options for query results. Supports multiple formats for compatibility with
   * EntityManager, QueryBuilder, and Knex query methods:
   * - Object format: { field1: 'ASC', field2: 'DESC' }
   * - Array of objects: [{ field1: 'ASC' }, { field2: 'DESC' }]
   * - Array of tuples: [['field1', 'ASC'], ['field2', 'DESC']]
   * - String format: 'field1 ASC, field2 DESC' (Knex style)
   * - Numeric values: Can use 1 (ascending) or -1 (descending) instead of strings
   * - Nested object format for populated relations: { relation: { field: 'ASC' } }
   */
  orderBy?:
    | Record<string, 'ASC' | 'DESC' | 1 | -1 | Record<string, 'ASC' | 'DESC' | 1 | -1>>
    | Record<string, 'ASC' | 'DESC' | 1 | -1 | Record<string, 'ASC' | 'DESC' | 1 | -1>>[];
  // | Array<[string, 'ASC' | 'DESC' | 1 | -1]>
  // | string;
  fields?: (keyof T)[] | string[]; // Select specific fields
  exclude?: (keyof T)[] | string[]; // Exclude specific fields
  populate?: string[] | Record<string, boolean | QueryOptions<any>>;

  /**
   * Filter populated relations with WHERE conditions (applies to populated entities only).
   * This creates an INNER JOIN relationship, meaning root entities will be returned but
   * the populated collection will only include items matching the condition.
   *
   * Example: { orders: { status: 'completed' } } - Only populate completed orders
   */
  populateWhere?: Record<string, any>;

  /**
   * Filter populated relations (similar to populateWhere), but creates a LEFT JOIN relationship.
   * This is used for implementing filters on related entities without affecting root entity selection.
   *
   * Example: { orders: { totalAmount: { $gt: 1000 } } } - Only populate orders > $1000
   */
  populateFilter?: Record<string, any>;

  /**
   * Specify ordering for populated relationships, separate from the main entity ordering.
   *
   * Example: { orders: { createdAt: 'DESC' } } - Sort each user's orders by date
   */
  populateOrderBy?: Record<string, 'ASC' | 'DESC' | 1 | -1> | Record<string, 'ASC' | 'DESC' | 1 | -1>[];

  [key: string]: any;
}

export interface FindOneOptions<T = any> extends Omit<QueryOptions<T>, 'limit' | 'offset'> {
  // Specific options for findOne
}

export interface FindAllOptions<T = any> extends QueryOptions<T> {
  // Specific options for findAll
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface OrderBy {
  [field: string]: 'ASC' | 'DESC';
}

// Generic repository interface
export interface IRepository<T> {
  findOne(where: QueryWhere<T>, options?: FindOneOptions<T>): Promise<T | null>;
  findAll(options?: FindAllOptions<T>): Promise<T[]>;
  find(where: QueryWhere<T>, options?: QueryOptions<T>): Promise<T[]>;
  count(where: QueryWhere<T>, options?: Omit<QueryOptions<T>, 'limit' | 'offset'>): Promise<number>;
  findAndCount(where: QueryWhere<T>, options?: QueryOptions<T>): Promise<[T[], number]>;
}

// Abstract repository methods with our custom response types
export interface IBaseRepository<T> {
  // Read operations
  fetchOne<TResult = T>(where: QueryWhere<T>, options?: FindOneOptions<T>): Promise<DataLayerResponse<TResult | null>>;

  fetchAll<TResult = T>(options?: FindAllOptions<T>): Promise<DataLayerResponse<TResult[]>>;

  fetch<TResult = T>(where: QueryWhere<T>, options?: QueryOptions<T>): Promise<DataLayerResponse<TResult[]>>;

  fetchAndCount<TResult = T>(where: QueryWhere<T>, options?: QueryOptions<T>): Promise<DataLayerResponse<TResult[]>>;

  // CRUD operations
  createEntity<TResult = T>(entityData: Partial<T>): Promise<DataLayerResponse<TResult>>;

  updateEntity<TResult = T>(where: QueryWhere<T>, updateData: Partial<T>): Promise<DataLayerResponse<TResult | null>>;

  deleteEntity(where: QueryWhere<T>): Promise<DataLayerResponse<null>>;

  // Utility operations
  exists(where: QueryWhere<T>): Promise<DataLayerResponse<boolean>>;
  countEntities(
    where: QueryWhere<T>,
    options?: Omit<QueryOptions<T>, 'limit' | 'offset'>,
  ): Promise<DataLayerResponse<number>>;

  // Field selection convenience methods
  fetchOneFields<TResult = Partial<T>>(
    where: QueryWhere<T>,
    fields: (keyof T)[],
    options?: Omit<FindOneOptions<T>, 'fields'>,
  ): Promise<DataLayerResponse<TResult | null>>;

  fetchOneExclude<TResult = Partial<T>>(
    where: QueryWhere<T>,
    exclude: (keyof T)[],
    options?: Omit<FindOneOptions<T>, 'exclude'>,
  ): Promise<DataLayerResponse<TResult | null>>;

  fetchFields<TResult = Partial<T>>(
    where: QueryWhere<T>,
    fields: (keyof T)[],
    options?: Omit<QueryOptions<T>, 'fields'>,
  ): Promise<DataLayerResponse<TResult[]>>;

  fetchExclude<TResult = Partial<T>>(
    where: QueryWhere<T>,
    exclude: (keyof T)[],
    options?: Omit<QueryOptions<T>, 'exclude'>,
  ): Promise<DataLayerResponse<TResult[]>>;

  fetchAllFields<TResult = Partial<T>>(
    fields: (keyof T)[],
    options?: Omit<FindAllOptions<T>, 'fields'>,
  ): Promise<DataLayerResponse<TResult[]>>;

  fetchAllExclude<TResult = Partial<T>>(
    exclude: (keyof T)[],
    options?: Omit<FindAllOptions<T>, 'exclude'>,
  ): Promise<DataLayerResponse<TResult[]>>;
}
