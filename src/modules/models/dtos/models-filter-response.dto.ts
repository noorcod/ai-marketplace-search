import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelsFilterValueDto {
  @ApiProperty({ description: 'The value of the filter option' })
  value: string | number | boolean;

  @ApiProperty({ description: 'Display label for the filter option' })
  label: string;

  @ApiProperty({ description: 'Count of items with this filter value', default: 0 })
  count: number = 0;

  @ApiPropertyOptional({ description: 'Whether this value is currently selected' })
  isSelected?: boolean;
}

export class ModelsFilterDto {
  @ApiProperty({ description: 'Unique name identifier for the filter' })
  name: string;

  @ApiProperty({ description: 'Display label for the filter' })
  label: string;

  @ApiProperty({ description: 'Type of filter control', enum: ['checkbox', 'radio', 'boolean'] })
  type: 'checkbox' | 'radio' | 'boolean';

  @ApiPropertyOptional({ description: 'Available values for this filter', type: [ModelsFilterValueDto] })
  values?: ModelsFilterValueDto[];

  @ApiPropertyOptional({ description: 'Unit for filter values (e.g., GB, inches, mAh)' })
  unit?: string;

  @ApiPropertyOptional({ description: 'Whether this filter is category-specific' })
  isCategorySpecific?: boolean;
}

export class ModelsFiltersResponseDto {
  @ApiProperty({ description: 'Common filters that apply to all categories', type: [ModelsFilterDto] })
  commonFilters: ModelsFilterDto[];

  @ApiProperty({ description: 'Category-specific filters based on selected category', type: [ModelsFilterDto] })
  categoryFilters: ModelsFilterDto[];

  @ApiPropertyOptional({ description: 'Currently applied filters', type: Object })
  appliedFilters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Total count of models matching current filters' })
  totalCount?: number;
}

export class SingleModelsFilterResponseDto {
  @ApiProperty({ description: 'Filter details', type: ModelsFilterDto })
  filter: ModelsFilterDto;

  @ApiPropertyOptional({ description: 'Related filters that might be affected', type: [String] })
  relatedFilters?: string[];

  @ApiPropertyOptional({ description: 'Pagination metadata' })
  pagination?: {
    page: number;
    size: number;
    total?: number;
    hasMore?: boolean;
  };
}
