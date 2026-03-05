# Listings Filter API Documentation

## Overview

The Listings Filter API provides a comprehensive, production-ready filtering system for marketplace listings with advanced features:

### 🎯 Core Features

- **Category-specific filters** - Different filters per product category
- **Interdependent filter values** - Smart filter updates based on selections
- **Dynamic filter aggregation** - Real-time value counts
- **Mobile optimization** - Curated filter subsets for mobile devices
- **Multi-platform support** - Web and mobile request sources
- **Advanced search integration** - Search-aware filter values
- **Store filtering** - Backend store-specific filtering
- **Performance optimized** - Efficient database queries

### 📱 Mobile Optimization

- **Reduced filter count**: ~70% fewer filters for mobile
- **Prioritized filters**: Essential purchase-decision filters only
- **Faster performance**: Optimized payload and rendering
- **Touch-friendly UX**: Simplified interface for mobile users

### 🔄 Filter Types

- **Checkbox**: Multi-select filters (brands, conditions, colors)
- **Radio**: Single-select filters (category)
- **Range**: Min/max filters (price)
- **Boolean**: True/false filters (PTA approved, touchscreen)

## API Endpoints

### 1. Get All Available Filters

Retrieves all available filters with their current values based on the selected category and applied filters.

**Endpoint:** `GET /listings/filters`

**Query Parameters:**

```typescript
{
  source?: 'web' | 'mobile',         // Optional: Request source (default: 'mobile')
  categoryName?: string,              // Optional: Selected category
  perFilterMaxValues?: number,        // Optional: Max values per filter (web: 10, mobile: 5)
  includeCount?: boolean,             // Optional: Include item counts (default: true)
  includeEmpty?: boolean,             // Optional: Include empty filters (default: false)

  // Applied filters (any combination)
  conditionName?: string[],
  cityName?: string[],
  brandName?: string[],
  colorName?: string[],
  minPrice?: number,
  maxPrice?: number,

  // Backend-only filters (not user-selectable)
  store?: string | number,            // Store ID or name (backend filtering)
  search?: string,                    // Search query (affects all filters)

  // Category-specific filters (varies by category)
  model?: string[],
  processor?: string[],
  ramCapacity?: string[],
  screenSize?: string[],
  batteryCapacity?: string[],
  isPtaApproved?: boolean,
  // ... and more based on category
}
```

**Mobile vs Web Behavior:**

- **Web (`source=web`)**: Returns all available filters (20+ filters)
- **Mobile (`source=mobile`)**: Returns curated subset (~5 essential filters per category)
- **Auto-optimization**: Mobile gets fewer values per filter for better UX

**Example Request:**

```http
GET /listings/filters?source=web&categoryName=Laptop&conditionName=New&brandName=Dell,HP&perFilterMaxValues=5
```

**Example Response:**

