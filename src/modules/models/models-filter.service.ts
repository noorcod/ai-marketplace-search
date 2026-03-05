import { Injectable, NotFoundException } from '@nestjs/common';
import { ModelsRepository } from './repositories/models.repository';
import {
  getFiltersForCategory,
  getFilterByName as getFilterDefByName,
  COMMON_MODEL_FILTERS,
  normalizeCategoryName,
} from './config/model-filters.config';
import {
  ModelFilterDto,
  ModelFilterValueDto,
  ModelFiltersResponseDto,
  SingleModelFilterResponseDto,
  ModelFilterType,
} from './types/model-filter.types';
import { getFilterValueLabel } from './constants/model-filters.constants';
import { ModelOptionsBuilder } from '../../common/utilities/model-options-builder';

@Injectable()
export class ModelsFilterService {
  constructor(private readonly repo: ModelsRepository) {}

  /**
   * Get all available filters for a category with their values
   */
  async getAvailableFilters(
    categoryName: string,
    appliedFilters?: Record<string, string | boolean | string[]>,
    maxValuesPerFilter: number = 20,
    search?: string,
  ): Promise<ModelFiltersResponseDto> {
    const normalizedCategory = normalizeCategoryName(categoryName) ?? categoryName;
    // Get filter definitions for this category
    const allFilters = getFiltersForCategory(normalizedCategory);

    // Separate common and category-specific filters
    const commonFilterNames = COMMON_MODEL_FILTERS.map(f => f.name);
    const commonFilters: ModelFilterDto[] = [];
    const categoryFilters: ModelFilterDto[] = [];

    // Build WHERE clause from applied filters (excluding current filter) and include category
    const buildWhereClause = (excludeFilter?: string) => {
      const filtersCopy = { ...(appliedFilters || {}) } as Record<string, string | boolean | string[]>;
      if (excludeFilter && filtersCopy[excludeFilter] !== undefined) {
        delete filtersCopy[excludeFilter];
      }
      // Use builder to coerce booleans and include categoryName
      const modelOptions = new ModelOptionsBuilder(normalizedCategory)
        .setWhereClause(filtersCopy)
        .setSearch(search)
        .build();
      return modelOptions.where as Record<string, any>;
    };

    // Process each filter
    for (const filterDef of allFilters) {
      const whereClause = buildWhereClause(filterDef.name);

      // Fetch filter values from database
      const filterDto = await this.buildFilterWithValues(
        filterDef.name,
        filterDef.label,
        filterDef.type,
        filterDef.unit,
        whereClause,
        appliedFilters?.[filterDef.name],
        maxValuesPerFilter,
      );

      if (filterDto) {
        // Categorize as common or category-specific
        const isBrand = filterDef.name === 'brandName';
        const forceCategory = isBrand && !!normalizedCategory; // brand shows under category when category is specified
        if (!forceCategory && commonFilterNames.includes(filterDef.name)) {
          commonFilters.push(filterDto);
        } else {
          filterDto.isCategorySpecific = true;
          categoryFilters.push(filterDto);
        }
      }
    }

    return {
      commonFilters,
      categoryFilters,
      appliedFilters: appliedFilters || {},
    };
  }

