# Delivery Charges Breakdown Implementation

## Overview

Implemented delivery charges storage at both `OrderSource` (shop level) and `OrderItem` (item level) to provide complete financial transparency and enable accurate cost tracking across the order hierarchy.

## Business Justification

### Why This Improvement Was Needed:

1. **Multi-shop Orders**: Orders can contain items from multiple shops with different delivery charges
2. **Financial Transparency**: Sellers need to see their specific delivery revenue/costs
3. **Accurate Accounting**: Item-level charges enable precise cost breakdown per product
4. **Reporting & Analytics**: Calculate delivery revenue per shop and analyze costs by category/item
5. **Dispute Resolution**: Clear breakdown for customer inquiries and partial refunds/returns
6. **Profitability Tracking**: Track margins including delivery costs at granular levels

## Data Hierarchy

```
Order (aggregated)
├── deliveryAmount: Total delivery charges for entire order
│
├── OrderSource (shop/location level)
│   ├── deliveryCharges: Total delivery charges for this shop
│   │
│   └── OrderItem (item level)
│       └── deliveryCharges: Delivery charges for this specific item
```

### Calculation Logic:

```
Order.deliveryAmount = SUM(OrderSource.deliveryCharges)
OrderSource.deliveryCharges = SUM(OrderItem.deliveryCharges for that source)
OrderItem.deliveryCharges = (per-unit charge from shipping service) * quantity
```

## Implementation Details

### 1. Entity Changes

#### `OrderSource` Entity

**File**: `src/modules/orders/entities/order-source.entity.ts`

```typescript
@Property({ type: 'decimal', precision: 10, scale: 2, defaultRaw: `0.00` })
deliveryCharges!: string & Opt;
```

#### `OrderItem` Entity

**File**: `src/modules/orders/entities/order-item.entity.ts`

```typescript
@Property({ type: 'decimal', precision: 10, scale: 2, defaultRaw: `0.00` })
deliveryCharges!: string & Opt;
```

### 2. Order Creation Service Updates

**File**: `src/modules/orders/services/order-creation.service.ts`

#### Changes Made:

1. **Extract Per-Item Delivery Charges**: Parse shipping service response to build a map of delivery charges by listing ID
2. **Calculate OrderSource Delivery Charges**: Aggregate item-level charges for each shop/location
3. **Populate OrderItem Delivery Charges**: Store per-item charges (unit charge × quantity)

#### Key Code Sections:

**Building Delivery Charges Map** (Lines 119-141):

```typescript
const deliveryChargesByListingId = new Map<number, number>();

if (deliveryChargesResult.success && deliveryChargesResult.data) {
  const shippingData = deliveryChargesResult.data as any;
  deliveryChargeAmount = shippingData.totalShippingCharges || 0;

  // Extract per-item delivery charges from shipping response
  if (shippingData.shops && Array.isArray(shippingData.shops)) {
    for (const shop of shippingData.shops) {
      if (shop.categories && Array.isArray(shop.categories)) {
        for (const category of shop.categories) {
          if (category.items && Array.isArray(category.items)) {
            for (const item of category.items) {
              deliveryChargesByListingId.set(item.listingId, item.shippingCharge || 0);
            }
          }
        }
      }
    }
  }
}
```

**OrderSource Delivery Charges** (Lines 296-309):

```typescript
// Calculate total delivery charges for this order source
const totalDeliveryCharges = group.items.reduce((acc, { item }) => {
  const deliveryCharge = deliveryChargesByListingId.get(item.listingId) || 0;
  return acc + deliveryCharge * Number(item.quantity || 0);
}, 0);

const orderSource = em.create(OrderSource, {
  order,
  shop: group.shopId,
  location: group.locationId,
  quantity: totalQuantity,
  amount: totalAmount.toFixed(2),
  discountValue: totalDiscount.toFixed(2),
  deliveryCharges: totalDeliveryCharges.toFixed(2),
} as any);
```

**OrderItem Delivery Charges** (Lines 318-336):

