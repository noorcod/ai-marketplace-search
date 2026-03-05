# Filter API Testing Examples

## Prerequisites

Make sure your NestJS application is running:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` (or your configured port)

## 📱 Mobile vs Web Testing

The filter API now supports mobile optimization. Always test both sources:

- **Web (`source=web`)**: Full filter experience (20+ filters)
- **Mobile (`source=mobile`)**: Optimized subset (~5 essential filters per category)

## Testing with cURL

### 1. Basic Filter Requests

#### Web - All Filters

```bash
curl -X GET "http://localhost:3000/listings/filters?source=web&perFilterMaxValues=8" \
  -H "Accept: application/json"
```

#### Mobile - Optimized Subset

```bash
curl -X GET "http://localhost:3000/listings/filters?source=mobile&perFilterMaxValues=5" \
  -H "Accept: application/json"
```

### 2. Category-Specific Filters

#### Laptop Filters (Web vs Mobile)

```bash
# Web - Full laptop filter set
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop&perFilterMaxValues=10" \
  -H "Accept: application/json"

# Mobile - Essential laptop filters only (model, processor, RAM, storage, screen)
curl -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Laptop" \
  -H "Accept: application/json"
```

#### Mobile Device Filters

```bash
# Web - All mobile filters
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Mobile&perFilterMaxValues=8" \
  -H "Accept: application/json"

# Mobile - Essential mobile filters (model, RAM, storage, battery, PTA)
curl -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Mobile" \
  -H "Accept: application/json"
```

### 3. Interdependent Filtering

```bash
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop&brandName=Dell&brandName=HP&conditionName=New&minPrice=50000&maxPrice=150000" \
  -H "Accept: application/json"
```

### 4. Individual Filter Values (with Pagination)

```bash
# Get processor filter for laptops with pagination
curl -X GET "http://localhost:3000/listings/filters/processor?source=web&categoryName=Laptop&page=1&size=20" \
  -H "Accept: application/json"

# Get brand filter with search
curl -X GET "http://localhost:3000/listings/filters/brandName?source=web&search=dell&page=1&size=10" \
  -H "Accept: application/json"
```

### 5. Mobile Filter Validation

```bash
# This works - processor is available for mobile Laptop
curl -X GET "http://localhost:3000/listings/filters/processor?source=mobile&categoryName=Laptop" \
  -H "Accept: application/json"

# This returns 404 - colorName not available for mobile
curl -X GET "http://localhost:3000/listings/filters/colorName?source=mobile&categoryName=Laptop" \
  -H "Accept: application/json"
```

### 6. Advanced Features

#### Search Integration

```bash
curl -X GET "http://localhost:3000/listings/filters?source=web&search=iPhone&categoryName=Mobile" \
  -H "Accept: application/json"
```

#### Store-Specific Filtering

```bash
curl -X GET "http://localhost:3000/listings/filters?source=web&store=123&categoryName=Laptop" \
  -H "Accept: application/json"
```

#### Filter Suggestions

```bash
curl -X GET "http://localhost:3000/listings/filters/search/suggestions?q=ram&categoryName=Laptop&limit=5" \
  -H "Accept: application/json"
```

## Testing with Postman

### Collection Setup

1. Create a new Postman collection named "Marketplace Filters API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:3000`

### Request Examples

#### 1. Web vs Mobile Filter Comparison

```
Method: GET
URL: {{baseUrl}}/listings/filters
Query Params (Web):
  - source: web
  - categoryName: Laptop
  - perFilterMaxValues: 10
  - includeCount: true

Query Params (Mobile):
  - source: mobile
  - categoryName: Laptop
  - perFilterMaxValues: 5
```

#### 2. Laptop Filters with Applied Filters

```
Method: GET
URL: {{baseUrl}}/listings/filters
Query Params:
  - source: web
  - categoryName: Laptop
  - conditionName: New
  - conditionName: Like New
  - brandName: Dell
  - brandName: HP
  - minPrice: 50000
  - maxPrice: 200000
  - ramCapacity: 16
  - processor: Intel Core i7
```

#### 3. Mobile Device Filters with Search

```
Method: GET
URL: {{baseUrl}}/listings/filters
Query Params:
  - source: web
  - categoryName: Mobile
  - search: iPhone
  - isPtaApproved: true
  - networkBand: 5G
  - ramCapacity: 8
```

#### 4. Individual Filter with Pagination

```
Method: GET
URL: {{baseUrl}}/listings/filters/processor
Query Params:
  - source: web
  - categoryName: Laptop
  - search: intel
  - page: 1
  - size: 20
```

#### 5. Mobile Filter Validation (404 Test)

```
Method: GET
URL: {{baseUrl}}/listings/filters/colorName
Query Params:
  - source: mobile
  - categoryName: Laptop
Expected: 404 Not Found
```

#### 6. Store-Specific Filtering

```
Method: GET
URL: {{baseUrl}}/listings/filters
Query Params:
  - source: web
  - store: 123
  - categoryName: Laptop
```

