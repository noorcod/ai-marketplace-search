import { EntityRepository, FilterQuery as MikroFilterQuery } from '@mikro-orm/mysql';
import {
  FindAllOptions as MikroFindAllOptions,
  FindOneOptions as MikroFindOneOptions,
  FindOptions as MikroFindOptions,
} from '@mikro-orm/core/drivers/IDatabaseDriver';
import { DataLayerResponse } from '../responses/data-layer-response';
import { PaginatedResponse } from '../responses/paginated-response';
import { PaginationInfo } from '../types/pagination.type';
import { HttpStatus } from '@nestjs/common';
import { DatabaseError, DatabaseValidationError } from '../errors/database-error';
import {
  FindAllOptions,
  FindOneOptions,
  IBaseRepository,
  QueryOptions,
  QueryWhere,
} from '../interfaces/repository.interface';

export abstract class BaseRepository<T extends object> extends EntityRepository<T> implements IBaseRepository<T> {
  /**
   * Centralized error handling for database operations
   * @param error - The caught error
   * @param operation - Description of the operation that failed
   * @returns Appropriate DataLayerResponse based on error type
   */
  private handleDatabaseError(error: any, operation: string): DataLayerResponse<null> {
    // Log the error for debugging (you might want to use a proper logger)
    console.error(`Database error in ${operation}:`, error);

    // Handle specific MikroORM/Database errors
    if (error.name === 'ValidationError') {
      return DataLayerResponse.GenericError(
        {
          code: 'DATABASE_VALIDATION_ERROR',
          message: `Validation failed during ${operation}: ${error.message}`,
          details: { operation, originalError: error.name },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (error.name === 'ConnectionError' || error.code === 'ECONNREFUSED') {
      return DataLayerResponse.GenericError(
        {
          code: 'DATABASE_CONNECTION_ERROR',
          message: `Connection failed during ${operation}: ${error.message}`,
          details: { operation, originalError: error.name },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (error.name === 'QueryFailedError' || error.name === 'DriverException') {
      return DataLayerResponse.GenericError(
        {
          code: 'DATABASE_QUERY_ERROR',
          message: `Query failed during ${operation}: ${error.message}`,
          details: { operation, originalError: error.name },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Handle custom DatabaseError instances
    if (error instanceof DatabaseError) {
      return DataLayerResponse.GenericError(
        {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: { operation, statusCode: error.statusCode },
        },
        error.statusCode,
      );
    }

    // Default case - generic database error
    return DataLayerResponse.GenericError(
      {
        code: 'UNKNOWN_DATABASE_ERROR',
        message: `Unexpected error during ${operation}: ${error.message || 'Unknown error'}`,
        details: { operation, originalError: error.name || 'Unknown' },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Centralized error handling for paginated operations
   * @param error - The caught error
   * @param operation - Description of the operation that failed
   * @returns PaginatedResponse with error details
   */
  private handlePaginatedError(error: any, operation: string): PaginatedResponse<never> {
    console.error(`Paginated operation error in ${operation}:`, error);

    if (error instanceof DatabaseError) {
      return PaginatedResponse.GenericError(`${operation} failed: ${error.message}`);
    }

    return PaginatedResponse.GenericError(`${operation} failed: ${error.message || 'Unknown error'}`);
  }

  /**
   * Adapter method to convert generic QueryWhere to MikroORM FilterQuery
   */
  private adaptToMikroWhere(where: QueryWhere<T>): MikroFilterQuery<T> {
    try {
      return where as MikroFilterQuery<T>;
    } catch (error) {
      throw new DatabaseValidationError('Invalid where clause format');
    }
  } /**
   * Adapter method to convert generic options to MikroORM options
   */
  private adaptToMikroOptions<TOptions extends QueryOptions<T>>(options?: TOptions): any {
    if (!options) return undefined;

    try {
      // Start with a clean options object excluding field selection properties
      const { fields, exclude, ...cleanOptions } = options;
      const mikroOptions: any = { ...cleanOptions };

      // Process field selection - MikroORM only allows one of fields/exclude
      if (fields || exclude) {
        const populate = options?.populate ? options.populate : [];
        mikroOptions.fields = this.processFieldSelection(fields, exclude, populate);
      } // Handle orderBy conversion if needed
      if (options.orderBy) {
        mikroOptions.orderBy = options.orderBy;
      }

      // Handle populate conversion - convert string[] to proper MikroORM populate format
      if (options.populate) {
        mikroOptions.populate = this.processPopulateOptions(options.populate);
      }

      // Process MikroORM's specific populate filtering and ordering options
      if (options.populateWhere) {
        mikroOptions.populateWhere = options.populateWhere;
      }

      if (options.populateFilter) {
        mikroOptions.populateFilter = options.populateFilter;
      }

      if (options.populateOrderBy) {
        mikroOptions.populateOrderBy = options.populateOrderBy;
      }

      return mikroOptions;
    } catch (error) {
      throw new DatabaseValidationError('Invalid query options format');
    }
  }

  /**
   * Builds nested populate structure from a flat list of dot-notated fields.
   * Ensures relations are only fully populated if subfields are explicitly included.
   */
  private buildPopulateFromFields(fields: string[]): (string | Record<string, any>)[] {
    const root: Record<string, any> = {};

    for (const path of fields) {
      const parts = path.split('.');
      let curr = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i === parts.length - 1) {
          // mark leaf node with true
          curr[part] = true;
        } else {
          curr[part] ||= {};
          curr = curr[part];
        }
      }
    }

    return this.flattenPopulateTree(root);
  }

  private flattenPopulateTree(tree: Record<string, any>): (string | Record<string, any>)[] {
    const result: (string | Record<string, any>)[] = [];

    for (const [key, value] of Object.entries(tree)) {
      if (value === true) {
        result.push(key); // simple scalar or relation id only
      } else {
        const children = this.flattenPopulateTree(value);
        if (children.length > 0) {
          result.push(...children.map(e => `${key}.${e}`));
        } else {
          result.push(key); // relation with no explicit subfields — populate id only
        }
      }
    }

    return result;
  }

  /**
   * Recursively builds `populate` object by excluding specified fields.
   *
   * @param entityName - Root entity name
   * @param excludeSet - Set of excluded dot-notated paths
   * @param prefix - Internal use for recursive path tracking
   */
  private buildAllPopulatesExcluding(
    entityName: string,
    excludeSet: Set<string>,
    path = '',
    populate?: Set<string>,
  ): (string | Record<string, any>)[] {
    const meta = this.em.getMetadata().get(entityName);
    const result: (string | Record<string, any>)[] = [];

    for (const prop of meta.props) {
      const currentPath = path ? `${path}.${prop.name}` : prop.name;

      // Skip excluded fields
      if (excludeSet.has(currentPath)) continue;

      const isRelation = prop.kind !== 'scalar' && prop.kind !== 'embedded';

      if (!isRelation) {
        result.push(prop.name);
      } else {
        // Check if nested exclusion exists
        const hasNestedExclusion = Array.from(excludeSet).some(e => e.startsWith(`${currentPath}.`));

        if (hasNestedExclusion) {
          const nested = this.buildAllPopulatesExcluding(prop.type, excludeSet, currentPath, populate);
          if (nested.length > 0) {
            result.push(...nested.map(e => `${prop.name}.${e}`));
          }
        } else {
          const hasNested = populate.has(currentPath)
            ? true
            : Array.from(populate).some(e => e.startsWith(`${currentPath}.`));
          if (hasNested) {
            const nested = this.buildAllPopulatesExcluding(prop.type, excludeSet, currentPath, populate);
            if (nested.length > 0) {
              result.push(...nested.map(e => `${prop.name}.${e}`));
            }
          } else {
            result.push(prop.name);
          }
        }
      }
    }

    return result;
  }

  /**
   * Processes field inclusion or exclusion to build MikroORM populate structure.
   *
   * @param fields - Optional list of fields to include (dot notation supported)
   * @param exclude - Optional list of fields to exclude (dot notation supported)
   * @returns Object with MikroORM-compliant populate array (or undefined)
   */
  private processFieldSelection(
    fields?: (keyof T)[] | string[],
    exclude?: (keyof T)[] | string[],
    populate?: string[] | Record<string, boolean | QueryOptions<any>>,
  ): (string | Record<string, any>)[] | undefined {
    if (fields && fields.length > 0) {
      const normalized = fields.map(f => String(f));
      return this.buildPopulateFromFields(normalized);
    }

    if (exclude && exclude.length > 0) {
      try {
        const excludeSet = new Set(exclude.map(f => String(f)));
        const populateSet =
          populate && Array.isArray(populate) ? new Set(populate.map(f => String(f))) : new Set<string>();
        const entityName = this.getEntityName();
        const populated = this.buildAllPopulatesExcluding(entityName, excludeSet, '', populateSet);
        return populated;
      } catch (error) {
        console.error('Error processing exclude fields:', error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Process populate options for better type safety and flexibility
   */
  private processPopulateOptions(populate: string[] | Record<string, boolean | QueryOptions<any>>): any {
    if (Array.isArray(populate)) {
      return populate;
    }

    // Handle object-style populate with nested options
    const processedPopulate: any[] = [];

    Object.entries(populate).forEach(([relation, options]) => {
      if (typeof options === 'boolean') {
        if (options) {
          processedPopulate.push(relation);
        }
      } else if (typeof options === 'object') {
        // Handle nested populate options
        const nestedPopulate: any = { [relation]: true };
        if (options.fields) {
          nestedPopulate[relation] = { fields: options.fields };
        }
        processedPopulate.push(nestedPopulate);
      }
    });

    return processedPopulate;
  }
  /**
   * Adapter method specifically for count options (excludes limit/offset and fields)
   */
  /**
   * Adapter method specifically for count options (excludes limit/offset and fields)
   */
  private adaptToMikroCountOptions(options?: Omit<QueryOptions<T>, 'limit' | 'offset'>): any {
    if (!options) return undefined;

    try {
      // Start with a clean options object excluding field selection properties
      const { fields, exclude, ...cleanOptions } = options;
      const mikroOptions: any = {};

      // Only include allowed count options (exclude fields/exclude for count operations)
      if (cleanOptions.orderBy) {
        mikroOptions.orderBy = cleanOptions.orderBy;
      }

      if (cleanOptions.populate) {
        mikroOptions.populate = this.processPopulateOptions(cleanOptions.populate);
      }

      // Include any other non-pagination and non-field-selection options
      Object.keys(cleanOptions).forEach(key => {
        if (!['limit', 'offset'].includes(key) && !mikroOptions[key]) {
          mikroOptions[key] = (cleanOptions as any)[key];
        }
      });

      return mikroOptions;
    } catch (error) {
      throw new DatabaseValidationError('Invalid count options format');
    }
  }
  /**
   * Fetch a single entity with standardized response
   * @param where - Query conditions
   * @param options - Query options (fields, populate, etc.)
   * @returns DataLayerResponse with single entity or null
   */
  async fetchOne<TResult = T>(
    where: QueryWhere<T>,
    options?: FindOneOptions<T>,
  ): Promise<DataLayerResponse<TResult | null>> {
    try {
      const mikroOptions = this.adaptToMikroOptions(options) as MikroFindOneOptions<T>;
      const mikroWhere = this.adaptToMikroWhere(where);

      const result = await this.findOne(mikroWhere, mikroOptions);
      return result ? DataLayerResponse.Ok(result as TResult) : DataLayerResponse.NotFound();
    } catch (error) {
      return this.handleDatabaseError(error, 'fetchOne');
    }
  }

  /**
   * Fetch all entities with standardized response
   * @param options - Query options (fields, populate, etc.)
   * @returns DataLayerResponse with array of entities
   */
  async fetchAll<TResult = T>(options?: FindAllOptions<T>): Promise<DataLayerResponse<TResult[]>> {
    try {
      const mikroOptions = this.adaptToMikroOptions(options) as MikroFindAllOptions<T>;
      const result = await this.findAll(mikroOptions);
      return result.length ? DataLayerResponse.Ok(result as TResult[]) : DataLayerResponse.EmptyPage<TResult>();
    } catch (error) {
      return this.handleDatabaseError(error, 'fetchAll');
    }
  } /**
   * Fetch entities with pagination using DataLayerResponse for consistency
   * @param where - Query conditions
   * @param options - Query options including pagination
   * @returns DataLayerResponse with entities and pagination info
   */
  async fetch<TResult = T>(where: QueryWhere<T>, options?: QueryOptions<T>): Promise<DataLayerResponse<TResult[]>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const mikroOptions = this.adaptToMikroOptions(options) as MikroFindOptions<T>;

      const result = await this.find(mikroWhere, mikroOptions);
      const { limit, offset, ...optionsWithoutPagination } = options || {};
      const countOptions = this.adaptToMikroCountOptions(optionsWithoutPagination);
      const count = await this.count(mikroWhere, countOptions);

      if (!result.length) {
        return DataLayerResponse.EmptyPage<TResult>();
      }

      const paginationInfo: PaginationInfo = {
        totalItems: count,
        currentPage: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
        perPage: limit || 10,
        totalPages: Math.ceil(count / (limit || 10)),
      };

      return DataLayerResponse.OkWithPagination(result as TResult[], paginationInfo);
    } catch (error) {
      return this.handleDatabaseError(error, 'fetch');
    }
  }

  /**
   * Fetch entities without count and pagination info
   * @param where - Query conditions
   * @param options - Query options
   * @returns DataLayerResponse with entities
   */
  async fetchSimple<TResult = T>(
    where: QueryWhere<T>,
    options?: QueryOptions<T>,
  ): Promise<DataLayerResponse<TResult[]>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const mikroOptions = this.adaptToMikroOptions(options) as MikroFindOptions<T>;

      const result = await this.find(mikroWhere, mikroOptions);
      return result.length ? DataLayerResponse.Ok(result as TResult[]) : DataLayerResponse.EmptyPage<TResult>();
    } catch (error) {
      return this.handleDatabaseError(error, 'fetchSimple');
    }
  }

  /**
   * Fetch entities and count with pagination using findAndCount for better performance
   * @param where - Query conditions
   * @param options - Query options including pagination
   * @returns DataLayerResponse with entities and pagination info
   */
  async fetchAndCount<TResult = T>(
    where: QueryWhere<T>,
    options?: QueryOptions<T>,
  ): Promise<DataLayerResponse<TResult[]>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const mikroOptions = this.adaptToMikroOptions(options) as MikroFindOptions<T>;

      const [result, count] = await this.findAndCount(mikroWhere, mikroOptions);

      if (!result.length) {
        return DataLayerResponse.EmptyPage<TResult>();
      }

      const { limit, offset } = options || {};
      const paginationInfo: PaginationInfo = {
        totalItems: count,
        currentPage: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
        perPage: limit || 10,
        totalPages: Math.ceil(count / (limit || 10)),
      };
      return DataLayerResponse.OkWithPagination(result as TResult[], paginationInfo);
    } catch (error) {
      return this.handleDatabaseError(error, 'fetchAndCount');
    }
  }
  /**
   * Create a new entity with standardized response
   * @param entityData - Data for the new entity
   * @returns DataLayerResponse with created entity
   */
  async createEntity<TResult = T>(entityData: Partial<T>): Promise<DataLayerResponse<TResult>> {
    try {
      const entity = this.create(entityData as T);
      await this.em.persistAndFlush(entity);
      return DataLayerResponse.Created(entity as unknown as TResult);
    } catch (error) {
      return this.handleDatabaseError(error, 'createEntity');
    }
  }

  async createEntities<TResult = T>(entitiesData: Partial<T>[]): Promise<DataLayerResponse<TResult[]>> {
    try {
      const entities = entitiesData.map(data => this.create(data as T));
      await this.em.persistAndFlush(entities);
      return DataLayerResponse.Created(entities as unknown as TResult[]);
    } catch (error) {
      return this.handleDatabaseError(error, 'createEntities');
    }
  }
  /**
   * Update an entity with standardized response
   * @param where - Query conditions to find the entity
   * @param updateData - Data to update
   * @returns DataLayerResponse with updated entity
   */
  async updateEntity<TResult = T>(
    where: QueryWhere<T>,
    updateData: Partial<T>,
  ): Promise<DataLayerResponse<TResult | null>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const entity = await this.findOne(mikroWhere);

      if (!entity) {
        return DataLayerResponse.NotFound();
      }

      Object.assign(entity, updateData);
      await this.em.flush();

      return DataLayerResponse.Updated(entity as unknown as TResult);
    } catch (error) {
      return this.handleDatabaseError(error, 'updateEntity');
    }
  }

  /**
   * Delete an entity with standardized response
   * @param where - Query conditions to find the entity
   * @returns DataLayerResponse with deletion confirmation
   */
  async deleteEntity(where: QueryWhere<T>): Promise<DataLayerResponse<null>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const entity = await this.findOne(mikroWhere);

      if (!entity) {
        return DataLayerResponse.NotFound();
      }

      await this.em.removeAndFlush(entity);
      return DataLayerResponse.Deleted();
    } catch (error) {
      return this.handleDatabaseError(error, 'deleteEntity');
    }
  }
  async deleteMany(where: QueryWhere<T>): Promise<DataLayerResponse<null>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const entities = await this.find(mikroWhere);

      if (!entities.length) {
        return DataLayerResponse.NotFound();
      }

      await this.em.removeAndFlush(entities);
      return DataLayerResponse.Deleted();
    } catch (error) {
      return this.handleDatabaseError(error, 'deleteMany');
    }
  }

  /**
   * Check if an entity exists
   * @param where - Query conditions
   * @returns DataLayerResponse with boolean result
   */
  async exists(where: QueryWhere<T>): Promise<DataLayerResponse<boolean>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const count = await this.count(mikroWhere);
      return DataLayerResponse.Ok(count > 0);
    } catch (error) {
      return this.handleDatabaseError(error, 'exists');
    }
  }
  /**
   * Count entities matching the criteria
   * @param where - Query conditions
   * @param options - Query options (excluding pagination)
   * @returns DataLayerResponse with count
   */
  async countEntities(
    where: QueryWhere<T>,
    options?: Omit<QueryOptions<T>, 'limit' | 'offset'>,
  ): Promise<DataLayerResponse<number>> {
    try {
      const mikroWhere = this.adaptToMikroWhere(where);
      const countOptions = this.adaptToMikroCountOptions(options);
      const count = await this.count(mikroWhere, countOptions);
      return DataLayerResponse.Ok(count);
    } catch (error) {
      return this.handleDatabaseError(error, 'countEntities');
    }
  }

