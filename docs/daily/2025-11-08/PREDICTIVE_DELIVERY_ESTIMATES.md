# 📊 PREDICTIVE DELIVERY ESTIMATES - SMART ALGORITHM

**Date:** November 8, 2025, 11:44 PM
**Feature:** Calculate delivery estimates based on actual tracking data, not just courier promises

---

## 🎯 **THE PROBLEM**

**Courier says:** "1-2 days delivery"
**Reality:** Sometimes 1 day, sometimes 4 days

**Consumer sees:** "1-2 days" (misleading)
**Better approach:** Show ACTUAL average based on real data from their postal code

---

## ✅ **SMART DELIVERY ESTIMATE ALGORITHM**

### **Core Principles:**

1. **Use historical data** - Real tracking events, not courier promises
2. **Postal code-specific** - Same courier performs differently by area
3. **Statistical outliers removed** - Ignore extreme cases (0.5 days or 10 days)
4. **Minimum sample size** - Need enough data to be reliable
5. **Weighted by recency** - Recent orders matter more
6. **Confidence intervals** - Show range, not just average

---

## 🧮 **CALCULATION ALGORITHM**

### **Step 1: Collect Historical Data**

```sql
-- Get last 30 days of completed deliveries for this courier + postal code
SELECT 
  order_id,
  created_at,
  delivered_at,
  EXTRACT(EPOCH FROM (delivered_at - created_at)) / 86400 as delivery_days
FROM orders
WHERE 
  courier_id = 'postnord-id'
  AND postal_code = '12345'
  AND order_status = 'delivered'
  AND delivered_at IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Results:
-- Order 1: 1.2 days
-- Order 2: 1.5 days
-- Order 3: 3.8 days
-- Order 4: 1.1 days
-- Order 5: 4.2 days
-- Order 6: 1.3 days
-- Order 7: 0.5 days  ← Outlier (too fast)
-- Order 8: 1.4 days
-- Order 9: 8.5 days  ← Outlier (too slow)
-- Order 10: 1.6 days
```

### **Step 2: Remove Statistical Outliers**

```typescript
function removeOutliers(deliveryDays: number[]): number[] {
  // Calculate quartiles (Q1, Q3)
  const sorted = deliveryDays.sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  // Define outlier boundaries
  const lowerBound = q1 - (1.5 * iqr);
  const upperBound = q3 + (1.5 * iqr);
  
  // Remove outliers
  return deliveryDays.filter(days => 
    days >= lowerBound && days <= upperBound
  );
}

// Example:
// Input: [0.5, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.8, 4.2, 8.5]
// Q1 = 1.2, Q3 = 3.8, IQR = 2.6
// Lower bound = 1.2 - (1.5 * 2.6) = -2.7
// Upper bound = 3.8 + (1.5 * 2.6) = 7.7
// Removed: 0.5 (too fast), 8.5 (too slow)
// Output: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.8, 4.2]
```

### **Step 3: Apply Recency Weighting**

```typescript
function calculateWeightedAverage(
  deliveryData: Array<{ days: number; date: Date }>
): number {
  const now = new Date();
  
  // Calculate weights based on recency
  const weightedData = deliveryData.map(item => {
    const daysAgo = (now.getTime() - item.date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: recent orders have more weight
    // Weight = e^(-daysAgo / 30)
    // Orders from today: weight = 1.0
    // Orders from 30 days ago: weight = 0.37
    const weight = Math.exp(-daysAgo / 30);
    
    return {
      days: item.days,
      weight: weight
    };
  });
  
  // Calculate weighted average
  const totalWeight = weightedData.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = weightedData.reduce((sum, item) => 
    sum + (item.days * item.weight), 0
  );
  
  return weightedSum / totalWeight;
}

// Example:
// Order from today (1.2 days): weight = 1.0
// Order from 10 days ago (1.5 days): weight = 0.72
// Order from 20 days ago (3.8 days): weight = 0.51
// Order from 30 days ago (4.2 days): weight = 0.37
// Weighted average = (1.2*1.0 + 1.5*0.72 + 3.8*0.51 + 4.2*0.37) / (1.0+0.72+0.51+0.37)
//                  = (1.2 + 1.08 + 1.94 + 1.55) / 2.6
//                  = 5.77 / 2.6 = 2.2 days
```

