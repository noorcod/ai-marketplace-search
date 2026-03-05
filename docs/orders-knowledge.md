# Orders System Knowledge Base

## Payment Methods & Checkout Flow

During checkout the user has 5 options for payment:

1. **Cash** - Pay on delivery
2. **Bank Transfer** - Manual bank transfer with proof
3. **Card** - APG payment gateway (online card payment)
4. **BNPL** - Buy Now Pay Later via APG
5. **Raast** - Instant payment via APG

### Initial Order Creation

In all cases, at the time of initial checkout:

- `order.status` = `'Pending'`
- `order_source.status` = `'Pending'`
- `order_payment.trx_status` = `'PENDING'`

**Special Cases:**

- **Cash**: May include `trx_proof` if advance payment was made
- **Bank Transfer**: Will include `trx_proof` (screenshot/receipt)
- SMS content varies based on payment method

### APG Payment Gateway Flow (Card/BNPL/Raast)

1. **Order Created** → Status: `'Pending'`
2. **User Redirected** → APG payment gateway
3. **User May/May Not Complete Payment**
4. **APG Callback** → `/payments/apg/listener` endpoint
   - **Success**:
     - `order_payment.trx_status` = `'APPROVED'`
     - `order.status` = `'Verifying Payment'`
     - `order_source.status` = `'Verifying Payment'`
     - SMS sent to customer
     - `checkout.completed` event emitted
   - **Failure**:
     - `order_payment.trx_status` = `'DECLINED'`
     - `order.status` = `'Payment Failed'`
     - `order_source.status` = `'Payment Failed'`
     - SMS sent to customer

---

## Status Enums

### Order Status (High-Level Aggregate)

```typescript
enum OrderStatus {
  PENDING = 'Pending', // Order created, awaiting payment/confirmation
  VERIFYING_PAYMENT = 'Verifying Payment', // APG payment received, admin verifying
  PAYMENT_FAILED = 'Payment Failed', // Payment gateway declined/failed
  IN_PROGRESS = 'In Progress', // At least one OrderSource being fulfilled
  PARTIALLY_FULFILLED = 'Partially Fulfilled', // Some OrderSources delivered, others pending
  COMPLETED = 'Completed', // All OrderSources delivered
  CANCELLED = 'Cancelled', // Order cancelled by user/admin
}
```

**Note**: Return/Refund flow will be implemented separately later.

### OrderSource Status (Per-Shop Granular)

```typescript
enum OrderSourceStatus {
  PENDING = 'Pending', // Awaiting shop confirmation
  VERIFYING_PAYMENT = 'Verifying Payment', // Awaiting payment confirmation by admin
  PAYMENT_FAILED = 'Payment Failed', // Payment gateway declined/failed
  CONFIRMED = 'Confirmed', // Shop confirmed the order
  PICKED = 'Picked', // Items picked from inventory
  SHIPPED = 'Shipped', // Package shipped (trackingId assigned)
  DELIVERED = 'Delivered', // Delivered to customer
  CANCELLED = 'Cancelled', // Shop/Admin cancelled this portion
}
```

---

## Status Transition Rules

### Order Status Transitions

```
Pending → Verifying Payment (APG payment received)
Pending → In Progress (Cash/Bank Transfer confirmed)
Verifying Payment → In Progress (Admin verified payment)
Verifying Payment → Payment Failed (Payment declined)
Payment Failed → Cancelled (Admin action)
In Progress → Partially Fulfilled (Some sources delivered)
In Progress → Completed (All sources delivered)
Partially Fulfilled → Completed (Remaining sources delivered)
Any Status → Cancelled (Admin/User cancellation)
```

### OrderSource Status Transitions

```
Pending → Verifying Payment (APG payment received)
Pending → Confirmed (Shop/Admin confirmed)
Verifying Payment → Confirmed (Payment verified)
Verifying Payment → Payment Failed (Payment declined)
Confirmed → Picked (Shop picked items)
Picked → Shipped (Package shipped)
Shipped → Delivered (Customer received)
Any Status → Cancelled (Shop/Admin cancelled)
```

---

## Database Schema

### Order Table

