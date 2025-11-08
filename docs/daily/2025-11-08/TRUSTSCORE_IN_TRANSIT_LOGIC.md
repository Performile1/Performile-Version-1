# 🎯 TRUSTSCORE - IN-TRANSIT ORDER LOGIC

**Date:** November 9, 2025, 12:13 AM
**Critical Question:** "Should in-transit orders affect TrustScore before ETA is exceeded?"

---

## ✅ **YOUR INSIGHT IS CORRECT**

**Principle:** Don't penalize couriers for orders that are still within their promised delivery window.

---

## 📊 **ORDER STATUS LOGIC**

### **Current Statuses:**
- `pending` - Order created, not yet picked up
- `processing` - Being prepared for shipment
- `in_transit` - Courier has package, delivering
- `delivered` - Successfully delivered ✅
- `cancelled` - Cancelled before delivery
- `failed` - Delivery failed
- `returned` - Returned to sender

---

## 🎯 **TRUSTSCORE CALCULATION RULES**

### **Rule 1: Only Count "Finalized" Orders**

**Include in TrustScore:**
- ✅ `delivered` - Success
- ❌ `failed` - Failure (courier fault)
- ❌ `returned` - Failure (unless customer fault)
- ❌ `cancelled` (by courier) - Failure

**Exclude from TrustScore:**
- ⏸️ `pending` - Not yet started
- ⏸️ `processing` - Not yet with courier
- ⏸️ `in_transit` (within ETA) - Still in progress

---

### **Rule 2: In-Transit Orders with Exceeded ETA**

**If order is `in_transit` AND delivery is overdue:**

```typescript
function shouldCountInTransitOrder(order: Order): boolean {
  if (order.order_status !== 'in_transit') {
    return false;
  }
  
  const now = new Date();
  const estimatedDeliveryDate = order.estimated_delivery_date;
  
  // If no ETA, use default (created_at + 3 days)
  const eta = estimatedDeliveryDate || new Date(
    order.created_at.getTime() + 3 * 24 * 60 * 60 * 1000
  );
  
  // Check if we're past ETA
  const isOverdue = now > eta;
  
  // How many days overdue?
  const daysOverdue = (now.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24);
  
  // Grace period: 1 day
  const gracePeriodDays = 1;
  
  if (daysOverdue > gracePeriodDays) {
    // Order is significantly overdue - count as failure
    return true;
  }
  
  // Still within grace period - don't count yet
  return false;
}
```

---

## 🧮 **TRUSTSCORE CALCULATION (UPDATED)**

### **Completion Rate Component:**

```typescript
function calculateCompletionRate(courier_id: string): number {
  // Get all orders for this courier
  const orders = await supabase
    .from('orders')
    .select('*')
    .eq('courier_id', courier_id)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  
  let successfulOrders = 0;
  let failedOrders = 0;
  let totalFinalized = 0;
  
  for (const order of orders.data) {
    // Delivered orders = success
    if (order.order_status === 'delivered') {
      successfulOrders++;
      totalFinalized++;
      continue;
    }
    
    // Failed/returned/cancelled = failure
    if (['failed', 'returned'].includes(order.order_status)) {
      failedOrders++;
      totalFinalized++;
      continue;
    }
    
    // Cancelled by courier = failure
    if (order.order_status === 'cancelled' && order.responsible_party === 'courier') {
      failedOrders++;
      totalFinalized++;
      continue;
    }
    
    // In-transit orders that are significantly overdue = failure
    if (order.order_status === 'in_transit') {
      const now = new Date();
      const eta = order.estimated_delivery_date || new Date(
        order.created_at.getTime() + 3 * 24 * 60 * 60 * 1000
      );
      
      const daysOverdue = (now.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24);
      const gracePeriodDays = 1;
      
      if (daysOverdue > gracePeriodDays) {
        // Significantly overdue - count as failure
        failedOrders++;
        totalFinalized++;
      }
      // Otherwise, don't count it yet (still in progress)
    }
    
    // Pending/processing = don't count (not finalized)
  }
  
  if (totalFinalized === 0) {
    return 100; // No finalized orders yet - assume good
  }
  
  const completionRate = (successfulOrders / totalFinalized) * 100;
  return completionRate;
}
```

