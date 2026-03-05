import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ListingsRepository } from './repositories/listings.repository';
import { FilterDto, FiltersResponseDto, SingleFilterResponseDto } from './dtos/filter-response.dto';
import { ListingsFiltersDto } from './dtos/listings-filters.dto';
import { GetFilterByNameDto } from './dtos/get-filter-by-name.dto';
import { CATEGORY_FILTERS, COMMON_FILTERS, getFilterByName } from './config/filter.config';
import { FilterDefinition, FilterType } from './types/filter.types';
import {
  CATEGORY_NAMES,
  FILTER_VALIDATION_RULES,
  shouldShowFilterForMobile,
} from './constants/listings-filters.constants';
import { AppResponse } from '@common/responses/app-response';

@Injectable()
export class ListingsFilterService {
  private readonly logger = new Logger(ListingsFilterService.name);

  constructor(private readonly listingsRepository: ListingsRepository) {}

  /**
   * Get all available filters with their values based on current context
   */
  async getAvailableFilters(dto: ListingsFiltersDto): Promise<AppResponse<FiltersResponseDto>> {
    try {
      const {
        categoryName: rawCategoryName,
        perFilterMaxValues,
        includeCount,
        includeEmpty,
        source,
        ...restParams
      } = dto;

      // Set dynamic default for perFilterMaxValues based on source
      const maxValues = perFilterMaxValues ?? (source === 'web' ? 10 : 5);

      // Normalize category name for case-insensitive comparison
      const categoryName = rawCategoryName ? this.normalizeCategoryName(rawCategoryName) : undefined;

      // Validate category name if provided
      if (categoryName && !this.isValidCategory(categoryName)) {
        return AppResponse.Err(
          `Invalid category name: ${rawCategoryName}. Valid categories are: ${CATEGORY_NAMES.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Build applied filters object from all remaining parameters
      const appliedFilters: Record<string, any> = { ...restParams };
      if (categoryName) {
        appliedFilters.categoryName = categoryName;
      }

      // Validate price range if provided
      if (appliedFilters.minPrice !== undefined && appliedFilters.maxPrice !== undefined) {
        const priceValidation = FILTER_VALIDATION_RULES.price;
        if (!priceValidation.validate(appliedFilters.minPrice, appliedFilters.maxPrice)) {
          return AppResponse.Err(priceValidation.message, HttpStatus.BAD_REQUEST);
        }
      }

      // Get common filters (filtered for mobile if needed)
      const filtersToProcess =
        source === 'mobile'
          ? COMMON_FILTERS.filter(filterDef => shouldShowFilterForMobile(filterDef.name, categoryName))
          : COMMON_FILTERS;

      const commonFiltersPromises: Promise<FilterDto | null>[] = filtersToProcess.map(async filterDef => {
        // For getAvailableFilters, exclude current filter from applied filters to show all available options
        const filtersExcludingCurrent = { ...appliedFilters };
        delete filtersExcludingCurrent[filterDef.name];

        // For categoryName filter, don't pass categoryName parameter to avoid restricting results
        const categoryNameForQuery = filterDef.name === 'categoryName' ? undefined : categoryName;

        return this.buildFilterWithValues(
          filterDef,
          filtersExcludingCurrent, // exclude current filter from restrictions
          categoryNameForQuery, // Don't restrict by category if we're fetching categoryName filter
          maxValues,
          includeCount,
          undefined, // no search
          appliedFilters[filterDef.name], // pass selected values for this filter
          includeEmpty,
        );
      });

      // Get category-specific filters if category is selected (filtered for mobile if needed)
      let categoryFiltersPromises: Promise<FilterDto | null>[] = [];
      if (categoryName) {
        const categoryFilters = CATEGORY_FILTERS[categoryName] || [];
        const categoryFiltersToProcess =
          source === 'mobile'
            ? categoryFilters.filter(filterDef => shouldShowFilterForMobile(filterDef.name, categoryName))
            : categoryFilters;

        categoryFiltersPromises = categoryFiltersToProcess.map(async filterDef => {
          // For getAvailableFilters, exclude current filter from applied filters to show all available options
          const filtersExcludingCurrent = { ...appliedFilters };
          delete filtersExcludingCurrent[filterDef.name];

          return this.buildFilterWithValues(
            filterDef,
            filtersExcludingCurrent, // exclude current filter from restrictions
            categoryName,
            maxValues,
            includeCount,
            undefined, // no search
            appliedFilters[filterDef.name], // pass selected values for this filter
            includeEmpty,
          );
        });
      }

      // Execute all promises in parallel
      const [commonFilters, categoryFilters] = await Promise.all([
        Promise.all(commonFiltersPromises),
        Promise.all(categoryFiltersPromises),
      ]);

      // Get total count with current filters
      const totalCount = await this.getTotalListingsCount(appliedFilters, categoryName);

      // Log for debugging
      this.logger.debug('Applied Filters:', appliedFilters);
      this.logger.debug('Common Filters Count:', commonFilters.length);
      this.logger.debug('Category Filters Count:', categoryFilters.length);

      const responseData: FiltersResponseDto = {
        commonFilters: commonFilters.filter(f => f !== null),
        categoryFilters: categoryFilters.filter(f => f !== null),
        appliedFilters: this.cleanAppliedFilters(appliedFilters),
        totalCount,
      };

      return AppResponse.Ok(responseData);
    } catch (error) {
      this.logger.error('Error fetching available filters:', error);
      return AppResponse.Err('Failed to fetch available filters', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get values for a specific filter
   */
  async getFilterByName(filterName: string, dto: GetFilterByNameDto): Promise<AppResponse<SingleFilterResponseDto>> {
    try {
      const {
        categoryName: rawCategoryName,
        search,
        page,
        size,
        source,
        ...restParams // Extract all other filters that are applied
      } = dto;

      // Normalize category name for case-insensitive comparison
      const categoryName = rawCategoryName ? this.normalizeCategoryName(rawCategoryName) : undefined;

      // Build applied filters object with proper typing
      const allAppliedFilters: Record<string, any> = { ...restParams };

      // Add normalized category name to applied filters if present
      if (categoryName) {
        allAppliedFilters.categoryName = categoryName;
      }

      // Store the current filter's selected values for isSelected marking
      const currentFilterSelectedValues = allAppliedFilters[filterName];

      // Create applied filters excluding the current filter to show all available options
      const appliedFiltersExcludingCurrent = { ...allAppliedFilters };
      delete appliedFiltersExcludingCurrent[filterName];

      if (categoryName && !this.isValidCategory(categoryName)) {
        return AppResponse.Err(`Category ${rawCategoryName} not found`, HttpStatus.BAD_REQUEST);
      }

      // Get filter definition
      const filterDef = getFilterByName(filterName, categoryName);
      if (!filterDef) {
        return AppResponse.Err(
          `Filter '${filterName}' not found${categoryName ? ` in category '${categoryName}'` : ''}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if filter should be shown for mobile
      if (source === 'mobile' && !shouldShowFilterForMobile(filterName, categoryName)) {
        return AppResponse.Err(
          `Filter '${filterName}' is not available for mobile requests${categoryName ? ` in category '${categoryName}'` : ''}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Get filter with values, excluding current filter from applied filters but keeping selected values for marking
      // For categoryName filter, don't pass categoryName parameter to avoid restricting results
      const categoryNameForQuery = filterName === 'categoryName' ? undefined : categoryName;

      // Calculate offset for pagination
      const offset = (page - 1) * size;

      const filter = await this.buildFilterWithValues(
        filterDef,
        appliedFiltersExcludingCurrent, // Exclude current filter to show all available options
        categoryNameForQuery, // Don't restrict by category if we're fetching categoryName filter
        size, // Use size as limit for now
        true, // Always include count for filter values
        search,
        currentFilterSelectedValues, // Pass selected values separately for isSelected marking
        false, // Don't include empty for individual filter queries
        offset, // Add offset for pagination
      );

      // Get related filters that might be affected
      const relatedFilters = this.getRelatedFilters(filterName, categoryName);

      const responseData: SingleFilterResponseDto = {
        filter,
        relatedFilters,
        pagination: {
          page,
          size,
          hasMore: filter?.values ? filter.values.length === size : false,
        },
      };

      return AppResponse.Ok(responseData);
    } catch (error) {
      this.logger.error(`Error fetching filter '${filterName}':`, error);
      return AppResponse.Err('Failed to fetch filter', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Build filter with its available values
   */
  private async buildFilterWithValues(
    filterDef: FilterDefinition,
    appliedFilters: Record<string, any>,
    categoryName?: string,
    limit: number = 10,
    includeCount: boolean = true,
    search?: string,
    selectedValues?: any, // Selected values for the current filter (for isSelected marking)
    includeEmpty: boolean = false,
    offset: number = 0,
  ): Promise<FilterDto | null> {
    const filter: FilterDto = {
      name: filterDef.name,
      label: filterDef.label,
      type: filterDef.type,
      isCategorySpecific: filterDef.isCategorySpecific,
      unit: filterDef.unit, // Add unit from filter definition
    };

    // Handle different filter types
    if (filterDef.type === FilterType.RANGE) {
      // For range filters like price
      const rangeResult = await this.listingsRepository.fetchRangeFilterValues(
        filterDef.dbColumn,
        appliedFilters,
        categoryName,
      );

      if (rangeResult.status === 200 && rangeResult.data) {
        const rangeData = rangeResult.data as { min: number; max: number };
        filter.min = rangeData.min;
        filter.max = rangeData.max;

        // Add selected values if they exist in applied filters
        if (appliedFilters.minPrice !== undefined) {
          filter.selectedMin = appliedFilters.minPrice;
        }
        if (appliedFilters.maxPrice !== undefined) {
          filter.selectedMax = appliedFilters.maxPrice;
        }
      }
    } else {
      // For checkbox, radio, and boolean filters
      const valuesResult = await this.listingsRepository.fetchFilterValues(
        filterDef.name,
        filterDef.dbColumn,
        filterDef.source,
        appliedFilters,
        categoryName,
        limit,
        search,
        filterDef.join, // Pass join configuration if available
        offset, // Pass offset for pagination
      );

      if (valuesResult.status === 200 && valuesResult.data) {
        const valuesData = valuesResult.data as Array<{ value: any; label: string; count: number }>;
        filter.values = valuesData.map(item => ({
          ...item,
          isSelected: this.isValueSelected(filterDef.name, item.value, selectedValues),
        }));

        // For boolean filters, ensure we have both true/false options
        if (filterDef.type === FilterType.BOOLEAN && filter.values) {
          filter.values = this.ensureBooleanOptions(filter.values);
        }
      }
    }

    // If includeEmpty is false and filter has no values, return null to exclude it
    if (!includeEmpty && (!filter.values || filter.values.length === 0) && filterDef.type !== FilterType.RANGE) {
      return null;
    }

    return filter;
  }

  /**
   * Check if a filter value is currently selected
   */
  private isValueSelected(filterName: string, value: any, selectedValues: any): boolean {
    const appliedValue = selectedValues;

    if (appliedValue === undefined || appliedValue === null) {
      return false;
    }

    // Handle array values (checkbox filters)
    if (Array.isArray(appliedValue)) {
      // Convert both to strings for comparison to handle type mismatches
      return appliedValue.some(av => {
        const avStr = String(av).toLowerCase();
        const valueStr = String(value).toLowerCase();
        return avStr === valueStr;
      });
    }

    // Handle boolean values
    if (typeof value === 'boolean' || typeof appliedValue === 'boolean') {
      // Convert both to boolean for comparison
      const valueBool = value === true || value === 'true' || value === 1 || value === '1';
      const appliedBool =
        appliedValue === true || appliedValue === 'true' || appliedValue === 1 || appliedValue === '1';
      return valueBool === appliedBool;
    }

    // Handle range filters (price)
    if (filterName === 'price') {
      // Price is a range filter, doesn't have isSelected
      return false;
    }

    // Handle single value comparison (radio filters)
    // Convert both to strings for comparison to handle type mismatches
    const valueStr = String(value).toLowerCase();
    const appliedStr = String(appliedValue).toLowerCase();
    return valueStr === appliedStr;
  }

  /**
   * Ensure boolean filters have both true and false options
   */
  private ensureBooleanOptions(values: any[]): any[] {
    const hasTrue = values.some(v => v.value === true || v.value === 1 || v.value === '1');
    const hasFalse = values.some(v => v.value === false || v.value === 0 || v.value === '0');

    const result = [...values];

    if (!hasTrue) {
      result.push({
        value: true,
        label: 'Yes',
        count: 0,
        isSelected: false,
      });
    }

    if (!hasFalse) {
      result.push({
        value: false,
        label: 'No',
        count: 0,
        isSelected: false,
      });
    }

    // Normalize boolean values
    return result.map(item => ({
      ...item,
      value:
        item.value === true || item.value === 1 || item.value === '1'
          ? true
          : item.value === false || item.value === 0 || item.value === '0'
            ? false
            : item.value,
    }));
  }

  /**
   * Get related filters that might be affected by a filter selection
   */
  private getRelatedFilters(filterName: string, categoryName?: string): string[] {
    const relatedMap: Record<string, string[]> = {
      categoryName: ['brandName', 'processor', 'ramCapacity', 'screenSize'],
      brandName: ['model', 'processor', 'ramCapacity'],
      processor: ['generation', 'graphicsCardType'],
      ramCapacity: ['ramType'],
      primaryStorageCapacity: ['primaryStorageType'],
      screenSize: ['resolution', 'displayType'],
      // Add more relationships as needed
    };

    return relatedMap[filterName] || [];
  }

  /**
   * Clean applied filters to remove empty values
   */
  private cleanAppliedFilters(filters: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value;
        } else if (!Array.isArray(value)) {
          // Don't include source in applied filters
          if (
            key !== 'source' &&
            key !== 'perFilterMaxValues' &&
            key !== 'includeCount' &&
            key !== 'includeZeroCount'
          ) {
            cleaned[key] = value;
          }
        }
      }
    });

    return cleaned;
  }

  /**
   * Get total count of listings with current filters
   */
  private async getTotalListingsCount(appliedFilters: Record<string, any>, categoryName?: string): Promise<number> {
    try {
      return await this.listingsRepository.getFilteredListingsCount(appliedFilters, categoryName);
    } catch (error) {
      this.logger.error('Error getting total listings count:', error);
      return 0;
    }
  }

  /**
   * Get filter suggestions based on search query
   */
  async getFilterSuggestions(
    search: string,
    rawCategoryName?: string,
    limit: number = 10,
  ): Promise<AppResponse<any[]>> {
    try {
      // Normalize category name for case-insensitive comparison
      const categoryName = rawCategoryName ? this.normalizeCategoryName(rawCategoryName) : undefined;

      // Validate inputs
      if (!search || search.trim().length < 2) {
        return AppResponse.Err('Search query must be at least 2 characters long', HttpStatus.BAD_REQUEST);
      }

      if (categoryName && !this.isValidCategory(categoryName)) {
        return AppResponse.Err('Invalid category name', HttpStatus.BAD_REQUEST);
      }

      if (limit < 1 || limit > 50) {
        return AppResponse.Err('Limit must be between 1 and 50', HttpStatus.BAD_REQUEST);
      }
      const suggestions: any[] = [];

      // Search in common filters
      for (const filter of COMMON_FILTERS) {
        if (
          filter.name.toLowerCase().includes(search.toLowerCase()) ||
          filter.label.toLowerCase().includes(search.toLowerCase())
        ) {
          const values = await this.listingsRepository.fetchFilterValues(
            filter.name,
            filter.dbColumn,
            filter.source,
            {},
            categoryName,
            limit,
            search,
            filter.join, // Pass join configuration if available
          );

          if (values.status === 200 && values.data) {
            const filterValues = values.data as Array<{ value: any; label: string; count: number }>;
            if (filterValues.length > 0) {
              suggestions.push({
                filterName: filter.name,
                filterLabel: filter.label,
                values: filterValues,
              });
            }
          }
        }
      }

      // Search in category filters if category is specified
      if (categoryName) {
        const categoryFilters = CATEGORY_FILTERS[categoryName] || [];
        for (const filter of categoryFilters) {
          if (
            filter.name.toLowerCase().includes(search.toLowerCase()) ||
            filter.label.toLowerCase().includes(search.toLowerCase())
          ) {
            const values = await this.listingsRepository.fetchFilterValues(
              filter.name,
              filter.dbColumn,
              filter.source,
              {},
              categoryName,
              limit,
              search,
              filter.join, // Pass join configuration if available
            );

            if (values.status === 200 && values.data) {
              const filterValues = values.data as Array<{ value: any; label: string; count: number }>;
              if (filterValues.length > 0) {
                suggestions.push({
                  filterName: filter.name,
                  filterLabel: filter.label,
                  values: filterValues,
                });
              }
            }
          }
        }
      }

      return AppResponse.Ok(suggestions);
    } catch (error) {
      this.logger.error('Error getting filter suggestions:', error);
      return AppResponse.Err('Failed to fetch filter suggestions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Normalize category name for case-insensitive comparison
   */
  private normalizeCategoryName(categoryName: string): string {
    // Convert to title case to match stored category names
    return categoryName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Check if category name is valid (case-insensitive)
   */
  private isValidCategory(normalizedCategoryName: string): boolean {
    return CATEGORY_NAMES.some(cat => cat.toLowerCase() === normalizedCategoryName.toLowerCase());
  }
}