### **Step 4: Calculate Confidence Interval**

```typescript
function calculateConfidenceInterval(
  deliveryDays: number[],
  confidence: number = 0.90  // 90% confidence
): { min: number; max: number; avg: number } {
  const n = deliveryDays.length;
  const avg = deliveryDays.reduce((sum, d) => sum + d, 0) / n;
  
  // Calculate standard deviation
  const variance = deliveryDays.reduce((sum, d) => 
    sum + Math.pow(d - avg, 2), 0
  ) / n;
  const stdDev = Math.sqrt(variance);
  
  // Z-score for 90% confidence = 1.645
  const zScore = 1.645;
  const marginOfError = zScore * (stdDev / Math.sqrt(n));
  
  return {
    min: Math.max(1, avg - marginOfError),  // At least 1 day
    max: avg + marginOfError,
    avg: avg
  };
}

// Example:
// Data: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.8, 4.2]
// Average: 2.0 days
// Std Dev: 1.2 days
// Margin of error: 1.645 * (1.2 / sqrt(8)) = 0.7 days
// Result: { min: 1.3, max: 2.7, avg: 2.0 }
// Display: "1-3 days" (rounded)
```

### **Step 5: Minimum Sample Size Check**

```typescript
function getDeliveryEstimate(
  courier_id: string,
  postal_code: string
): DeliveryEstimate {
  // Get historical data
  const historicalData = await getHistoricalDeliveries(
    courier_id,
    postal_code,
    30  // Last 30 days
  );
  
  // Check minimum sample size
  const MIN_SAMPLES = 5;
  
  if (historicalData.length < MIN_SAMPLES) {
    // Not enough data - fall back to courier's estimate
    return {
      estimate: courier.estimated_delivery_days,
      confidence: 'low',
      source: 'courier_estimate',
      sample_size: historicalData.length,
      message: 'Limited data available'
    };
  }
  
  // Remove outliers
  const cleanedData = removeOutliers(
    historicalData.map(d => d.delivery_days)
  );
  
  // Calculate weighted average
  const weightedAvg = calculateWeightedAverage(historicalData);
  
  // Calculate confidence interval
  const interval = calculateConfidenceInterval(cleanedData, 0.90);
  
  return {
    estimate_min: Math.round(interval.min),
    estimate_max: Math.round(interval.max),
    estimate_avg: Math.round(weightedAvg * 10) / 10,  // 1 decimal
    confidence: 'high',
    source: 'historical_data',
    sample_size: cleanedData.length,
    last_updated: new Date()
  };
}
```

---

## 📊 **EXAMPLE CALCULATIONS**

### **Scenario 1: Consistent Performance**

```
Historical data (last 30 days):
- 10 orders, all delivered in 1-2 days
- [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0]

After outlier removal: All kept
Weighted average: 1.5 days
Confidence interval: 1.2 - 1.8 days

Display to consumer: "1-2 days" ✅
Confidence: High (10 samples)
```

### **Scenario 2: Variable Performance**

```
Historical data (last 30 days):
- 10 orders, mix of fast and slow
- [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 8.0]

After outlier removal: [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]
Weighted average: 2.8 days
Confidence interval: 1.5 - 4.1 days

Display to consumer: "2-4 days" ⚠️
Confidence: Medium (9 samples)
Note: "Delivery times vary in this area"
```

### **Scenario 3: Recent Improvement**

```
Historical data (last 30 days):
- 10 orders, recent ones faster
- Old (30 days ago): [4.0, 4.2, 4.5]
- Recent (last week): [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8]

After outlier removal: All kept
Weighted average: 1.9 days (recent orders weighted higher)
Confidence interval: 1.3 - 2.5 days

Display to consumer: "1-3 days" ✅
Confidence: High (10 samples)
Note: "Performance improving recently"
```

### **Scenario 4: Insufficient Data**