```typescript
// Get delivery charge for this specific item
const itemDeliveryCharge = deliveryChargesByListingId.get(item.listingId) || 0;
const totalItemDeliveryCharge = itemDeliveryCharge * Number(item.quantity || 0);

em.create(OrderItem, {
  listing: item.listingId,
  orderSource,
  quantity: item.quantity,
  productTitle: listing.listingTitle,
  productPrimaryImage: listing.primaryImage || '',
  condition: listing.conditionName || '',
  category: listing.categoryName || '',
  price: item.unitPrice.toFixed(2),
  discount: listing.effectiveDiscount || DEFAULT_DECIMAL,
  orderNumber: order.orderNumber,
  salePrice: String(onlinePrice),
  minCostPrice: String(minCost),
  maxCostPrice: String(maxCost),
  deliveryCharges: totalItemDeliveryCharge.toFixed(2),
} as any);
```

### 3. Response DTO Updates

**File**: `src/modules/orders/dto/orders/order-response.dto.ts`

#### `OrderItemResponseDto`:

```typescript
@ApiProperty({ example: '500.00', description: 'Delivery charges for this item (quantity * per-unit charge)' })
deliveryCharges: string;
```

#### `OrderSourceResponseDto`:

```typescript
@ApiProperty({ example: '1000.00', description: 'Total delivery charges for this shop' })
deliveryCharges: string;
```

### 4. Database Migration

**File**: `migrations/add-delivery-charges-to-order-source-and-item.sql`

```sql
-- Add delivery_charges to order_source table
ALTER TABLE `order_source`
ADD COLUMN `delivery_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00
COMMENT 'Total delivery charges for this shop/source'
AFTER `voucher_discount`;

-- Add delivery_charges to order_item table
ALTER TABLE `order_item`
ADD COLUMN `delivery_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00
COMMENT 'Delivery charges for this item (quantity * per-unit charge)'
AFTER `max_cost_price`;
```

## API Response Structure

### Example Order Response:

```json
{
  "id": 1,
  "orderNumber": "TB-1234567890123-1",
  "deliveryAmount": "1500.00",
  "orderSources": [
    {
      "id": 1,
      "shopId": 1095,
      "deliveryCharges": "1000.00",
      "orderItems": [
        {
          "id": 1,
          "listingId": 12345,
          "productTitle": "Apple MacBook Pro",
          "quantity": 1,
          "price": "135000.00",
          "deliveryCharges": "500.00"
        },
        {
          "id": 2,
          "listingId": 12346,
          "productTitle": "Magic Mouse",
          "quantity": 1,
          "price": "8000.00",
          "deliveryCharges": "500.00"
        }
      ]
    },
    {
      "id": 2,
      "shopId": 2050,
      "deliveryCharges": "500.00",
      "orderItems": [
        {
          "id": 3,
          "listingId": 54321,
          "productTitle": "iPhone 15 Pro",
          "quantity": 1,
          "price": "450000.00",
          "deliveryCharges": "500.00"
        }
      ]
    }
  ]
}
```

## Benefits

### 1. **Financial Transparency**

- Shop owners see exact delivery revenue for their items
- Customers get detailed breakdown of delivery costs
- Finance team has granular data for accounting

### 2. **Multi-Shop Support**

- Proper attribution when order contains items from multiple shops
- Each shop's delivery charges tracked independently
- Supports different delivery rates per shop location

### 3. **Returns & Refunds**

- Accurate delivery charge refund calculations for partial returns
- Clear audit trail for dispute resolution
- Support for item-specific refund policies

### 4. **Analytics & Reporting**

- Calculate delivery revenue per shop
- Analyze delivery costs by category/item
- Track profitability including delivery margins
- Identify high-cost delivery scenarios

### 5. **Commission Tracking**

- If platform charges commission on delivery, easier tracking
- Shop-level delivery revenue clearly separated
- Supports complex commission structures

## Delivery Charges Calculation Logic

### Overview

The delivery charge calculation is handled by `ShippingService.calculateShipping()` and uses a sophisticated multi-factor approach based on:

- **Shop location** (origin city)
- **Customer location** (destination city)
- **Product category** (different categories have different shipping costs)
- **Product weight** (average weight per category)

### Step-by-Step Calculation Process

#### 1. Data Collection

The system fetches listing details for all cart items:

- `listingId` - Item identifier
- `city` - Shop's city (origin)
- `category` - Product category
- `shop` - Shop information