  // =============================================================================
  // FIELD SELECTION CONVENIENCE METHODS
  // =============================================================================

  /**
   * Fetch a single entity with only specific fields
   * @param where - Query conditions
   * @param fields - Fields to select
   * @param options - Additional query options
   * @returns DataLayerResponse with partial entity
   */
  async fetchOneFields<TResult = Partial<T>>(
    where: QueryWhere<T>,
    fields: (keyof T)[],
    options?: Omit<FindOneOptions<T>, 'fields'>,
  ): Promise<DataLayerResponse<TResult | null>> {
    return this.fetchOne<TResult>(where, { ...options, fields });
  }

  /**
   * Fetch a single entity excluding specific fields
   * @param where - Query conditions
   * @param exclude - Fields to exclude
   * @param options - Additional query options
   * @returns DataLayerResponse with partial entity
   */
  async fetchOneExclude<TResult = Partial<T>>(
    where: QueryWhere<T>,
    exclude: (keyof T)[],
    options?: Omit<FindOneOptions<T>, 'exclude'>,
  ): Promise<DataLayerResponse<TResult | null>> {
    return this.fetchOne<TResult>(where, { ...options, exclude });
  }

  /**
   * Fetch entities with only specific fields
   * @param where - Query conditions
   * @param fields - Fields to select
   * @param options - Additional query options
   * @returns DataLayerResponse with partial entities
   */
  async fetchFields<TResult = Partial<T>>(
    where: QueryWhere<T>,
    fields: (keyof T)[],
    options?: Omit<QueryOptions<T>, 'fields'>,
  ): Promise<DataLayerResponse<TResult[]>> {
    return this.fetch<TResult>(where, { ...options, fields });
  }

