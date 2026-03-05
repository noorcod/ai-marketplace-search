export enum ModelFilterType {
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  BOOLEAN = 'boolean',
}

export interface ModelFilterDefinition {
  name: string; // Property name in DTO (e.g., 'brandName', 'processor')
  label: string; // Display label (e.g., 'Brand', 'Processor')
  type: ModelFilterType;
  dbColumn: string; // Column name in model table (e.g., 'brand_name', 'processor')
  unit?: string; // Unit for display (e.g., 'GB', 'inch', 'Hz')
  categories: string[]; // Categories this filter applies to
}

// Matches listings FilterValueDto structure
export interface ModelFilterValueDto {
  value: string | number | boolean;
  label: string;
  count: number;
  isSelected?: boolean;
}

// Matches listings FilterDto structure
export interface ModelFilterDto {
  name: string;
  label: string;
  type: ModelFilterType;
  values?: ModelFilterValueDto[];
  unit?: string;
  isCategorySpecific?: boolean;
}

// Matches listings FiltersResponseDto structure
export interface ModelFiltersResponseDto {
  commonFilters: ModelFilterDto[];
  categoryFilters: ModelFilterDto[];
  appliedFilters?: Record<string, any>;
  totalCount?: number;
}

// Matches listings SingleFilterResponseDto structure
export interface SingleModelFilterResponseDto {
  filter: ModelFilterDto;
  relatedFilters?: string[];
  pagination?: {
    page: number;
    size: number;
    total?: number;
    hasMore?: boolean;
  };
}