Creates a metadata map with:

- `shopCityId`: Where the item is being shipped FROM
- `categoryId` & `categoryName`: Product category
- `shopId`: Which shop owns the item

#### 2. Fetch Delivery Charge Configuration

The system queries the `delivery_charges` table based on:

- **Shop City ID** + **Category ID** combination

```sql
SELECT * FROM delivery_charges
WHERE city IN (shopCityIds)
  AND category IN (categoryIds)
  AND is_deleted = 0
```

The `DeliveryCharges` entity contains:

- `intraCityCharges`: Cost for same-city delivery
- `interCityCharges`: Cost for different-city delivery
- `averageWeight`: Weight multiplier for the category

#### 3. Per-Item Calculation

For each cart item, the system:

**A. Determines City Match**

```typescript
const isSameCity = shopCityId === destinationCityId;
```

**B. Gets Charge Rates**

```typescript
// Try to find configured rate for this shop city + category
const deliveryCharge = deliveryChargesMap.get(`${shopCityId}::${categoryId}`);

// If not found, use category defaults from constants
const defaults = DEFAULT_DELIVERY_CHARGES[categoryName.toLowerCase()];

const intraCityCharge = deliveryCharge?.intraCityCharges || defaults.intraCityCharges;
const interCityCharge = deliveryCharge?.interCityCharges || defaults.interCityCharges;
const averageWeight = deliveryCharge?.averageWeight || defaults.averageWeight;
```

**C. Calculates Final Charge**

```typescript
const baseCharge = isSameCity ? intraCityCharge : interCityCharge;
const shippingCharge = baseCharge * averageWeight;
```

**Formula:**

```
Per-Item Delivery Charge = (Intra/Inter City Rate) × Average Weight
```

### Default Delivery Charges (Fallback Values)

When no specific configuration exists in the database:

| Category        | Intra-City | Inter-City | Avg Weight | Example Charge |
| --------------- | ---------- | ---------- | ---------- | -------------- |
| **Mobile**      | ₨100       | ₨200       | 0.5 kg     | ₨50-100        |
| **Laptop**      | ₨150       | ₨300       | 2 kg       | ₨300-600       |
| **Tablet**      | ₨100       | ₨200       | 0.8 kg     | ₨80-160        |
| **TV/Monitor**  | ₨200       | ₨400       | 5 kg       | ₨1,000-2,000   |
| **Desktop**     | ₨200       | ₨400       | 8 kg       | ₨1,600-3,200   |
| **Accessories** | ₨50        | ₨100       | 0.2 kg     | ₨10-20         |
| **Default**     | ₨150       | ₨250       | 1 kg       | ₨150-250       |

### Calculation Examples

#### Example 1: Single Item - Same City

```
Item: MacBook Pro (Laptop)
Shop City: Lahore
Destination: Lahore
Category: Laptop

Calculation:
- isSameCity = true
- baseCharge = intraCityCharges = ₨150
- averageWeight = 2 kg
- shippingCharge = ₨150 × 2 = ₨300
```

#### Example 2: Single Item - Different City

```
Item: iPhone 15 (Mobile)
Shop City: Karachi
Destination: Islamabad
Category: Mobile

Calculation:
- isSameCity = false
- baseCharge = interCityCharges = ₨200
- averageWeight = 0.5 kg
- shippingCharge = ₨200 × 0.5 = ₨100
```

#### Example 3: Multi-Shop Order

```
Cart:
1. MacBook Pro (Shop A in Lahore) → Islamabad
   - ₨300 × 2 kg = ₨600

2. iPhone 15 (Shop B in Karachi) → Islamabad
   - ₨200 × 0.5 kg = ₨100

3. Magic Mouse (Shop A in Lahore) → Islamabad
   - ₨100 × 0.2 kg = ₨20

Total Delivery: ₨720

Breakdown by Shop:
- Shop A: ₨620 (MacBook + Mouse)
- Shop B: ₨100 (iPhone)
```

### Shipping Service Response Structure

The service returns charges grouped by **Shop → Category → Items**:

```json
{
  "shops": [
    {
      "shopId": 1095,
      "categories": [
        {
          "categoryId": 1,
          "categoryName": "Laptop",
          "shopCityId": 3,
          "destinationCityId": 1,
          "isSameCity": false,
          "itemCount": 1,
          "totalShippingCharge": 600,
          "items": [
            {
              "listingId": 12345,
              "shippingCharge": 600
            }
          ]
        }
      ]
    }
  ],
  "totalShippingCharges": 600
}
```

### Integration with Order Creation

The delivery charges flow through three levels:

1. **Order Level**: `Order.deliveryAmount` = Total from shipping service
2. **OrderSource Level**: `OrderSource.deliveryCharges` = Sum of items in that shop
3. **OrderItem Level**: `OrderItem.deliveryCharges` = Per-item charge × quantity

```typescript
// Extract from shipping response
deliveryChargesByListingId.set(listingId, shippingCharge);

// OrderItem calculation
const itemDeliveryCharge = deliveryChargesByListingId.get(listingId) || 0;
const totalItemDeliveryCharge = itemDeliveryCharge × quantity;

// OrderSource calculation
const totalDeliveryCharges = group.items.reduce((acc, { item }) => {
  const deliveryCharge = deliveryChargesByListingId.get(item.listingId) || 0;
  return acc + deliveryCharge * Number(item.quantity || 0);
}, 0);
```

### Key Features

✅ **Dynamic Pricing**: Different rates for intra-city vs inter-city  
✅ **Category-Based**: Heavier items (Desktop, TV) cost more  
✅ **Weight Multiplier**: Accounts for shipping complexity  
✅ **Fallback Defaults**: System works even without DB configuration  
✅ **Multi-Shop Support**: Properly attributes charges per shop  
✅ **Granular Tracking**: Charges stored at Order → Source → Item levels

## Data Consistency

### Validation Rules:

```
✓ Order.deliveryAmount = SUM(OrderSource.deliveryCharges)
✓ OrderSource.deliveryCharges = SUM(OrderItem.deliveryCharges)
✓ All values stored as DECIMAL(10, 2) for precision
✓ Default value of 0.00 ensures no NULL issues
```

## Migration Steps

1. **Run Database Migration**:

   ```bash
   # Execute the SQL migration file
   mysql -u username -p database_name < migrations/add-delivery-charges-to-order-source-and-item.sql
   ```

2. **Verify Schema Changes**:

   ```sql
   DESCRIBE order_source;
   DESCRIBE order_item;
   ```

3. **Test Order Creation**:

   - Create new orders and verify delivery charges are populated
   - Check API responses include new fields
   - Validate calculations match expected values

4. **Backfill Existing Data** (Optional):
   ```sql
   -- If needed, backfill existing orders with 0.00 or calculated values
   UPDATE order_source SET delivery_charges = 0.00 WHERE delivery_charges IS NULL;
   UPDATE order_item SET delivery_charges = 0.00 WHERE delivery_charges IS NULL;
   ```

## Files Modified

1. `src/modules/orders/entities/order-source.entity.ts` - Added deliveryCharges field
2. `src/modules/orders/entities/order-item.entity.ts` - Added deliveryCharges field
3. `src/modules/orders/services/order-creation.service.ts` - Updated order creation logic
4. `src/modules/orders/dto/orders/order-response.dto.ts` - Added fields to response DTOs
5. `migrations/add-delivery-charges-to-order-source-and-item.sql` - Database migration script

## Testing Checklist

- [ ] Database migration executed successfully
- [ ] New orders populate delivery charges correctly
- [ ] OrderSource.deliveryCharges = SUM(OrderItem.deliveryCharges)
- [ ] Order.deliveryAmount = SUM(OrderSource.deliveryCharges)
- [ ] API responses include new fields
- [ ] Multi-shop orders calculate charges correctly
- [ ] Single-item orders work as expected
- [ ] Zero delivery charge scenarios handled properly
- [ ] Existing orders still function (backward compatibility)

## Future Enhancements

1. **Delivery Charge Adjustments**: Support manual adjustments at any level
2. **Voucher Application**: Apply delivery discounts at appropriate level
3. **Partial Refunds**: Calculate delivery charge refunds for partial returns
4. **Delivery Analytics Dashboard**: Visualize delivery costs and revenue
5. **Commission Calculations**: Include delivery charges in commission logic