  /**
   * Fetch entities excluding specific fields
   * @param where - Query conditions
   * @param exclude - Fields to exclude
   * @param options - Additional query options
   * @returns DataLayerResponse with partial entities
   */
  async fetchExclude<TResult = Partial<T>>(
    where: QueryWhere<T>,
    exclude: (keyof T)[],
    options?: Omit<QueryOptions<T>, 'exclude'>,
  ): Promise<DataLayerResponse<TResult[]>> {
    return this.fetch<TResult>(where, { ...options, exclude });
  }

  /**
   * Fetch all entities with only specific fields
   * @param fields - Fields to select
   * @param options - Additional query options
   * @returns DataLayerResponse with partial entities
   */
  async fetchAllFields<TResult = Partial<T>>(
    fields: (keyof T)[],
    options?: Omit<FindAllOptions<T>, 'fields'>,
  ): Promise<DataLayerResponse<TResult[]>> {
    return this.fetchAll<TResult>({ ...options, fields });
  }

  /**
   * Fetch all entities excluding specific fields
   * @param exclude - Fields to exclude
   * @param options - Additional query options
   * @returns DataLayerResponse with partial entities
   */
  async fetchAllExclude<TResult = Partial<T>>(
    exclude: (keyof T)[],
    options?: Omit<FindAllOptions<T>, 'exclude'>,
  ): Promise<DataLayerResponse<TResult[]>> {
    return this.fetchAll<TResult>({ ...options, exclude });
  }
}