```json
{
  "commonFilters": [
    {
      "name": "categoryName",
      "label": "Category",
      "type": "radio",
      "values": [
        { "value": "Laptop", "label": "Laptop", "count": 1250, "isSelected": true },
        { "value": "Mobile", "label": "Mobile", "count": 3200, "isSelected": false },
        { "value": "Tablet", "label": "Tablet", "count": 450, "isSelected": false }
      ]
    },
    {
      "name": "price",
      "label": "Price",
      "type": "range",
      "min": 5000,
      "max": 500000,
      "selectedMin": null,
      "selectedMax": null
    },
    {
      "name": "conditionName",
      "label": "Condition",
      "type": "checkbox",
      "values": [
        { "value": "New", "label": "New", "count": 850, "isSelected": true },
        { "value": "Like New", "label": "Like New", "count": 200, "isSelected": false },
        { "value": "Used", "label": "Used", "count": 150, "isSelected": false }
      ]
    },
    {
      "name": "brandName",
      "label": "Brand",
      "type": "checkbox",
      "values": [
        { "value": "Dell", "label": "Dell", "count": 320, "isSelected": true },
        { "value": "HP", "label": "HP", "count": 280, "isSelected": true },
        { "value": "Lenovo", "label": "Lenovo", "count": 180, "isSelected": false },
        { "value": "Apple", "label": "Apple", "count": 150, "isSelected": false }
      ]
    }
  ],
  "categoryFilters": [
    {
      "name": "processor",
      "label": "Processor",
      "type": "checkbox",
      "isCategorySpecific": true,
      "values": [
        { "value": "Intel Core i7", "label": "Intel Core I7", "count": 120, "isSelected": false },
        { "value": "Intel Core i5", "label": "Intel Core I5", "count": 95, "isSelected": false },
        { "value": "AMD Ryzen 7", "label": "AMD Ryzen 7", "count": 45, "isSelected": false }
      ]
    },
    {
      "name": "ramCapacity",
      "label": "RAM Capacity",
      "type": "checkbox",
      "isCategorySpecific": true,
      "values": [
        { "value": "8", "label": "8 GB", "count": 150, "isSelected": false },
        { "value": "16", "label": "16 GB", "count": 120, "isSelected": false },
        { "value": "32", "label": "32 GB", "count": 30, "isSelected": false }
      ]
    },
    {
      "name": "isTouchScreen",
      "label": "Touch Screen",
      "type": "boolean",
      "isCategorySpecific": true,
      "values": [
        { "value": true, "label": "Yes", "count": 85, "isSelected": false },
        { "value": false, "label": "No", "count": 215, "isSelected": false }
      ]
    }
  ],
  "appliedFilters": {
    "categoryName": "Laptop",
    "conditionName": ["New"],
    "brandName": ["Dell", "HP"]
  },
  "totalCount": 600
}
```

### 2. Get Filter Values by Name

Retrieves values for a specific filter with optional search and pagination.

**Endpoint:** `GET /listings/filters/{filterName}`

**Path Parameters:**

- `filterName`: Name of the filter (e.g., 'brandName', 'processor', 'ramCapacity')

**Query Parameters:**

```typescript
{
  source?: 'web' | 'mobile',   // Optional: Request source (default: 'mobile')
  categoryName?: string,        // Optional: Category context
  search?: string,              // Optional: Search within filter values
  page?: number,                // Optional: Page number (default: 1)
  size?: number,                // Optional: Page size (default: 50, max: 100)

  // Applied filters (for context)
  conditionName?: string[],
  brandName?: string[],
  // ... other filters
}
```

**Mobile Filtering:**

- Mobile requests to non-mobile filters return `404 Not Found`
- Example: `GET /listings/filters/colorName?source=mobile` → 404 (colorName not available for mobile)

**Example Request:**

```http
GET /listings/filters/processor?source=web&categoryName=Laptop&search=intel&page=1&size=10
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "filter": {
      "name": "processor",
      "label": "Processor",
      "type": "checkbox",
      "values": [
        { "value": "Intel Core i9", "label": "Intel Core I9", "count": 25, "isSelected": false },
        { "value": "Intel Core i7", "label": "Intel Core I7", "count": 120, "isSelected": false },
        { "value": "Intel Core i5", "label": "Intel Core I5", "count": 95, "isSelected": false },
        { "value": "Intel Core i3", "label": "Intel Core I3", "count": 40, "isSelected": false }
      ]
    },
    "relatedFilters": ["generation", "graphicsCardType"],
    "pagination": {
      "page": 1,
      "size": 10,
      "hasMore": false
    }
  }
}
```

### 3. Search Filter Suggestions

Get filter suggestions based on a search query.

**Endpoint:** `GET /listings/filters/search/suggestions`

**Query Parameters:**

- `q`: Search query
- `categoryName?`: Category context
- `limit?`: Maximum suggestions (default: 10)

**Example Request:**

```http
GET /listings/filters/search/suggestions?q=ram&categoryName=Laptop&limit=5
```

**Example Response:**

