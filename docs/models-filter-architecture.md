# Models Filter Architecture

## Overview

The models filter system has been modernized with a clean, type-safe architecture optimized for single-table data access. Unlike the listings module which requires complex multi-table joins, the models module benefits from a simpler design since all data resides in the `model` table.

## Final Implementation Summary (as of 2025-11-11)

- **Entity-first querying**: All filter aggregations use entity property names (e.g., `brandName`) rather than raw DB columns.
- **Counts**: Each filter value includes `count` aggregated via `COUNT(model_id)`.
- **Boolean normalization**: Robust coercion for `true/false`, `1/0`, and `'true'/'false'` for both querying and `isSelected` comparison.
- **Multi-value parameters**: Checkbox filters (e.g., `brandName`) accept repeated params or comma-separated values; selection logic supports arrays and CSV.
- **Category-selected state**: `categoryName` is merged into applied filters so its value appears with `isSelected: true` in responses.
- **Brand under category**: When `categoryName` is provided, `brandName` is returned under `categoryFilters` for better UX grouping.
- **Search integration**: Full-text search via `ModelOptionsBuilder.setSearch()` on `modelTitle` for both aggregated and single-filter endpoints.
- **Source-based limits**: `source` param controls per-filter caps for aggregated endpoint: `web=10`, `mobile=5` (override via `perFilterMaxValues`).
- **Single-filter pagination**: `GET /models/filters/:filterName` supports `page/size` and returns pagination metadata with `hasMore`.
- **Labels**: Values come pre-unitized in `model` table; only booleans are formatted to `Yes/No` to avoid unit duplication.

## Architecture Components

### 1. Type Definitions (`types/model-filter.types.ts`)

```typescript
export enum ModelFilterType {
  CHECKBOX = 'checkbox', // Multi-select
  RADIO = 'radio', // Single-select
  BOOLEAN = 'boolean', // Yes/No toggle
}

export interface ModelFilterDefinition {
  name: string; // Property name (e.g., 'brandName')
  label: string; // Display label (e.g., 'Brand')
  type: ModelFilterType; // Filter type
  dbColumn: string; // Database column name
  unit?: string; // Display unit (e.g., 'GB', 'inch')
  categories: string[]; // Applicable categories
}
```

## Endpoints

### Aggregated filters

`GET /models/filters`

Query parameters (subset):

- `categoryName`: Category context (also appears as a selectable filter)
- `search`: Full-text search against `modelTitle`
- Any filter field (e.g., `brandName`, `processor`, `ram`, ...)
- `source`: `web` | `mobile` (default: `mobile`) controls per-filter caps
- `perFilterMaxValues`: override per-filter cap (5–20)

### 2. Filter Configuration (`config/model-filters.config.ts`)

**Common Filters:**

- `brandName` - Available across all categories
- `categoryName` - Category selection

**Category-Specific Filters:**

- **Laptop**: processor, RAM, storage (HDD/SSD), graphics card, screen, keyboard features
- **Mobile**: processor, RAM, storage, camera, battery, network, SIM
- **Tablet**: Similar to mobile + SIM support
- **TV/Monitor**: screen size, resolution, refresh rate, smart features
- **Desktop**: processor, RAM, storage, graphics card
- **Accessories**: accessory type

**Helper Functions:**

```typescript
getFiltersForCategory(categoryName: string): ModelFilterDefinition[]
getAllUniqueFilterNames(): string[]
getFilterByName(filterName: string, categoryName?: string): ModelFilterDefinition | undefined
isBooleanFilter(filterName: string): boolean
getBooleanFilterNames(): string[]
```

### 3. Constants & Utilities (`constants/model-filters.constants.ts`)

**Exported Constants:**

- `ALL_MODEL_FILTER_NAMES` - All unique filter names
- `COMMON_MODEL_FILTER_NAMES` - Common filter names
- `BOOLEAN_MODEL_FILTER_NAMES` - Boolean filter names
- `MODEL_FILTER_DISPLAY_ORDER` - Category-specific display order

**Utility Functions:**

```typescript
getFilterDisplayOrder(categoryName: string): string[]
getFilterValueLabel(filterName: string, value: any): string
isValidFilterName(filterName: string): boolean
isFilterApplicableToCategory(filterName: string, categoryName: string): boolean
getApplicableFilters(categoryName: string): string[]
```

**Validation Rules:**

```typescript
MODEL_FILTER_VALIDATION_RULES = {
  ram: { min: 1, max: 128, type: 'number' },
  mobileStorage: { min: 1, max: 2048, type: 'number' },
  storage: { min: 1, max: 10240, type: 'number' },
  storageSsd: { min: 1, max: 10240, type: 'number' },
  screenSize: { min: 0, max: 100, type: 'number' },
  batteryCapacity: { min: 0, max: 50000, type: 'number' },
};
```

## Key Improvements Over Legacy System

### ✅ Type Safety

**Before:**

```typescript
type FilterMap<T> = {
  key: keyof T | null; // ❌ Can be null!
  label: keyof T;
  type: 'checkbox' | 'radio' | 'range'; // ❌ String literals
  unit: string | null;
  alias?: string;
};
```

**After:**