#### 7. Filter Suggestions

```
Method: GET
URL: {{baseUrl}}/listings/filters/search/suggestions
Query Params:
  - q: screen
  - categoryName: TV / Monitor
  - limit: 10
```

## Test Scenarios

### Scenario 1: Mobile vs Web Filter Comparison

Test the difference between mobile and web filter responses:

```bash
# Web - Full filter set
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop"

# Mobile - Optimized subset (only 5 essential filters)
curl -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Laptop"

# Compare the response sizes and filter counts
```

### Scenario 2: Mobile Filter Validation

Test mobile filter restrictions:

```bash
# Valid mobile filter - should work
curl -X GET "http://localhost:3000/listings/filters/processor?source=mobile&categoryName=Laptop"

# Invalid mobile filter - should return 404
curl -X GET "http://localhost:3000/listings/filters/colorName?source=mobile&categoryName=Laptop"

# Invalid mobile filter - should return 404
curl -X GET "http://localhost:3000/listings/filters/graphicsCardType?source=mobile&categoryName=Laptop"
```

### Scenario 3: Progressive Filtering with Interdependencies

Test how filters update based on selections:

```bash
# Step 1: Select category
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop"

# Step 2: Add brand filter (affects model, processor options)
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop&brandName=Dell"

# Step 3: Add processor filter (affects generation, graphics options)
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop&brandName=Dell&processor=Intel Core i7"

# Step 4: Add price range
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop&brandName=Dell&processor=Intel Core i7&minPrice=80000&maxPrice=150000"
```

### Scenario 4: Search Integration

Test search-aware filtering:

```bash
# Search for iPhone - filters should show only iPhone-related values
curl -X GET "http://localhost:3000/listings/filters?source=web&search=iPhone&categoryName=Mobile"

# Search for gaming laptop - filters should show gaming-related values
curl -X GET "http://localhost:3000/listings/filters?source=web&search=gaming&categoryName=Laptop"
```

### Scenario 5: Store-Specific Filtering

Test backend store filtering:

```bash
# Get filters for specific store (store affects all filter values)
curl -X GET "http://localhost:3000/listings/filters?source=web&store=123&categoryName=Laptop"

# Compare with general filters (should show different available values)
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop"
```

### Scenario 6: Pagination Testing

Test filter value pagination:

```bash
# First page
curl -X GET "http://localhost:3000/listings/filters/brandName?source=web&page=1&size=10"

# Second page
curl -X GET "http://localhost:3000/listings/filters/brandName?source=web&page=2&size=10"

# Large page size
curl -X GET "http://localhost:3000/listings/filters/brandName?source=web&page=1&size=50"
```

### Scenario 7: Boolean Filters

Test boolean filter values:

```bash
# Laptop with touchscreen
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop&isTouchScreen=true"

# Mobile PTA approved
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Mobile&isPtaApproved=true"

# Smart TV
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=TV / Monitor&isSmartTv=true"
```

### Scenario 8: Error Cases

Test error handling:

```bash
# Invalid category
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=InvalidCategory"
# Expected: 400 Bad Request

# Invalid filter name
curl -X GET "http://localhost:3000/listings/filters/invalidFilter?source=web"
# Expected: 404 Not Found

# Invalid price range (min > max)
curl -X GET "http://localhost:3000/listings/filters?source=web&minPrice=100000&maxPrice=50000"
# Expected: 400 Bad Request

# Invalid pagination
curl -X GET "http://localhost:3000/listings/filters/brandName?source=web&page=0&size=200"
# Expected: 400 Bad Request

# Mobile filter not available
curl -X GET "http://localhost:3000/listings/filters/colorName?source=mobile"
# Expected: 404 Not Found
```

## Expected Response Structure

### Successful Filter Response (Web)

```json
{
  "success": true,
  "data": {
    "commonFilters": [
      {
        "name": "categoryName",
        "label": "Category",
        "type": "radio",
        "values": [
          {
            "value": "Laptop",
            "label": "Laptop",
            "count": 1250,
            "isSelected": true
          }
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
      }
    ],
    "categoryFilters": [
      {
        "name": "processor",
        "label": "Processor",
        "type": "checkbox",
        "isCategorySpecific": true,
        "values": [
          {
            "value": "Intel Core i7",
            "label": "Intel Core i7",
            "count": 120,
            "isSelected": false
          }
        ]
      }
    ],
    "appliedFilters": {
      "categoryName": "Laptop"
    },
    "totalCount": 1250
  }
}
```

### Mobile Response (Reduced Filters)