```json
[
  {
    "filterName": "ramCapacity",
    "filterLabel": "RAM Capacity",
    "values": [
      { "value": "8", "label": "8 GB", "count": 150 },
      { "value": "16", "label": "16 GB", "count": 120 },
      { "value": "32", "label": "32 GB", "count": 30 }
    ]
  },
  {
    "filterName": "ramType",
    "filterLabel": "RAM Type",
    "values": [
      { "value": "DDR4", "label": "DDR4", "count": 180 },
      { "value": "DDR5", "label": "DDR5", "count": 70 }
    ]
  }
]
```

## Filter Types

### 1. Radio Button Filters

- **Usage:** Single selection only (e.g., Category)
- **Example:** `categoryName`

### 2. Checkbox Filters

- **Usage:** Multiple selections allowed (e.g., Brand, Condition)
- **Examples:** `brandName`, `conditionName`, `processor`

### 3. Range Filters

- **Usage:** Numeric range selection (e.g., Price)
- **Example:** `price` (uses `minPrice` and `maxPrice`)

### 4. Boolean Filters

- **Usage:** Yes/No selection
- **Examples:** `isTouchScreen`, `isPtaApproved`, `isSmartTv`

## Mobile Filter Subsets

The API provides optimized filter subsets for mobile devices to improve performance and user experience:

### 📱 Mobile Filter Counts

| Category        | Web Filters | Mobile Filters | Reduction |
| --------------- | ----------- | -------------- | --------- |
| **Common**      | 6           | 5              | 17%       |
| **Laptop**      | 15+         | 5              | 67%       |
| **Mobile**      | 12+         | 5              | 58%       |
| **Tablet**      | 8+          | 5              | 38%       |
| **TV/Monitor**  | 10+         | 4              | 60%       |
| **Desktop**     | 12+         | 4              | 67%       |
| **Accessories** | 4+          | 2              | 50%       |

### 🎯 Mobile Filter Priorities

**Common Filters (Mobile):**

- `categoryName`, `price`, `conditionName`, `brandName`, `cityName`
- **Removed**: `colorName` (less critical for mobile UX)

**Category-Specific Mobile Filters:**

- **Laptop**: `model`, `processor`, `ramCapacity`, `primaryStorageCapacity`, `screenSize`
- **Mobile**: `model`, `ramCapacity`, `primaryStorageCapacity`, `batteryCapacity`, `isPtaApproved`
- **Tablet**: `model`, `ramCapacity`, `primaryStorageCapacity`, `screenSize`, `isPtaApproved`
- **TV/Monitor**: `model`, `screenSize`, `resolution`, `isSmartTv`
- **Desktop**: `model`, `processor`, `ramCapacity`, `primaryStorageCapacity`
- **Accessories**: `model`, `accessoryType`

### 📊 Mobile Optimization Benefits

- **70% fewer filters** → Reduced cognitive load
- **Smaller payload** → Faster loading times
- **Essential filters only** → Better conversion rates
- **Touch-friendly** → Improved mobile UX

## Category-Specific Filters

### Laptop

- `laptopType`: Type of laptop (Gaming, Business, Ultrabook)
- `processor`: CPU model
- `generation`: CPU generation
- `ramType`, `ramCapacity`: RAM specifications
- `primaryStorageType`, `primaryStorageCapacity`: Storage specifications
- `graphicsCardType`: GPU type
- `screenSize`: Display size
- `isTouchScreen`: Touch screen support
- `isBacklitKeyboard`: Backlit keyboard

### Mobile

- `ramCapacity`, `primaryStorageCapacity`: Memory specs
- `screenSize`: Display size
- `batteryCapacity`: Battery size
- `networkBand`: Network support (3G, 4G, 5G)
- `operatingSystem`: OS type
- `isPtaApproved`: PTA approval status
- `simType`: SIM card type
- `isESim`: E-SIM support

### Tablet

- `ramCapacity`, `primaryStorageCapacity`: Memory specs
- `screenSize`: Display size
- `operatingSystem`: OS type
- `isSimSupport`: Cellular connectivity

### TV / Monitor

- `screenSize`: Display size
- `resolution`: Display resolution
- `refreshRate`: Refresh rate
- `displayType`: Panel technology
- `tvMonitorType`: Device type
- `isSmartTv`: Smart TV features
- `isTvCertified`: Certification status