```
Historical data (last 30 days):
- Only 3 orders
- [1.2, 1.5, 2.0]

Sample size < 5 (minimum)

Fallback to courier's estimate: "1-2 days"
Confidence: Low (3 samples)
Note: "Estimate based on courier data"
```

---

## 🎨 **UI DISPLAY**

### **High Confidence (5+ samples):**

```tsx
<Box>
  <Typography variant="h6">
    1-2 days
  </Typography>
  <Box display="flex" alignItems="center" gap={1}>
    <CheckCircleIcon color="success" fontSize="small" />
    <Typography variant="caption" color="success.main">
      Based on 15 recent deliveries to your area
    </Typography>
  </Box>
</Box>
```

### **Medium Confidence (Variable performance):**

```tsx
<Box>
  <Typography variant="h6">
    2-4 days
  </Typography>
  <Box display="flex" alignItems="center" gap={1}>
    <WarningIcon color="warning" fontSize="small" />
    <Typography variant="caption" color="warning.main">
      Delivery times vary in this area (8 samples)
    </Typography>
  </Box>
</Box>
```

### **Low Confidence (<5 samples):**

```tsx
<Box>
  <Typography variant="h6">
    1-2 days
  </Typography>
  <Box display="flex" alignItems="center" gap={1}>
    <InfoIcon color="info" fontSize="small" />
    <Typography variant="caption" color="text.secondary">
      Estimated (limited data for your area)
    </Typography>
  </Box>
</Box>
```

---

## 📋 **DATABASE SCHEMA**

### **New Table: Delivery Estimates Cache**

```sql
CREATE TABLE delivery_estimates_cache (
  cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  postal_code VARCHAR(20) NOT NULL,
  service_type VARCHAR(50),  -- 'home_delivery', 'parcel_locker', etc.
  
  -- Estimate data
  estimate_min INTEGER NOT NULL,  -- Minimum days
  estimate_max INTEGER NOT NULL,  -- Maximum days
  estimate_avg DECIMAL(3,1) NOT NULL,  -- Average days (1 decimal)
  
  -- Confidence metrics
  sample_size INTEGER NOT NULL,
  confidence_level VARCHAR(20),  -- 'high', 'medium', 'low'
  data_source VARCHAR(50),  -- 'historical_data', 'courier_estimate'
  
  -- Statistical data
  std_deviation DECIMAL(3,2),
  outliers_removed INTEGER,
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,  -- Recalculate after this
  
  -- Indexes
  UNIQUE(courier_id, postal_code, service_type)
);

CREATE INDEX idx_delivery_estimates_postal ON delivery_estimates_cache(postal_code);
CREATE INDEX idx_delivery_estimates_courier ON delivery_estimates_cache(courier_id);
CREATE INDEX idx_delivery_estimates_expires ON delivery_estimates_cache(expires_at);
```

### **Tracking Events Table (Enhanced):**

```sql
-- Add delivery_days calculated column
ALTER TABLE orders
ADD COLUMN delivery_days DECIMAL(4,2) GENERATED ALWAYS AS (
  CASE 
    WHEN delivered_at IS NOT NULL AND created_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (delivered_at - created_at)) / 86400
    ELSE NULL
  END
) STORED;

CREATE INDEX idx_orders_delivery_days ON orders(delivery_days) 
WHERE delivery_days IS NOT NULL;
```

---

## 🔄 **CACHE REFRESH STRATEGY**

### **When to Recalculate:**

```typescript
// Recalculate estimates every 24 hours
async function refreshDeliveryEstimates() {
  // Find expired estimates
  const expiredEstimates = await supabase
    .from('delivery_estimates_cache')
    .select('*')
    .lt('expires_at', new Date());
  
  for (const estimate of expiredEstimates) {
    // Recalculate
    const newEstimate = await calculateDeliveryEstimate(
      estimate.courier_id,
      estimate.postal_code,
      estimate.service_type
    );
    
    // Update cache
    await supabase
      .from('delivery_estimates_cache')
      .update({
        ...newEstimate,
        calculated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24 hours
      })
      .eq('cache_id', estimate.cache_id);
  }
}

// Run as cron job every hour
// Or trigger on new delivery completion
```

