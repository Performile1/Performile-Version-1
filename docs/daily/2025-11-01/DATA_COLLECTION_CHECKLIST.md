# DATA COLLECTION CHECKLIST - RATINGS, REVIEWS & TRACKING

**Date:** November 1, 2025, 8:12 PM  
**Purpose:** Ensure we're collecting ALL necessary data  
**Priority:** CRITICAL - This is the foundation of Performile

---

## 🎯 CORE PRINCIPLE

**"Reviews + Ratings + Tracking = TrustScore = Everything"**

All platform features depend on collecting complete, accurate data from these three sources.

---

## ✅ DATA COLLECTION REQUIREMENTS

### **1. REVIEWS DATA** 📝

#### **Must Collect:**
- ✅ **rating** (1-5 stars) - Overall satisfaction
- ✅ **review_text** - Customer feedback
- ✅ **order_id** - Link to specific order
- ✅ **courier_id** - Who is being reviewed
- ✅ **customer_id/user_id** - Who wrote the review
- ✅ **created_at** - When review was submitted

#### **Should Collect (Detailed Scores):**
- ✅ **delivery_speed_score** - How fast was delivery (1-5)
- ✅ **communication_score** - Courier responsiveness (1-5)
- ✅ **packaging_score** - Condition on arrival (1-5)
- ✅ **on_time_delivery_score** - Punctuality (1-5)
- ✅ **professionalism_score** - Courier behavior (1-5)

#### **Nice to Have:**
- ⚠️ **would_recommend** - Boolean (yes/no)
- ⚠️ **photos** - Delivery proof/packaging photos
- ⚠️ **verified_purchase** - Confirmed order
- ⚠️ **helpful_count** - Other users found helpful

---

### **2. TRACKING DATA** 📦

#### **Must Collect from Orders:**
- ✅ **order_id** - Unique identifier
- ✅ **courier_id** - Who is delivering
- ✅ **order_status** - Current state (pending, in_transit, delivered, cancelled)
- ✅ **created_at** - Order placed timestamp
- ✅ **pickup_date** - When courier picked up
- ✅ **delivery_date** - When delivered (DATE)
- ✅ **delivered_at** - Actual delivery (TIMESTAMP)
- ✅ **estimated_delivery** - Promised delivery date
- ✅ **tracking_number** - Tracking ID

#### **Performance Metrics:**
- ✅ **delivery_attempts** - How many tries to deliver
- ✅ **first_response_time** - How fast courier responded
- ✅ **last_mile_duration** - Final delivery time
- ✅ **issue_reported** - Boolean (problems flagged)
- ✅ **issue_resolved** - Boolean (problems fixed)
- ✅ **issue_description** - What went wrong
- ✅ **resolution_time** - How long to fix

#### **Location Data:**
- ✅ **pickup_postal_code** - Where picked up
- ✅ **delivery_postal_code** - Where delivered
- ✅ **pickup_city** - Pickup location
- ✅ **delivery_city** - Delivery location
- ⚠️ **pickup_coordinates** - GPS (lat/long)
- ⚠️ **delivery_coordinates** - GPS (lat/long)

---

### **3. TRACKING EVENTS** 🚚 (Real-time Updates)

#### **If Separate Tracking Events Table:**
- ✅ **event_id** - Unique event ID
- ✅ **order_id** - Link to order
- ✅ **event_type** - (picked_up, in_transit, out_for_delivery, delivered, exception)
- ✅ **event_timestamp** - When event occurred
- ✅ **location** - Where event happened
- ✅ **status_message** - Human-readable status
- ✅ **courier_notes** - Courier comments
- ⚠️ **gps_coordinates** - Real-time location
- ⚠️ **photo_url** - Delivery proof photo

---

## 📊 HOW DATA FEEDS INTO TRUSTSCORE

### **TrustScore Calculation Weights:**

```
TrustScore = 
  (Rating × 20) × 25% +                    // From REVIEWS
  Completion Rate × 20% +                  // From TRACKING
  On-Time Rate × 20% +                     // From TRACKING
  (100 - Response Time × 2) × 10% +        // From TRACKING
  (Customer Satisfaction × 20) × 10% +     // From REVIEWS
  Issue Resolution Rate × 5% +             // From TRACKING
  (100 - (Delivery Attempts - 1) × 20) × 5% + // From TRACKING
  Last Mile Performance × 5%               // From TRACKING
```

### **Data Sources:**

| Metric | Source | Table | Column |
|--------|--------|-------|--------|
| Rating | Reviews | `reviews` | `rating` |
| Completion Rate | Tracking | `orders` | `order_status` |
| On-Time Rate | Tracking | `orders` | `delivery_date` vs `estimated_delivery` |
| Response Time | Tracking | `orders` | `first_response_time` |
| Customer Satisfaction | Reviews | `reviews` | `on_time_delivery_score` |
| Issue Resolution | Tracking | `orders` | `issue_reported`, `issue_resolved` |
| Delivery Attempts | Tracking | `orders` | `delivery_attempts` |
| Last Mile Performance | Tracking | `orders` | `last_mile_duration` |

---

## 🔄 DATA COLLECTION FLOW

### **1. Order Placed**
```sql
INSERT INTO orders (
  order_id,
  courier_id,
  order_status,
  created_at,
  estimated_delivery,
  pickup_postal_code,
  delivery_postal_code
) VALUES (...);
```

### **2. Tracking Updates**
```sql
-- Courier picks up
UPDATE orders 
SET 
  order_status = 'in_transit',
  pickup_date = NOW(),
  first_response_time = NOW() - created_at
WHERE order_id = ?;

-- Courier delivers
UPDATE orders 
SET 
  order_status = 'delivered',
  delivery_date = CURRENT_DATE,
  delivered_at = NOW(),
  delivery_attempts = 1
WHERE order_id = ?;
```