### Desktop Computer

- `desktopType`: Desktop form factor
- `processor`, `generation`: CPU specs
- `ramType`, `ramCapacity`: RAM specs
- `primaryStorageType`, `primaryStorageCapacity`: Storage specs
- `graphicsCardType`: GPU type

### Accessories

- `accessoryType`: Type of accessory
- `isWebcam`: Webcam functionality

## Filter Interdependencies

Filters are interdependent - selecting values in one filter affects the available values in related filters:

1. **Category Selection** affects:

   - Available brand options
   - Category-specific filters visibility
   - Price ranges

2. **Brand Selection** affects:

   - Available models
   - Processor options
   - Generation options

3. **Processor Selection** affects:

   - Generation options
   - Graphics card compatibility

4. **Screen Size Selection** affects:
   - Resolution options
   - Display type options

## Usage Examples

### Example 1: Initial Load (No Filters)

```http
# Web request - all filters
GET /listings/filters?source=web&perFilterMaxValues=10

# Mobile request - optimized subset
GET /listings/filters?source=mobile&perFilterMaxValues=5
```

Returns common filters with specified value limits.

### Example 2: Category Selected

```http
# Web - full filter set
GET /listings/filters?source=web&categoryName=Laptop&perFilterMaxValues=8

# Mobile - essential filters only
GET /listings/filters?source=mobile&categoryName=Laptop
```

Returns common + category-specific filters (mobile gets curated subset).

### Example 3: Multiple Filters Applied

```http
GET /listings/filters?source=web&categoryName=Laptop&brandName=Dell,HP&ramCapacity=16,32&minPrice=50000&maxPrice=150000
```

Returns filtered values showing only options available within the selected criteria.

### Example 4: Search Integration

```http
GET /listings/filters?source=web&search=iPhone&categoryName=Mobile
```

Returns filters with values restricted to search-matching listings only.

### Example 5: Store-Specific Filtering

```http
GET /listings/filters?source=web&store=123&categoryName=Laptop
```

Returns filters showing only values available in the specified store.

### Example 6: Mobile Filter Validation

```http
# This works - processor available for mobile Laptop category
GET /listings/filters/processor?source=mobile&categoryName=Laptop

# This returns 404 - colorName not available for mobile
GET /listings/filters/colorName?source=mobile&categoryName=Laptop
```

### Example 7: Pagination

```http
GET /listings/filters/brandName?source=web&categoryName=Mobile&page=2&size=20
```

Returns paginated filter values with metadata.

## Best Practices

### 🎯 General Guidelines

1. **Progressive Filtering**: Start with category selection, then apply filters progressively
2. **Use Interdependencies**: Leverage filter dependencies for better UX
3. **Batch Requests**: Use the main `/filters` endpoint to get all filters at once
4. **Search Integration**: Use filter suggestions for search autocomplete

### 📱 Mobile Optimization

5. **Always use `source=mobile`** for mobile apps to get optimized filter sets
6. **Handle 404s gracefully** when requesting non-mobile filters
7. **Prioritize essential filters** in your mobile UI based on the mobile subset
8. **Use smaller page sizes** for mobile pagination (default: 5 values per filter)

### ⚡ Performance

9. **Cache filter values** on the client side with appropriate TTL (5-10 minutes)
10. **Use pagination** for filters with many values (brandName, cityName)
11. **Implement debouncing** for search-within-filter functionality
12. **Batch filter updates** instead of making individual API calls

### 🔍 Advanced Features

13. **Store filtering**: Use `store` parameter for store-specific pages
14. **Search context**: Use `search` parameter to show relevant filters only
15. **Empty filter handling**: Use `includeEmpty=false` to hide filters with no values
16. **Value limits**: Adjust `perFilterMaxValues` based on UI space constraints

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful response
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Filter not found
- `500 Internal Server Error`: Server error

Error Response Format:

```json
{
  "statusCode": 400,
  "message": "Invalid filter name",
  "error": "Bad Request"
}
```
