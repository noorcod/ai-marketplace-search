import { ApiProperty } from '@nestjs/swagger';
import { FilterType } from '../types/filter.types';

export class FilterValueDto {
  @ApiProperty({ description: 'The value of the filter option' })
  value: string | number | boolean;

  @ApiProperty({ description: 'Display label for the filter option' })
  label: string;

  @ApiProperty({ description: 'Count of items with this filter value' })
  count: number;

  @ApiProperty({ description: 'Whether this value is currently selected', required: false })
  isSelected?: boolean;
}

export class FilterDto {
  @ApiProperty({ description: 'Unique name identifier for the filter' })
  name: string;

  @ApiProperty({ description: 'Display label for the filter' })
  label: string;

  @ApiProperty({
    description: 'Type of filter control',
    enum: FilterType,
  })
  type: FilterType;

  @ApiProperty({
    description: 'Available values for this filter',
    type: [FilterValueDto],
    required: false,
  })
  values?: FilterValueDto[];

  @ApiProperty({ description: 'Minimum value for range filters', required: false })
  min?: number;

  @ApiProperty({ description: 'Maximum value for range filters', required: false })
  max?: number;

  @ApiProperty({ description: 'Currently selected minimum value for range filters', required: false })
  selectedMin?: number;

  @ApiProperty({ description: 'Currently selected maximum value for range filters', required: false })
  selectedMax?: number;

  @ApiProperty({ description: 'Unit for filter values (e.g., GB, inches, mAh)', required: false })
  unit?: string;

  @ApiProperty({ description: 'Whether this filter is category-specific', required: false })
  isCategorySpecific?: boolean;
}

export class FilterGroupDto {
  @ApiProperty({ description: 'Name of the filter group' })
  groupName: string;

  @ApiProperty({ description: 'Filters in this group', type: [FilterDto] })
  filters: FilterDto[];
}

export class FiltersResponseDto {
  @ApiProperty({
    description: 'Common filters that apply to all categories',
    type: [FilterDto],
  })
  commonFilters: FilterDto[];

  @ApiProperty({
    description: 'Category-specific filters based on selected category',
    type: [FilterDto],
  })
  categoryFilters: FilterDto[];

  @ApiProperty({
    description: 'Currently applied filters',
    type: Object,
    required: false,
  })
  appliedFilters?: Record<string, any>;

  @ApiProperty({
    description: 'Total count of listings matching current filters',
    required: false,
  })
  totalCount?: number;
}

export class SingleFilterResponseDto {
  @ApiProperty({ description: 'Filter details' })
  filter: FilterDto;

  @ApiProperty({
    description: 'Related filters that might be affected',
    type: [String],
    required: false,
  })
  relatedFilters?: string[];

  @ApiProperty({
    description: 'Pagination metadata',
    required: false,
  })
  pagination?: {
    page: number;
    size: number;
    total?: number;
    hasMore?: boolean;
  };
}