```json
{
  "success": true,
  "data": {
    "commonFilters": [
      // Only 5 common filters (colorName excluded)
      {"name": "categoryName", "label": "Category", "type": "radio", "values": [...]},
      {"name": "price", "label": "Price", "type": "range", "min": 5000, "max": 500000},
      {"name": "conditionName", "label": "Condition", "type": "checkbox", "values": [...]},
      {"name": "brandName", "label": "Brand", "type": "checkbox", "values": [...]},
      {"name": "cityName", "label": "City", "type": "checkbox", "values": [...]}
    ],
    "categoryFilters": [
      // Only 5 essential laptop filters
      {"name": "model", "label": "Model", "type": "checkbox", "values": [...]},
      {"name": "processor", "label": "Processor", "type": "checkbox", "values": [...]},
      {"name": "ramCapacity", "label": "RAM Capacity", "type": "checkbox", "values": [...]},
      {"name": "primaryStorageCapacity", "label": "Storage", "type": "checkbox", "values": [...]},
      {"name": "screenSize", "label": "Screen Size", "type": "checkbox", "values": [...]}
    ],
    "appliedFilters": {"categoryName": "Laptop"},
    "totalCount": 1250
  }
}
```

### Individual Filter Response (with Pagination)

```json
{
  "success": true,
  "data": {
    "filter": {
      "name": "processor",
      "label": "Processor",
      "type": "checkbox",
      "values": [{ "value": "Intel Core i7", "label": "Intel Core i7", "count": 120, "isSelected": false }]
    },
    "relatedFilters": ["generation", "graphicsCardType"],
    "pagination": {
      "page": 1,
      "size": 20,
      "hasMore": false
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid category name: InvalidCategory. Valid categories are: Laptop, Mobile, Tablet, TV / Monitor, Desktop Computer, Accessories",
  "error": "Bad Request"
}
```

### Mobile Filter Not Available (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Filter 'colorName' is not available for mobile requests in category 'Laptop'",
  "error": "Not Found"
}
```

## Performance Testing

### Load Test Example

Test filter performance with concurrent requests:

```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 "http://localhost:3000/listings/filters?source=web&categoryName=Laptop"

# Using curl with parallel requests
for i in {1..10}; do
  curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop" &
done
wait
```

## Integration Testing

### Test with Frontend

```javascript
// Example JavaScript/TypeScript code for frontend integration
async function fetchFilters(params) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`/api/listings/filters?${queryString}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Usage
const filters = await fetchFilters({
  source: 'web',
  categoryName: 'Laptop',
  brandName: ['Dell', 'HP'],
  minPrice: 50000,
  maxPrice: 150000,
});
```

## Debugging Tips

1. **Check Logs**: Monitor NestJS console for error messages
2. **Database Queries**: Enable query logging to see generated SQL
3. **Network Tab**: Use browser dev tools to inspect requests/responses
4. **Postman Console**: View detailed request/response data
5. **Validate Data**: Ensure database has sample data for testing

## Mobile-Specific Testing Checklist

### ✅ Mobile Filter Subset Validation

```bash
# Test each category's mobile subset
curl -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Laptop"
# Should return only: categoryName, price, conditionName, brandName, cityName + model, processor, ramCapacity, primaryStorageCapacity, screenSize

curl -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Mobile"
# Should return only: categoryName, price, conditionName, brandName, cityName + model, ramCapacity, primaryStorageCapacity, batteryCapacity, isPtaApproved
```

### ✅ Mobile Filter Restrictions

```bash
# These should return 404 for mobile
curl -X GET "http://localhost:3000/listings/filters/colorName?source=mobile"
curl -X GET "http://localhost:3000/listings/filters/graphicsCardType?source=mobile&categoryName=Laptop"
curl -X GET "http://localhost:3000/listings/filters/generation?source=mobile&categoryName=Laptop"
```

### ✅ Performance Comparison

```bash
# Compare response sizes
curl -s -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop" | wc -c
curl -s -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Laptop" | wc -c
# Mobile should be significantly smaller
```

### ✅ Value Limits

```bash
# Mobile should get fewer values per filter (default: 5)
curl -X GET "http://localhost:3000/listings/filters?source=mobile&categoryName=Laptop"
# Check that each filter has max 5 values

# Web should get more values per filter (default: 10)
curl -X GET "http://localhost:3000/listings/filters?source=web&categoryName=Laptop"
# Check that each filter has up to 10 values
```

## Common Issues and Solutions

### Issue 1: Mobile filter returns all filters instead of subset

**Solution**: Ensure `source=mobile` parameter is being passed and processed correctly

### Issue 2: Mobile filter request returns 404 for valid filters

**Solution**: Check if the filter is included in the mobile subset for that category

### Issue 3: No filter values returned

**Solution**: Check if database has listings with the specified criteria

### Issue 4: Slow response times

**Solution**: Add database indexes on filter columns (category_name, brand_name, etc.)

### Issue 5: Incorrect counts in interdependent filtering

**Solution**: Verify join conditions and filter application in repository methods

### Issue 6: Missing category filters

**Solution**: Ensure ListingSpecification table has data for the category

### Issue 7: Search not affecting filter values

**Solution**: Verify search parameter is being applied in applyInterdependentFilters method

### Issue 8: Store filtering not working

**Solution**: Check if store parameter is being processed and shop table joins are correct