- `id` (PK)
- `order_number` (unique, indexed)
- `user_id` (FK to marketplace_user)
- `status` (enum - OrderStatus)
- `order_amount`, `delivery_amount`, `grand_total`
- `quantity` (total items across all sources)
- `created_at`, `updated_at`

### OrderSource Table

- `id` (PK)
- `order_id` (FK to order)
- `shop_id` (FK to shop)
- `location_id` (FK to location)
- `status` (enum - OrderSourceStatus)
- `quantity` (items from this shop)
- `amount` (subtotal for this shop)
- `tracking_id` (shipping tracking number)
- `created_at`, `updated_at`

### OrderItem Table

- `id` (PK)
- `order_source_id` (FK to order_source)
- `listing_id` (FK to listing)
- `quantity`, `price`, `sale_price`
- `product_title`, `product_primary_image`

### OrderPayment Table

- `id` (PK)
- `order_id` (FK to order, one-to-one)
- `trx_method` (Cash/Card/Bank Transfer/BNPL/Raast)
- `trx_status` (PENDING/APPROVED/DECLINED/SETTLED)
- `trx_id`, `trx_uuid`, `trx_session_id` (APG fields)
- `trx_amount`, `mdr_percent`, `tax_percent`

---

## Order Status Synchronization Logic

The `order.status` should be automatically calculated based on `order_source` statuses:

```typescript
function calculateOrderStatus(orderSources: OrderSource[]): OrderStatus {
  const statuses = orderSources.map(s => s.status);

  // All payment failed
  if (statuses.every(s => s === 'Payment Failed')) {
    return OrderStatus.PAYMENT_FAILED;
  }

  // Any verifying payment
  if (statuses.some(s => s === 'Verifying Payment')) {
    return OrderStatus.VERIFYING_PAYMENT;
  }

  // All cancelled
  if (statuses.every(s => s === 'Cancelled')) {
    return OrderStatus.CANCELLED;
  }

  // All delivered
  if (statuses.every(s => s === 'Delivered')) {
    return OrderStatus.COMPLETED;
  }

  // Some delivered, some not
  if (statuses.some(s => s === 'Delivered') && statuses.some(s => !['Delivered', 'Cancelled'].includes(s))) {
    return OrderStatus.PARTIALLY_FULFILLED;
  }

  // Any in progress (Confirmed/Picked/Shipped)
  if (statuses.some(s => ['Confirmed', 'Picked', 'Shipped'].includes(s))) {
    return OrderStatus.IN_PROGRESS;
  }

  // All pending
  return OrderStatus.PENDING;
}
```

---

## User Views

### Customer View (Abstract - Order Level)

- Order Number: TB-1234567890123-1
- Status: "In Progress" or "Partially Fulfilled"
- Total Amount: PKR 50,000
- Items: 5 items from 2 shops
- **Drill Down**: View per-shop status

### Customer View (Granular - OrderSource Level)

- **Shop A** (3 items): Status "Delivered", Tracking: TCS123456
- **Shop B** (2 items): Status "Shipped", Tracking: TCS789012

### Shop View (Their OrderSources Only)

- Order #TB-1234567890123-1
- Items: 3 items (Laptop, Mouse, Keyboard)
- Status: "Confirmed" → Update to "Picked" → "Shipped" → "Delivered"
- Customer: John Doe, 0300-1234567
- Delivery Address: House 123, Street 45, Lahore

---

## API Endpoints (To Be Implemented)

### Order Management

- `POST /orders/checkout` - Create order
- `GET /orders/:orderNumber` - Get order details
- `GET /orders` - List user's orders (with filters)
- `PATCH /orders/:orderNumber/cancel` - Cancel order

### OrderSource Management (Shop/Admin)

- `GET /order-sources` - List shop's order sources
- `PATCH /order-sources/:id/status` - Update order source status
- `PATCH /order-sources/:id/tracking` - Add tracking ID

### Status Updates

- `POST /payments/apg/listener` - APG callback (existing)
- `PATCH /orders/:orderNumber/verify-payment` - Admin verify payment

---

## Events

### checkout.completed

Emitted when:

- Cash/Bank Transfer order created
- APG payment approved

Payload:

```typescript
{
  orderNumber: string;
  userId: string;
  items: Array<{
    listingId: number;
    shopId: number;
    quantity: number;
    unitPrice: string;
  }>;
  totals: {
    subTotal: string;
    deliveryAmount: string;
    grandTotal: string;
  }
}
```

