# Models Filter Migration Guide

## Overview

The models filter system has been modernized with a new architecture that provides better type safety, consistency with listings module, and improved maintainability. This guide helps you migrate from the legacy filter system to the new one.

## What Changed?

### Architecture

- **Before**: Switch-based `modelFilters()` function with `FilterMap<Model>` type
- **After**: Configuration-based system with `ModelFilterDefinition` interface

### Response Structure

- **Before**: Custom response format with `isChecked` property
- **After**: Standardized response matching listings module with `isSelected` property

### Service Methods

- **Before**: `fetchModelFilters()` and `fetchSpecificFilter()`
- **After**: `getAvailableFilters()` and `getFilterByName()`

## Migration Steps

### Step 1: Update Response Type Expectations

#### Before (Legacy):

```typescript
// Response structure
{
  brandName: {
    values: [{ value: 'Apple', isChecked: false }],
    key: 'brandId',
    label: 'brandName',
    alias: 'Brand',
    unit: null,
    inputType: 'checkbox'
  }
}
```

#### After (New):

```typescript
// Response structure
{
  commonFilters: [
    {
      name: 'brandName',
      label: 'Brand',
      type: 'checkbox',
      values: [
        {
          value: 'Apple',
          label: 'Apple',
          count: 0,
          isSelected: false
        }
      ],
      unit: undefined
    }
  ],
  categoryFilters: [...],
  appliedFilters: {}
}
```

### Step 2: Update Service Method Calls

#### Before (Legacy):

```typescript
// Get all filters
const result = await modelsService.fetchModelFilters(categoryName, pagination, search, filters);

// Get specific filter
const result = await modelsService.fetchSpecificFilter(categoryName, filterName, pagination, search, filters);
```

#### After (New):

```typescript
// Get all filters
const result = await modelsService.getAvailableFilters(
  categoryName,
  filters,
  maxValuesPerFilter, // optional, default: 20
);

// Get specific filter with pagination
const result = await modelsService.getFilterByName(
  filterName,
  categoryName,
  filters,
  page, // optional, default: 1
  size, // optional, default: 50
);
```

### Step 3: Update Filter Value Handling

#### Before (Legacy):

```typescript
// Check if value is selected
const isSelected = filterValue.isChecked;

// Access filter metadata
const filterKey = response[filterName].key;
const filterAlias = response[filterName].alias;
```

#### After (New):

```typescript
// Check if value is selected
const isSelected = filterValue.isSelected;

// Access filter metadata
const filter =
  response.commonFilters.find(f => f.name === filterName) || response.categoryFilters.find(f => f.name === filterName);
const filterLabel = filter.label;
const filterType = filter.type;
```

### Step 4: Update Frontend Components

#### Before (Legacy):

```typescript
// Iterate through filters
Object.keys(filtersResponse).forEach(filterKey => {
  const filter = filtersResponse[filterKey];
  console.log(filter.alias); // Display name
  console.log(filter.inputType); // Filter type

  filter.values.forEach(value => {
    console.log(value.value, value.isChecked);
  });
});
```

#### After (New):

```typescript
// Iterate through common filters
filtersResponse.commonFilters.forEach(filter => {
  console.log(filter.label); // Display name
  console.log(filter.type); // Filter type

  filter.values?.forEach(value => {
    console.log(value.value, value.isSelected);
  });
});

// Iterate through category-specific filters
filtersResponse.categoryFilters.forEach(filter => {
  // Same structure as common filters
});
```

## Breaking Changes

### 1. Response Structure

- **Changed**: `isChecked` → `isSelected`
- **Changed**: Flat object → Structured object with `commonFilters` and `categoryFilters`
- **Removed**: `key` property (use `name` instead)
- **Removed**: `alias` property (use `label` instead)
- **Removed**: `inputType` property (use `type` instead)
- **Added**: `count` property (always 0 for models)
- **Added**: `isCategorySpecific` flag

### 2. Method Signatures

- **Removed**: `pagination` parameter (not needed for getting all filters)
- **Removed**: `search` parameter (not implemented in new system)
- **Added**: `maxValuesPerFilter` parameter
- **Added**: `page` and `size` parameters for single filter endpoint

### 3. Filter Names

- **Changed**: Filter names now use camelCase consistently (e.g., `brandName`, `processor`)
- **Changed**: Boolean filters use proper naming (e.g., `hasTouchScreen`, `hasESim`)

## Backward Compatibility

The legacy methods are still available but marked as `@deprecated`:

```typescript
// These still work but will show deprecation warnings
await modelsService.fetchModelFilters(categoryName, pagination, search, filters);
await modelsService.fetchSpecificFilter(categoryName, query, pagination, search, filters);
```

**Timeline**: Legacy methods will be removed in a future major version. Please migrate to new methods as soon as possible.

## Benefits of Migration

### 1. Type Safety

```typescript
// Before: No type safety
const filter: any = response[filterName];

// After: Full TypeScript support
const filter: ModelFilterDto = response.commonFilters[0];
```

### 2. Consistency