---

## 📊 **EXAMPLE SCENARIOS**

### **Scenario 1: Order Within ETA**

```
Order created: Nov 1
ETA: Nov 3 (2 days)
Current date: Nov 2
Status: in_transit

Days until ETA: 1 day
Is overdue? No
Count in TrustScore? NO ⏸️

Result: Order is still in progress, don't penalize courier yet
```

### **Scenario 2: Order Slightly Overdue (Grace Period)**

```
Order created: Nov 1
ETA: Nov 3 (2 days)
Current date: Nov 3 (same day as ETA)
Status: in_transit

Days overdue: 0 days
Grace period: 1 day
Count in TrustScore? NO ⏸️

Result: Within grace period, still okay
```

### **Scenario 3: Order Significantly Overdue**

```
Order created: Nov 1
ETA: Nov 3 (2 days)
Current date: Nov 5
Status: in_transit

Days overdue: 2 days
Grace period: 1 day
Count in TrustScore? YES ❌

Result: 2 days overdue, count as failure
```

### **Scenario 4: Order Delivered Late (But Delivered)**

```
Order created: Nov 1
ETA: Nov 3 (2 days)
Delivered: Nov 4
Status: delivered

Days late: 1 day
Count in TrustScore? YES ✅ (as success, but affects on-time rate)

Result: 
- Completion rate: Success ✅
- On-time rate: Failure ❌
```

---

## 🗄️ **DATABASE SCHEMA UPDATES**

### **Add Overdue Tracking:**

```sql
-- Add columns to track overdue status
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS days_overdue DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS overdue_checked_at TIMESTAMP WITH TIME ZONE;

-- Function to check if order is overdue
CREATE OR REPLACE FUNCTION check_order_overdue(order_id UUID)
RETURNS TABLE(
  is_overdue BOOLEAN,
  days_overdue DECIMAL(4,2)
) AS $$
DECLARE
  v_order RECORD;
  v_eta TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE;
  v_days_overdue DECIMAL(4,2);
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM orders WHERE orders.order_id = check_order_overdue.order_id;
  
  -- Only check in_transit orders
  IF v_order.order_status != 'in_transit' THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL(4,2);
    RETURN;
  END IF;
  
  -- Get ETA (use estimated_delivery_date or default to created_at + 3 days)
  v_eta := COALESCE(
    v_order.estimated_delivery_date,
    v_order.created_at + INTERVAL '3 days'
  );
  
  v_now := NOW();
  
  -- Calculate days overdue
  v_days_overdue := EXTRACT(EPOCH FROM (v_now - v_eta)) / 86400;
  
  -- Check if overdue (with 1 day grace period)
  IF v_days_overdue > 1 THEN
    RETURN QUERY SELECT TRUE, v_days_overdue;
  ELSE
    RETURN QUERY SELECT FALSE, 0::DECIMAL(4,2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Cron job to update overdue status (run daily)
CREATE OR REPLACE FUNCTION update_overdue_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET 
    is_overdue = overdue_check.is_overdue,
    days_overdue = overdue_check.days_overdue,
    overdue_checked_at = NOW()
  FROM (
    SELECT 
      order_id,
      (check_order_overdue(order_id)).is_overdue,
      (check_order_overdue(order_id)).days_overdue
    FROM orders
    WHERE order_status = 'in_transit'
  ) AS overdue_check
  WHERE orders.order_id = overdue_check.order_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 **UPDATED TRUSTSCORE QUERY**

```sql
-- Calculate completion rate (only finalized orders)
WITH finalized_orders AS (
  SELECT 
    courier_id,
    order_id,
    order_status,
    CASE 
      -- Success cases
      WHEN order_status = 'delivered' THEN 'success'
      
      -- Failure cases
      WHEN order_status IN ('failed', 'returned') THEN 'failure'
      WHEN order_status = 'cancelled' AND responsible_party = 'courier' THEN 'failure'
      
      -- In-transit overdue (with grace period)
      WHEN order_status = 'in_transit' AND is_overdue = TRUE THEN 'failure'
      
      -- Not finalized yet
      ELSE 'in_progress'
    END as outcome
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '90 days'
)
SELECT 
  c.courier_name,
  COUNT(*) FILTER (WHERE outcome = 'success') as successful_orders,
  COUNT(*) FILTER (WHERE outcome = 'failure') as failed_orders,
  COUNT(*) FILTER (WHERE outcome = 'in_progress') as in_progress_orders,
  COUNT(*) FILTER (WHERE outcome != 'in_progress') as total_finalized,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'success')::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE outcome != 'in_progress'), 0) * 100,
    2
  ) as completion_rate