---

## Review System Integration

When `order_source.status` = `'Delivered'`:

1. Create `listing_review` rows for all items in that OrderSource
2. Set `listing_review.order_id` = order.id
3. Set `listing_review.order_source_id` = order_source.id
4. Set `listing_review.shop_id` = order_source.shop_id
5. Set `listing_review.is_pending` = true
6. Send review link to customer

---

## SMS Notifications

### Order Created (Cash/Bank Transfer)

> "Dear {name}, Thank you for placing order #{orderNumber}. You will receive a confirmation call shortly. Team Techbazaar"

### Payment Approved (APG)

> "Dear {name}, Your payment for order #{orderNumber} has been received. We are verifying it. You will receive a confirmation call shortly. Team Techbazaar"

### Payment Failed (APG)

> "Dear {name}, Payment for order #{orderNumber} was declined. Please try again or use a different payment method. Team Techbazaar"

### Order Shipped (Per OrderSource)

> "Dear {name}, Your order #{orderNumber} from {shopName} has been shipped. Tracking: {trackingId}. Team Techbazaar"

### Order Delivered (Per OrderSource)

> "Dear {name}, Your order #{orderNumber} from {shopName} has been delivered. Please share your feedback: {reviewLink}. Team Techbazaar"

---

## Implementation Notes

### Current State

- ✅ Order creation with multiple OrderSources per shop/location
- ✅ APG payment integration with callback
- ✅ Order and OrderSource entities defined
- ✅ Review system entities updated for new order structure

### To Be Implemented

- ⏳ OrderSource status update endpoints
- ⏳ Order status synchronization logic
- ⏳ Shop dashboard for managing OrderSources
- ⏳ Admin panel for order management
- ⏳ Review creation trigger on delivery
- ⏳ SMS notifications for status changes
- ⏳ Return/Refund flow (future)

---

## Migration Strategy

### Database Changes Required

1. Update `order.status` enum to new values
2. Update `order_source.status` enum to new values
3. Migrate existing orders:
   - Map old statuses to new statuses
   - Ensure OrderSource statuses are set correctly
4. Add indexes on status columns for performance

### Code Changes Required

1. Update `OrderStatus` enum in `order-status.enum.ts`
2. Create `OrderSourceStatus` enum
3. Implement status synchronization service
4. Update order creation service
5. Create OrderSource management endpoints
6. Update SMS notification templates
7. Update frontend to show two-level status view

---

## SQL Migration Scripts

### Migration 1: Update Order Table Status Enum

```sql
-- Step 1: Backup existing data (recommended)
-- CREATE TABLE order_backup AS SELECT * FROM `order`;

-- Step 2: Modify the order.status enum column
ALTER TABLE `order`
MODIFY COLUMN `status` ENUM(
  'Pending',
  'Verifying Payment',
  'Payment Failed',
  'In Progress',
  'Partially Fulfilled',
  'Completed',
  'Cancelled'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Pending' NOT NULL;

-- Step 3: Migrate existing statuses to new values
-- Map old granular statuses to new high-level statuses
UPDATE `order`
SET `status` = 'In Progress'
WHERE `status` IN ('Confirmed', 'Picked', 'Shipped');

UPDATE `order`
SET `status` = 'Completed'
WHERE `status` = 'Delivered';

-- Note: 'Pending', 'Verifying Payment', 'Payment Failed', 'Cancelled' remain unchanged
-- 'Returned' and 'Refunded' are removed (to be handled in future return/refund flow)

-- Step 4: Add index on status column for performance
-- Check if index exists first, then create if needed
SELECT COUNT(1) INTO @index_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE table_schema = DATABASE()
  AND table_name = 'order'
  AND index_name = 'idx_order_status';

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_order_status ON `order`(`status`)',
  'SELECT "Index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

### Migration 2: Update OrderSource Table Status Enum

```sql
-- Step 1: Backup existing data (recommended)
-- CREATE TABLE order_source_backup AS SELECT * FROM `order_source`;