```typescript
// Same structure as listings module
import { FilterValueDto } from '@modules/listings/dtos/filter-response.dto';
import { ModelFilterValueDto } from '@modules/models/types/model-filter.types';
// Both have identical structure!
```

### 3. Better Metadata

```typescript
// Before: Limited information
const unit = filter.unit; // null or string

// After: Rich metadata
const unit = filter.unit; // 'GB', 'inch', 'Hz', etc.
const isCategorySpecific = filter.isCategorySpecific; // boolean
```

### 4. Pagination Support

```typescript
// New: Paginate through filter values
const result = await modelsService.getFilterByName(
  'brandName',
  'Laptop',
  {},
  1, // page
  20, // size
);

console.log(result.data.pagination.hasMore); // true if more results
```

## Common Migration Patterns

### Pattern 1: Filter Dropdown Component

#### Before:

```typescript
function FilterDropdown({ filterName, filterData }) {
  return (
    <select>
      <option>{filterData.alias}</option>
      {filterData.values.map(v => (
        <option key={v.value} selected={v.isChecked}>
          {v.value} {filterData.unit || ''}
        </option>
      ))}
    </select>
  );
}
```

#### After:

```typescript
function FilterDropdown({ filter }: { filter: ModelFilterDto }) {
  return (
    <select>
      <option>{filter.label}</option>
      {filter.values?.map(v => (
        <option key={v.value} selected={v.isSelected}>
          {v.label} {/* Already includes unit */}
        </option>
      ))}
    </select>
  );
}
```

### Pattern 2: Filter Chips

#### Before:

```typescript
function FilterChips({ filters }) {
  return Object.entries(filters).map(([key, filter]) => (
    <div key={key}>
      <h4>{filter.alias}</h4>
      {filter.values.filter(v => v.isChecked).map(v => (
        <span key={v.value}>{v.value}</span>
      ))}
    </div>
  ));
}
```

#### After:

```typescript
function FilterChips({ response }: { response: ModelFiltersResponseDto }) {
  const allFilters = [...response.commonFilters, ...response.categoryFilters];

  return allFilters.map(filter => (
    <div key={filter.name}>
      <h4>{filter.label}</h4>
      {filter.values?.filter(v => v.isSelected).map(v => (
        <span key={v.value}>{v.label}</span>
      ))}
    </div>
  ));
}
```

### Pattern 3: Applied Filters Display

#### Before:

```typescript
// Had to iterate through all filters to find selected ones
Object.entries(filters).forEach(([key, filter]) => {
  const selected = filter.values.filter(v => v.isChecked);
  if (selected.length > 0) {
    console.log(`${filter.alias}: ${selected.map(v => v.value).join(', ')}`);
  }
});
```

#### After:

```typescript
// Can use appliedFilters directly
Object.entries(response.appliedFilters || {}).forEach(([filterName, value]) => {
  const filter = [...response.commonFilters, ...response.categoryFilters].find(f => f.name === filterName);

  console.log(`${filter?.label}: ${value}`);
});
```

## Testing Your Migration

### 1. Unit Tests

```typescript
import { ModelsFilterService } from '@modules/models/models-filter.service';

describe('ModelsFilterService', () => {
  it('should return filters in new format', async () => {
    const result = await service.getAvailableFilters('Laptop');

    expect(result).toHaveProperty('commonFilters');
    expect(result).toHaveProperty('categoryFilters');
    expect(result.commonFilters[0]).toHaveProperty('name');
    expect(result.commonFilters[0]).toHaveProperty('label');
    expect(result.commonFilters[0]).toHaveProperty('type');
    expect(result.commonFilters[0].values[0]).toHaveProperty('isSelected');
  });
});
```

### 2. Integration Tests

```typescript
describe('Filter API', () => {
  it('should handle filter selection correctly', async () => {
    const filters = { brandName: 'Apple' };
    const result = await service.getAvailableFilters('Laptop', filters);

    const brandFilter = result.commonFilters.find(f => f.name === 'brandName');
    const appleValue = brandFilter?.values?.find(v => v.value === 'Apple');

    expect(appleValue?.isSelected).toBe(true);
  });
});
```

## Troubleshooting

### Issue 1: "Property 'isChecked' does not exist"

**Solution**: Change `isChecked` to `isSelected`

### Issue 2: "Cannot read property 'alias' of undefined"

**Solution**: Use `label` instead of `alias`

### Issue 3: "Response structure is different"

**Solution**: Access filters through `commonFilters` and `categoryFilters` arrays instead of object keys

### Issue 4: "Filter values don't have units"

**Solution**: Units are now included in the `label` property via `getFilterValueLabel()` helper

## Need Help?

- Check the [Models Filter Architecture](./models-filter-architecture.md) documentation
- Review the [Filter Configuration](../src/modules/models/config/model-filters.config.ts)
- Look at [Filter Constants](../src/modules/models/constants/model-filters.constants.ts) for helper functions

## Timeline

- **Current**: Both legacy and new methods available
- **Next Minor Version**: Deprecation warnings added
- **Next Major Version**: Legacy methods removed

Migrate now to avoid breaking changes in future releases!