  /**
   * Get a specific filter with its values (with pagination)
   */
  async getFilterByName(
    filterName: string,
    categoryName: string,
    appliedFilters?: Record<string, string | boolean | string[]>,
    page: number = 1,
    size: number = 50,
    search?: string,
  ): Promise<SingleModelFilterResponseDto> {
    const normalizedCategory = normalizeCategoryName(categoryName) ?? categoryName;
    const filterDef = getFilterDefByName(filterName, normalizedCategory);
    if (!filterDef) {
      throw new NotFoundException(`Filter '${filterName}' not found for category '${categoryName}'`);
    }
    if (!filterDef.categories.some(c => c.toLowerCase() === normalizedCategory.toLowerCase())) {
      throw new NotFoundException(`Filter '${filterName}' is not applicable to category '${categoryName}'`);
    }

    // Build where clause including category + applied filters, excluding the current filter
    const whereClause = new ModelOptionsBuilder(normalizedCategory)
      .setWhereClause({ ...(appliedFilters || {}) })
      .setSearch(search)
      .build().where as Record<string, any>;
    if (whereClause[filterName] !== undefined) {
      delete whereClause[filterName];
    }

    // Pagination window
    const offset = (page - 1) * size;
    const limit = size + 1; // fetch one extra to detect hasMore

    // Query repository (grouped values with counts)
    const result = await this.repo.fetchOneFilter(filterDef.name, whereClause, { offset, limit });
    if (!result.success || !result.data) {
      throw new NotFoundException(`No values found for filter '${filterName}'`);
    }

    const hasMore = result.data.length > size;
    const rows = result.data.slice(0, size);

    const values: ModelFilterValueDto[] = rows.map(row => {
      const rawValue = row[filterDef.name];
      const normalizedValue = this.normalizeValue(rawValue, filterDef.type);
      return {
        value: normalizedValue,
        label: getFilterValueLabel(filterName, normalizedValue),
        count: Number(row.count) || 0,
        isSelected: this.isValueSelected(normalizedValue, appliedFilters?.[filterName], filterDef.type),
      };
    });

    return {
      filter: {
        name: filterName,
        label: filterDef.label,
        type: filterDef.type,
        unit: filterDef.unit,
        values,
      },
      pagination: { page, size, hasMore },
    };
  }

  /**
   * Build a filter DTO with its values
   */
  private async buildFilterWithValues(
    filterName: string,
    label: string,
    type: ModelFilterType,
    unit: string | undefined,
    where: Record<string, string | boolean | string[]>,
    selectedValue: string | boolean | string[] | undefined,
    maxValues: number,
  ): Promise<ModelFilterDto | null> {
    const filterDef = getFilterDefByName(filterName);
    if (!filterDef) return null;

    // Fetch values (grouped with counts)
    const result = await this.repo.fetchOneFilter(filterDef.name, where, { limit: maxValues });
    if (!result.success || !result.data || result.data.length === 0) {
      return null;
    }

    const values: ModelFilterValueDto[] = result.data.map(row => {
      const rawValue = row[filterDef.name];
      const normalizedValue = this.normalizeValue(rawValue, type);
      return {
        value: normalizedValue,
        label: getFilterValueLabel(filterName, normalizedValue),
        count: Number(row.count) || 0,
        isSelected: this.isValueSelected(normalizedValue, selectedValue, type),
      };
    });

    return {
      name: filterName,
      label,
      type,
      values,
      unit,
    };
  }

  /**
   * Check if a value is selected based on filter type
   */
  private isValueSelected(
    value: any,
    selectedValue: string | boolean | string[] | undefined,
    filterType: ModelFilterType,
  ): boolean {
    if (selectedValue === undefined) return false;

    switch (filterType) {
      case ModelFilterType.CHECKBOX:
        // Multi-select: support comma-separated string or array
        if (Array.isArray(selectedValue)) {
          const set = new Set(selectedValue.map(v => String(v).trim().toLowerCase()));
          return set.has(String(value).trim().toLowerCase());
        }
        if (typeof selectedValue === 'string') {
          return selectedValue
            .split(',')
            .map(s => s.trim().toLowerCase())
            .includes(String(value).trim().toLowerCase());
        }
        return false;

      case ModelFilterType.RADIO:
      case ModelFilterType.BOOLEAN:
        // Single-select: direct comparison
        // Normalize both sides to strings for safe comparison
        if (typeof selectedValue === 'boolean') {
          return String(selectedValue) === String(value === true || value === 1 || value === '1');
        }
        if (typeof selectedValue === 'string') {
          const sv = selectedValue.trim().toLowerCase();
          if (sv === 'true' || sv === 'false') {
            return String(sv === 'true') === String(value === true || value === 1 || value === '1');
          }
          if (sv === '1' || sv === '0') {
            return String(sv === '1') === String(value === true || value === 1 || value === '1');
          }
          return sv === String(value).trim().toLowerCase();
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Normalize raw DB values for consistent downstream handling
   */
  private normalizeValue(value: any, filterType: ModelFilterType): any {
    if (filterType === ModelFilterType.BOOLEAN) {
      // Some boolean flags are stored as tinyint(1) (0/1) or booleans
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === '1' || v === 'true') return true;
        if (v === '0' || v === 'false') return false;
      }
      return Boolean(value);
    }
    return value;
  }
}