-- Step 2: Modify the order_source.status enum column
ALTER TABLE `order_source`
MODIFY COLUMN `status` ENUM(
  'Pending',
  'Verifying Payment',
  'Payment Failed',
  'Confirmed',
  'Picked',
  'Shipped',
  'Delivered',
  'Cancelled'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Pending' NOT NULL;

-- Step 3: Update existing order_source statuses based on parent order status
-- This ensures consistency between order and order_source statuses
UPDATE `order_source` os
INNER JOIN `order` o ON os.order_id = o.id
SET os.`status` = CASE
  WHEN o.`status` = 'Verifying Payment' THEN 'Verifying Payment'
  WHEN o.`status` = 'Payment Failed' THEN 'Payment Failed'
  WHEN o.`status` = 'In Progress' THEN 'Confirmed'
  WHEN o.`status` = 'Completed' THEN 'Delivered'
  WHEN o.`status` = 'Cancelled' THEN 'Cancelled'
  ELSE 'Pending'
END
WHERE os.`status` = 'Pending';

-- Step 4: Add index on status column for performance
SELECT COUNT(1) INTO @index_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE table_schema = DATABASE()
  AND table_name = 'order_source'
  AND index_name = 'idx_order_source_status';

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_order_source_status ON `order_source`(`status`)',
  'SELECT "Index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add composite index for shop queries
SELECT COUNT(1) INTO @index_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE table_schema = DATABASE()
  AND table_name = 'order_source'
  AND index_name = 'idx_order_source_shop_status';

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_order_source_shop_status ON `order_source`(`shop_id`, `status`)',
  'SELECT "Index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

### Migration 3: Verify Data Integrity

```sql
-- Check for any orders with inconsistent statuses
SELECT
  o.id,
  o.order_number,
  o.status as order_status,
  GROUP_CONCAT(DISTINCT os.status) as order_source_statuses,
  COUNT(os.id) as source_count
FROM `order` o
LEFT JOIN `order_source` os ON o.id = os.order_id
GROUP BY o.id, o.order_number, o.status
HAVING COUNT(os.id) > 0;

-- Check for orders without order_sources (should not exist in new system)
SELECT o.id, o.order_number, o.status
FROM `order` o
LEFT JOIN `order_source` os ON o.id = os.order_id
WHERE os.id IS NULL;

-- Count orders by status (for verification)
SELECT `status`, COUNT(*) as count
FROM `order`
GROUP BY `status`
ORDER BY count DESC;

-- Count order_sources by status (for verification)
SELECT `status`, COUNT(*) as count
FROM `order_source`
GROUP BY `status`
ORDER BY count DESC;
```

### Rollback Scripts (Use with Caution)

```sql
-- Rollback Order Table
ALTER TABLE `order`
MODIFY COLUMN `status` ENUM(
  'Pending',
  'Confirmed',
  'Picked',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
  'Verifying Payment',
  'Payment Failed'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Pending' NOT NULL;

-- Rollback OrderSource Table
ALTER TABLE `order_source`
MODIFY COLUMN `status` ENUM(
  'Pending',
  'Confirmed',
  'Picked',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
  'Verifying Payment',
  'Payment Failed'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Pending' NOT NULL;

-- Restore from backup if needed
-- TRUNCATE TABLE `order`;
-- INSERT INTO `order` SELECT * FROM order_backup;
-- TRUNCATE TABLE `order_source`;
-- INSERT INTO `order_source` SELECT * FROM order_source_backup;
```

### Migration Notes

1. **Backup First**: Always create backups before running migrations on production
2. **Test on Staging**: Run migrations on staging environment first
3. **Downtime**: Consider maintenance window for large tables
4. **Index Creation**: May take time on large tables, monitor progress
5. **Data Validation**: Run verification queries after migration
6. **Application Deployment**: Deploy code changes immediately after database migration
7. **Monitor**: Watch for errors in application logs after deployment

### Post-Migration Checklist

- [ ] Verify all orders have valid statuses
- [ ] Verify all order_sources have valid statuses
- [ ] Check that order status reflects order_source statuses correctly
- [ ] Test order creation flow (Cash, Bank Transfer, APG)
- [ ] Test APG callback updates statuses correctly
- [ ] Verify SMS notifications are sent with correct templates
- [ ] Test order listing/filtering by status
- [ ] Monitor application logs for status-related errors
- [ ] Update API documentation with new status values