```typescript
interface ModelFilterDefinition {
  name: string; // ✅ Always defined
  label: string;
  type: ModelFilterType; // ✅ Enum with type safety
  dbColumn: string; // ✅ Explicit DB mapping
  unit?: string;
  categories: string[]; // ✅ Clear applicability
}
```

### ✅ Boolean Filter Handling

**Before:**

```typescript
{
  key: null,              // ❌ Inconsistent
  label: 'hasTouchScreen',
  type: 'radio',          // ❌ Wrong type
  unit: null,
}
```

**After:**

```typescript
{
  name: 'hasTouchScreen',
  label: 'Touch Screen',
  type: ModelFilterType.BOOLEAN,  // ✅ Correct type
  dbColumn: 'touch_screen',
  categories: ['Laptop', 'Desktop Computer'],
}
```

### ✅ No Duplication

**Before:** Brand filter repeated in every category switch case

**After:** Defined once in `COMMON_MODEL_FILTERS`, automatically applied to all categories

Additionally, when a `categoryName` is provided, the `brandName` filter is shown under `categoryFilters` to reflect category context.

### ✅ Single Source of Truth

**Before:** Switch statement with hardcoded arrays per category

**After:** Centralized configuration with helper functions

### ✅ Rich Metadata

- Explicit database column mapping
- Unit information for display
- Category applicability
- Filter type enforcement

## Usage Examples

### Get Filters for a Category

```typescript
import { getFiltersForCategory } from '@modules/models/config/model-filters.config';

const laptopFilters = getFiltersForCategory('Laptop');
// Returns: [brandName, categoryName, laptopType, processor, ram, ...]
```

### Check Filter Applicability

```typescript
import { isFilterApplicableToCategory } from '@modules/models/constants/model-filters.constants';

const isApplicable = isFilterApplicableToCategory('processor', 'Laptop');
// Returns: true

const notApplicable = isFilterApplicableToCategory('accessoryType', 'Laptop');
// Returns: false
```

### Format Filter Values

```typescript
import { getFilterValueLabel } from '@modules/models/constants/model-filters.constants';

const label1 = getFilterValueLabel('ram', '16GB');
// Returns: "16GB" (models store unitized values; no extra unit appended)

const label2 = getFilterValueLabel('hasTouchScreen', true);
// Returns: "Yes"

const label3 = getFilterValueLabel('screenSize', '15.6"');
// Returns: "15.6\""
```

### Get Display Order

```typescript
import { getFilterDisplayOrder } from '@modules/models/constants/model-filters.constants';

const order = getFilterDisplayOrder('Mobile');
// Returns: ['brandName', 'processor', 'ram', 'mobileStorage', 'batteryCapacity', ...]
```

### Validate Filter Values

```typescript
import { MODEL_FILTER_VALIDATION_RULES } from '@modules/models/constants/model-filters.constants';

const ramRule = MODEL_FILTER_VALIDATION_RULES.ram;
// { min: 1, max: 128, type: 'number' }

// Use in validation logic
if (value < ramRule.min || value > ramRule.max) {
  throw new Error(`RAM must be between ${ramRule.min} and ${ramRule.max} GB`);
}
```

## Benefits

### 🎯 Maintainability

- **Single Configuration**: Add/modify filters in one place
- **Auto-Generated Constants**: No manual sync needed
- **Clear Structure**: Easy to understand and modify

### 🔒 Type Safety

- **Enum Types**: Compile-time type checking
- **Proper Interfaces**: Full IntelliSense support
- **No Null Keys**: Consistent structure

### ⚡ Performance

- **Single Table**: No complex joins needed
- **Optimized Queries**: Direct column access
- **Efficient Filtering**: Simple WHERE clauses

### 🧪 Testability

- **Pure Functions**: Easy to unit test
- **Validation Rules**: Built-in validation support
- **Helper Functions**: Isolated, testable utilities

### 📱 Extensibility

- **Easy to Add Filters**: Just add to config
- **Category Support**: Automatic category handling
- **Validation Ready**: Built-in validation framework

## Migration from Legacy System

The legacy `model-filters.constant.ts` (switch-based) can be gradually replaced:

1. ✅ **New files created** - Types, config, constants
2. ⏳ **Service layer** - Update to use new config
3. ⏳ **Repository layer** - Simplify queries using new metadata
4. ⏳ **Remove legacy** - Delete old `FilterMap` type and switch statement

## Comparison with Listings Module

| Feature           | Listings                                | Models                       |
| ----------------- | --------------------------------------- | ---------------------------- |
| **Data Source**   | Multi-table (listings + specifications) | Single table (model)         |
| **Join Config**   | Required for complex queries            | Not needed                   |
| **Filter Source** | LISTING vs SPECIFICATION                | All from MODEL table         |
| **Complexity**    | Higher (interdependent filters, joins)  | Lower (direct column access) |
| **Architecture**  | Similar structure, more complex         | Simplified, optimized        |

Both modules now share similar **type safety**, **configuration approach**, and **helper functions**, but models module is **simpler** due to single-table architecture.

## Future Enhancements

- [ ] Add filter dependencies (e.g., generation depends on processor)
- [ ] Implement filter value caching
- [ ] Search within filter values (current search applies to model titles)
- [ ] Support for range filters (e.g., price range)
- [ ] Mobile-specific filter subsets
- [ ] Filter analytics and usage tracking
