export enum FilterType {
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  RANGE = 'range',
  BOOLEAN = 'boolean',
}

export enum FilterSource {
  LISTING = 'listing',
  SPECIFICATION = 'specification',
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface FilterDefinition {
  name: string;
  label: string;
  type: FilterType;
  source: FilterSource;
  dbColumn: string;
  tableName?: string;
  isCommon?: boolean;
  isCategorySpecific?: boolean;
  categories?: string[];
  options?: FilterOption[];
  min?: number;
  max?: number;
  unit?: string; // Unit for the filter values (e.g., 'GB', 'inches', 'mAh', etc.)
  // Join configuration for filters that require joining other tables
  join?: {
    table: string; // Table to join (e.g., 'city')
    alias: string; // Table alias (e.g., 'c')
    onColumn: string; // Column to join on in the main table (e.g., 'city_id')
    joinColumn: string; // Column to join on in the joined table (e.g., 'city_id')
    selectColumn: string; // Column to select from joined table (e.g., 'city_name')
  };
}

export interface FilterGroup {
  groupName: string;
  filters: FilterDefinition[];
}

export interface FilterResponse {
  commonFilters: FilterDefinition[];
  categoryFilters: FilterDefinition[];
  appliedFilters: Record<string, any>;
}

export interface FilterValue {
  value: string | number | boolean;
  label: string;
  count: number;
}

export interface FilterAggregation {
  filterName: string;
  values: FilterValue[];
  type: FilterType;
  min?: number;
  max?: number;
}
