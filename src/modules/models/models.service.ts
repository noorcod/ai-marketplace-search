import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, Loaded } from '@mikro-orm/mysql';
import { Model } from './entities/Model.entity';
import { ModelsRepository } from './repositories/models.repository';
import { ModelsFilterService } from './models-filter.service';
import { AppResponse } from '../../common/responses/app-response';
import { PaginatedResponse } from '../../common/responses/paginated-response';
import { PaginationOptions } from '../../common/utilities/pagination-options';
import { ModelOptionsBuilder } from '../../common/utilities/model-options-builder';
import { createPropertyToColumnMap } from '../../common/utilities/convertors';
import { ModelResponseTransformer } from '../../common/transformers/model-response.transformer';
import { ModelFilters, ModelVariants } from '../../common/types/model-response.type';
import { ModelFiltersResponseDto, SingleModelFilterResponseDto } from './types/model-filter.types';
import { ListingsService } from '@modules/listings/listings.service';

@Injectable()
export class ModelsService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: ModelsRepository,
    private readonly filterService: ModelsFilterService,
    private readonly listingsService: ListingsService,
  ) {}

  async findAll(
    categoryName: string,
    pagination: PaginationOptions,
    search?: string,
    sort?: string,
    filters?: { [key: string]: string | boolean },
  ) {
    const mappings = await createPropertyToColumnMap(this.orm, Model);
    const modelOptions = new ModelOptionsBuilder(categoryName, mappings)
      .setSort(sort)
      .setPagination(pagination)
      .setWhereClause(filters)
      .setRawWhereClause(filters)
      .setSearch((search || '').trim())
      .build();
    const result = await this.repo.fetchAllModels(modelOptions.where, modelOptions.options, modelOptions.rawWhere);
    return PaginatedResponse.fromDataLayer(result);
  }

  async findOne(id: number): Promise<AppResponse<Partial<Model>>> {
    const result = await this.repo.fetchOne({ modelId: id }, { populate: ['meta', 'images'] });
    if (!result.success) {
      return AppResponse.Err('Model not found') as AppResponse<Partial<Model>>;
    }
    result.data = new ModelResponseTransformer((result.data as Loaded<Model>).categoryName).transformModelResponse(
      result.data,
    );
    return AppResponse.fromDataLayer(result) as AppResponse<Partial<Model>>;
  }

  /**
   * Get all available filters for a category (NEW - uses filter service)
   */
  async getAvailableFilters(
    categoryName: string,
    filters?: { [key: string]: string | boolean | string[] },
    maxValuesPerFilter?: number,
    search?: string,
  ): Promise<AppResponse<ModelFiltersResponseDto>> {
    try {
      const applied = { ...(filters || {}) } as { [key: string]: string | boolean | string[] };
      if (categoryName) applied.categoryName = categoryName;
      const result = await this.filterService.getAvailableFilters(categoryName, applied, maxValuesPerFilter, search);
      return AppResponse.Ok(result);
    } catch (error) {
      return AppResponse.Err(error.message);
    }
  }

  /**
   * Get a specific filter with pagination (NEW - uses filter service)
   */
  async getFilterByName(
    filterName: string,
    categoryName: string,
    filters?: { [key: string]: string | boolean | string[] },
    page?: number,
    size?: number,
    search?: string,
  ): Promise<AppResponse<SingleModelFilterResponseDto>> {
    try {
      const applied = { ...(filters || {}) } as { [key: string]: string | boolean | string[] };
      if (categoryName) applied.categoryName = categoryName;
      const result = await this.filterService.getFilterByName(filterName, categoryName, applied, page, size, search);
      return AppResponse.Ok(result);
    } catch (error) {
      return AppResponse.Err(error.message);
    }
  }

  /**
   * @deprecated Use getAvailableFilters() instead - will be removed in future version
   * Legacy method for backward compatibility
   */
  async fetchModelFilters(
    categoryName: string,
    pagination: PaginationOptions,
    search?: string,
    filters?: { [key: string]: string | boolean },
  ): Promise<AppResponse<ModelFilters>> {
    // Import legacy dependencies only when needed
    const { modelFilters } = await import('../../common/constants/model-filters.constant');

    const filtersMap = modelFilters(categoryName);
    // build filters from query params
    const modelOptions = new ModelOptionsBuilder(categoryName)
      .setPagination(pagination)
      .setWhereClause(filters)
      .build();

    // filter keys
    const filterKeys = Object.keys(filters);

    const response = {};
    for (const filter of filtersMap) {
      const res = await this.repo.fetchOneFilter(filter.label as string, modelOptions.where, modelOptions.options);
      const label = filter.label as string;
      let values;
      if (filterKeys.length > 0 && filterKeys.includes(label)) {
        const filterValue = filters[label];
        // if the filter is multi-value
        if (filter.type === 'checkbox') {
          values = res.data.map(dataRow => {
            let isChecked = false;
            if (typeof filterValue === 'string') {
              isChecked = filterValue.includes(dataRow[label]);
            }
            return {
              value: dataRow[label],
              isChecked,
            };
          });
        }
        if (filter.type === 'radio') {
          values = res.data.map(dataRow => {
            let isChecked = false;
            if (typeof filterValue === 'boolean') {
              isChecked = filterValue === dataRow[label];
            } else if (typeof filterValue === 'string') {
              isChecked = JSON.parse(filterValue) === dataRow[label];
            }
            return {
              value: dataRow[label],
              isChecked,
            };
          });
        }
      } else {
        values = res.data.map(dataRow => {
          return {
            value: dataRow[label],
            isChecked: false,
          };
        });
      }
      response[label] = {
        values: values,
        key: filter.key,
        label: filter.label,
        alias: filter.alias,
        unit: filter.unit,
        inputType: filter.type,
      };
    }
    return AppResponse.Ok(response);
  }

  /**
   * @deprecated Use getFilterByName() instead - will be removed in future version
   * Legacy method for backward compatibility
   */
  async fetchSpecificFilter(
    categoryName: string,
    query: string,
    pagination: PaginationOptions,
    search?: string,
    filters?: { [key: string]: string | boolean },
  ): Promise<AppResponse<ModelFilters>> {
    // Import legacy dependencies only when needed
    const { modelFilters } = await import('../../common/constants/model-filters.constant');
    const areFiltersPresent = Object.keys(filters).length > 0;
    let filtersExcludingQuery = {};
    let filterInQuestion = {};
    let queryFoundInFilters = false;

    // There are two main cases:
    //  1. The filters are present
    //  2. The filters are not present

    // Case 1: The filters are present
    if (filters && Object.keys(filters).length > 0) {
      // Check if the query is present in the filters
      if (query && filters[query]) {
        queryFoundInFilters = true;
        filterInQuestion = { [query]: filters[query] };
        filtersExcludingQuery = { ...filters };
        delete filtersExcludingQuery[query];
      } else {
        // The filters are present but the query is not found among them
        queryFoundInFilters = false;
        filtersExcludingQuery = { ...filters };
      }
    } else {
      // Case 2: The filters are not present
      queryFoundInFilters = false;
    }

    const modelOptions = new ModelOptionsBuilder(categoryName).setWhereClause(filtersExcludingQuery).build();

    const result = await this.repo.fetchOneFilter(query, modelOptions.where, modelOptions.options);

    if (!result.success) {
      return AppResponse.Err('No data found') as AppResponse<ModelFilters>;
    }

    let response = {};
    let values;
    if (queryFoundInFilters) {
      const filterValue = filters[query];
      // if the filter is multi-value
      values = result.data.map(dataRow => {
        let isChecked = false;
        if (query.startsWith('is') || query.startsWith('has')) {
          if (typeof filterValue === 'boolean') {
            isChecked = dataRow[query] === filterValue;
          } else if (typeof filterValue === 'string') {
            isChecked = dataRow[query] === JSON.parse(filterValue);
          }
        } else {
          if (typeof filterValue === 'string') {
            isChecked = filterValue.includes(dataRow[query]);
          }
        }
        return {
          value: dataRow[query],
          isChecked,
        };
      });
    } else {
      values = result.data.map(dataRow => {
        return {
          value: dataRow[query],
          isChecked: false,
        };
      });
    }

    const filter = modelFilters(categoryName).find(f => f.label === query);
    response[query] = {
      values,
      key: filter.key,
      label: filter.label,
      alias: filter.alias,
      unit: filter.unit,
      inputType: filter.type,
    };
    return AppResponse.Ok(response);
  }

  async fetchAccessoryTypes(): Promise<AppResponse<Partial<Model>[]>> {
    const accessoryTypes = await this.repo.fetchAccessoryTypes();
    if (!accessoryTypes.success) {
      return AppResponse.Err('No accessory types found') as AppResponse<Partial<Model>[]>;
    }
    return AppResponse.fromDataLayer(accessoryTypes) as AppResponse<Partial<Model>[]>;
  }

  async fetchRelatedModels(id: number, pagination: PaginationOptions): Promise<AppResponse<Partial<Model>[]>> {
    const model = await this.repo.fetchOne({ modelId: id }, { fields: ['modelId', 'categoryName', 'brandName'] });
    if (!model.success) {
      return AppResponse.Err('Model not found') as AppResponse<Partial<Model>[]>;
    }
    const relatedModels = await this.repo.fetchRelatedModelsUsingCategoryAndBrand(model.data, {
      offset: pagination.offset(),
      limit: pagination.limit(),
    });
    if (!relatedModels.success) {
      return AppResponse.Err('No related models found') as AppResponse<Partial<Model>[]>;
    }
    return AppResponse.fromDataLayer(relatedModels) as AppResponse<Partial<Model>[]>;
  }

  async fetchModelVariants(id: number, modelName: string) {
    if (!modelName) {
      return AppResponse.Err('Model name is required');
    }
    const model = await this.repo.fetchOne({ modelId: id }, { fields: ['modelId', 'brandName', 'modelName'] });
    if (!model.success) {
      return AppResponse.Err('Model not found');
    }
    const result = await this.repo.fetchModelVariants(model.data);
    if (!result.success) {
      return AppResponse.Err('No variants found');
    }
    const response = result.data.map(dataRow => {
      const variant = dataRow.modelTitle.replace(modelName, '');
      return {
        ...dataRow,
        variant: variant.substring(variant.indexOf(' ') + 1).trim(),
      };
    });
    return AppResponse.Ok(response as ModelVariants[]);
  }

  async fetchListingsAvailabilityByModelId(id: number) {
    try {
      const result = await this.repo.fetchOne({ modelId: id, isDeleted: false });
      if (!result.success) {
        return AppResponse.Err('Model not found');
      }
      const model = result.data as Model;
      const availability = await this.listingsService.fetchListingsAvailabilityForSpecsModel(model);
      return availability;
    } catch (error) {
      return AppResponse.Err(error.message);
    }
  }
}