### **3. Customer Reviews**
```sql
INSERT INTO reviews (
  review_id,
  order_id,
  courier_id,
  customer_id,
  rating,
  review_text,
  delivery_speed_score,
  communication_score,
  packaging_score,
  on_time_delivery_score,
  created_at
) VALUES (...);

-- Trigger: Auto-update TrustScore
-- (trigger_trustscore_update() fires automatically)
```

### **4. TrustScore Recalculated**
```sql
-- Automatic via trigger
SELECT calculate_courier_trustscore(courier_id);

-- Updates courier_analytics table
```

---

## ⚠️ CRITICAL: ENSURE DATA COMPLETENESS

### **Check for Missing Data:**

```sql
-- Reviews without ratings
SELECT COUNT(*) FROM reviews WHERE rating IS NULL;
-- Should be: 0

-- Delivered orders without delivery_date
SELECT COUNT(*) FROM orders 
WHERE order_status = 'delivered' AND delivery_date IS NULL;
-- Should be: 0

-- Orders without estimated_delivery
SELECT COUNT(*) FROM orders WHERE estimated_delivery IS NULL;
-- Should be: 0

-- Orders without courier_id
SELECT COUNT(*) FROM orders WHERE courier_id IS NULL;
-- Should be: minimal (only pending assignments)
```

---

## 📋 API ENDPOINTS THAT COLLECT DATA

### **1. Submit Review**
**Endpoint:** `POST /api/reviews`

**Collects:**
- rating (required)
- review_text (optional)
- delivery_speed_score
- communication_score
- packaging_score
- on_time_delivery_score

**Triggers:**
- `trigger_trustscore_update()` - Auto-recalculates TrustScore

---

### **2. Update Order Status**
**Endpoint:** `PATCH /api/orders/:orderId/status`

**Collects:**
- order_status
- delivery_date (when delivered)
- delivered_at (timestamp)
- delivery_attempts
- issue_reported
- issue_description

**Triggers:**
- `trigger_trustscore_update()` - Auto-recalculates TrustScore

---

### **3. Tracking Events**
**Endpoint:** `POST /api/tracking/events`

**Collects:**
- event_type
- event_timestamp
- location
- status_message
- gps_coordinates

**Updates:**
- Real-time tracking display
- Estimated delivery time
- Customer notifications

---

## ✅ VERIFICATION CHECKLIST

### **Before Launch:**

- [ ] **Reviews table has all required columns**
  - [ ] rating (NOT NULL)
  - [ ] review_text
  - [ ] order_id (FK to orders)
  - [ ] courier_id (FK to couriers)
  - [ ] customer_id (FK to users)
  - [ ] created_at

- [ ] **Orders table has all tracking columns**
  - [ ] order_status
  - [ ] created_at
  - [ ] delivery_date
  - [ ] delivered_at
  - [ ] estimated_delivery
  - [ ] delivery_attempts
  - [ ] first_response_time
  - [ ] last_mile_duration
  - [ ] issue_reported
  - [ ] issue_resolved

- [ ] **TrustScore calculation uses all data**
  - [ ] Reviews (rating, satisfaction scores)
  - [ ] Orders (completion, on-time, attempts)
  - [ ] Tracking (response time, last-mile)

- [ ] **Triggers are active**
  - [ ] reviews_trustscore_update
  - [ ] orders_trustscore_update

- [ ] **APIs collect complete data**
  - [ ] Review submission collects all scores
  - [ ] Order updates include tracking data
  - [ ] No NULL values in critical fields

---

## 🚀 RECOMMENDATIONS

### **Immediate:**
1. ✅ Run `VERIFY_DATA_COLLECTION.sql` to check current state
2. ✅ Identify any missing columns
3. ✅ Add missing columns if needed
4. ✅ Ensure APIs collect all data points

### **Short-term:**
1. ⚠️ Add GPS tracking for real-time location
2. ⚠️ Add delivery proof photos
3. ⚠️ Add customer satisfaction survey
4. ⚠️ Add packaging quality photos

### **Long-term:**
1. ⚠️ Temperature monitoring (sensitive items)
2. ⚠️ Handling incident tracking
3. ⚠️ Route optimization data
4. ⚠️ Fuel efficiency tracking

---

## 📊 DATA QUALITY METRICS

### **Target Goals:**

| Metric | Target | Critical |
|--------|--------|----------|
| Reviews with ratings | 100% | ✅ YES |
| Delivered orders with delivery_date | 100% | ✅ YES |
| Orders with estimated_delivery | 100% | ✅ YES |
| Reviews with detailed scores | 80% | ⚠️ NICE |
| Orders with delivery_attempts | 90% | ✅ YES |
| Orders with first_response_time | 70% | ⚠️ NICE |
| Orders with issue tracking | 100% | ✅ YES |

---

## 🎯 SUCCESS CRITERIA

**Data collection is complete when:**

1. ✅ Every review has a rating (1-5)
2. ✅ Every delivered order has delivery_date
3. ✅ Every order has estimated_delivery
4. ✅ TrustScore calculation uses all available data
5. ✅ Triggers auto-update TrustScore on changes
6. ✅ APIs collect all required fields
7. ✅ No critical NULL values in production

---

## 📄 RELATED FILES

**Verification:**
- `database/VERIFY_DATA_COLLECTION.sql` - Run this to check current state

**Functions:**
- `database/functions/trustscore_functions.sql` - TrustScore calculation

**Tables:**
- `reviews` - Customer reviews
- `orders` - Tracking data
- `courier_analytics` - Aggregated metrics

---

*Created: November 1, 2025, 8:12 PM*  
*Priority: CRITICAL*  
*Status: Ready for verification*