### **Real-Time Updates:**

```typescript
// When order is delivered, update estimate
async function onOrderDelivered(order: Order) {
  // Invalidate cache for this postal code + courier
  await supabase
    .from('delivery_estimates_cache')
    .update({ expires_at: new Date() })  // Force recalculation
    .eq('courier_id', order.courier_id)
    .eq('postal_code', order.postal_code);
  
  // Trigger async recalculation
  await recalculateEstimate(order.courier_id, order.postal_code);
}
```

---

## 📊 **ADVANCED FEATURES**

### **1. Seasonal Adjustments**

```typescript
function applySeasonalAdjustment(
  estimate: number,
  month: number
): number {
  // December (holiday season): +20% delivery time
  // July (summer vacation): +10% delivery time
  const seasonalFactors = {
    12: 1.20,  // December
    7: 1.10,   // July
    // ... other months: 1.0
  };
  
  return estimate * (seasonalFactors[month] || 1.0);
}
```

### **2. Day-of-Week Patterns**

```typescript
// Orders placed on Friday typically take longer
function applyDayOfWeekAdjustment(
  estimate: number,
  dayOfWeek: number
): number {
  const dayFactors = {
    5: 1.15,  // Friday: +15%
    6: 1.30,  // Saturday: +30%
    0: 1.30,  // Sunday: +30%
    // Weekdays: 1.0
  };
  
  return estimate * (dayFactors[dayOfWeek] || 1.0);
}
```

### **3. Weather Impact**

```typescript
// Integrate weather API
async function applyWeatherAdjustment(
  estimate: number,
  postal_code: string
): Promise<number> {
  const weather = await getWeatherForecast(postal_code);
  
  if (weather.severe) {
    return estimate * 1.5;  // +50% for severe weather
  } else if (weather.snow) {
    return estimate * 1.2;  // +20% for snow
  }
  
  return estimate;
}
```

---

## 🎯 **IMPLEMENTATION PRIORITY**

**Phase 3: Optimization (4-6 weeks from now)**

**Dependencies:**
1. ✅ Order tracking system
2. ✅ Delivery completion tracking
3. ❌ Historical data (need 30+ days of orders)
4. ❌ Caching system
5. ❌ Background job scheduler

**Quick Win (Phase 1):**
- Start collecting delivery_days data NOW
- Even if not using it yet
- Will have data ready when implementing algorithm

---

## 📋 **SUGGESTED APPROACH**

### **Your Question:**
> "If 5 orders took 4 days and 5 took 1 day, what should we show?"

### **My Recommendation:**

```
Data: [1, 1, 1, 1, 1, 4, 4, 4, 4, 4]

Step 1: Remove outliers
- No outliers (all within reasonable range)
- Kept: [1, 1, 1, 1, 1, 4, 4, 4, 4, 4]

Step 2: Calculate weighted average
- If recent orders are 1 day: weighted avg = 1.8 days
- If recent orders are 4 days: weighted avg = 3.2 days

Step 3: Calculate confidence interval
- Average: 2.5 days
- Std dev: 1.5 days
- 90% confidence: 1.7 - 3.3 days

Step 4: Display
- Show: "2-3 days"
- Confidence: Medium (high variance)
- Note: "Delivery times vary in this area"
```

**Why not show "1-4 days"?**
- Too wide a range
- Not helpful to consumer
- Better to show realistic middle ground with warning

**Why not show "1 day" (fastest)?**
- Misleading
- Sets wrong expectations
- Better to under-promise, over-deliver

---

## ✅ **BENEFITS**

1. **Accurate expectations** - Based on real data, not promises
2. **Postal code-specific** - Accounts for local variations
3. **Recency-weighted** - Recent performance matters more
4. **Outlier-resistant** - Ignores extreme cases
5. **Confidence indicators** - Consumer knows reliability
6. **Self-improving** - Gets better with more data

---

**Document:** `docs/daily/2025-11-08/PREDICTIVE_DELIVERY_ESTIMATES.md`

**Status:** Algorithm defined, ready for Phase 3 implementation 🚀