FROM finalized_orders fo
JOIN couriers c ON fo.courier_id = c.courier_id
GROUP BY c.courier_id, c.courier_name
ORDER BY completion_rate DESC;
```

---

## 🎯 **ON-TIME DELIVERY RATE (SEPARATE METRIC)**

**Important:** Completion rate and on-time rate are different!

### **Completion Rate:**
- Did the package get delivered? (Yes/No)
- Excludes in-progress orders (unless significantly overdue)

### **On-Time Rate:**
- Was it delivered by the ETA? (Yes/No)
- Only counts delivered orders
- Late delivery = success for completion, failure for on-time

```sql
-- On-time delivery rate
SELECT 
  c.courier_name,
  COUNT(*) as total_delivered,
  COUNT(*) FILTER (
    WHERE delivered_at <= COALESCE(
      estimated_delivery_date,
      created_at + INTERVAL '3 days'
    )
  ) as on_time_deliveries,
  ROUND(
    COUNT(*) FILTER (
      WHERE delivered_at <= COALESCE(
        estimated_delivery_date,
        created_at + INTERVAL '3 days'
      )
    )::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) as on_time_rate
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.order_status = 'delivered'
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY c.courier_id, c.courier_name
ORDER BY on_time_rate DESC;
```

---

## 📋 **TRUSTSCORE COMPONENTS (FINAL)**

```typescript
TrustScore = 
  (Completion Rate × 25%) +          // Did package arrive? (excludes in-progress)
  (On-Time Rate × 20%) +             // Was it on time? (only delivered)
  (First-Attempt Rate × 15%) +       // Delivered first try? (only delivered)
  (Low Claim Rate × 10%) +           // Few customer complaints?
  (Review Score × 30%)               // Customer satisfaction? (with non-responses)
```

**Key principles:**
1. **Don't penalize for in-progress orders** (unless significantly overdue)
2. **Separate completion from timeliness** (different metrics)
3. **Grace period for delays** (1 day buffer)
4. **Only count finalized outcomes** (fair measurement)

---

## ✅ **BENEFITS OF THIS APPROACH**

1. **Fair to couriers** - Don't penalize for orders still in transit
2. **Accurate metrics** - Only count finalized outcomes
3. **Grace period** - 1 day buffer for minor delays
4. **Separate concerns** - Completion vs. timeliness
5. **Real-time updates** - Daily cron job checks overdue status
6. **Transparent** - Clear rules for what counts

---

## 🎯 **IMPLEMENTATION PRIORITY**

**Phase 2: Engagement Features (3-4 weeks)**

**Steps:**
1. Add `is_overdue` and `days_overdue` columns
2. Create `check_order_overdue()` function
3. Create daily cron job to update overdue status
4. Update TrustScore calculation to exclude in-progress orders
5. Separate on-time rate from completion rate

---

## 📊 **YOUR CURRENT DATA WITH THIS LOGIC**

```
Total orders: 35
- Delivered: 14 ✅ (count as success)
- In transit: 8 ⏸️ (check if overdue)
- Processing: 5 ⏸️ (don't count)
- Pending: 8 ⏸️ (don't count)
- Failed: 0 ❌

Assuming in-transit orders are within ETA:
- Finalized orders: 14
- Successful: 14
- Failed: 0
- Completion rate: 100% ✅

This is much more accurate!
```

---

**Your insight is spot-on! This creates a fair, accurate TrustScore system.** 🎯

**Document:** `docs/daily/2025-11-08/TRUSTSCORE_IN_TRANSIT_LOGIC.md`
