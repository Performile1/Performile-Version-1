# ⏰ TIME-OF-DAY DELIVERY PREDICTIONS

**Date:** November 8, 2025, 11:46 PM
**Feature:** Predict delivery time (hour) based on historical tracking timestamps for postal code

---

## 🎯 **THE FEATURE**

**Instead of just:**
> "Delivery: 1-2 days"

**Show:**
> "Delivery: Tomorrow between 14:00-17:00"

**Based on:**
- Historical delivery timestamps from tracking data
- Postal code-specific patterns
- Courier-specific patterns
- Service type (Home Delivery shows time, Locker doesn't need it)

---

## 📊 **DATA COLLECTION**

### **Tracking Events Table:**

```sql
-- Add delivery_time column to track actual delivery hour
ALTER TABLE orders
ADD COLUMN delivered_time TIME,  -- Time of day delivered
ADD COLUMN delivered_hour INTEGER GENERATED ALWAYS AS (
  EXTRACT(HOUR FROM delivered_at)
) STORED;

-- Index for fast queries
CREATE INDEX idx_orders_delivered_hour ON orders(delivered_hour)
WHERE delivered_at IS NOT NULL;

-- Example data:
-- Order 1: delivered_at = '2025-11-08 14:23:15' → delivered_hour = 14
-- Order 2: delivered_at = '2025-11-08 16:45:30' → delivered_hour = 16
-- Order 3: delivered_at = '2025-11-08 09:15:00' → delivered_hour = 9
```

---

## 🧮 **PREDICTION ALGORITHM**

### **Step 1: Collect Historical Delivery Times**

```sql
-- Get last 30 days of deliveries for this postal code + courier + service type
SELECT 
  order_id,
  delivered_at,
  delivered_hour,
  EXTRACT(DOW FROM delivered_at) as day_of_week  -- 0=Sunday, 6=Saturday
FROM orders
WHERE 
  courier_id = 'postnord-id'
  AND postal_code = '12345'
  AND service_type = 'home_delivery'
  AND delivered_at IS NOT NULL
  AND delivered_at >= NOW() - INTERVAL '30 days'
ORDER BY delivered_at DESC;

-- Results:
-- Order 1: 14:23 (Monday)
-- Order 2: 16:45 (Tuesday)
-- Order 3: 14:10 (Wednesday)
-- Order 4: 15:30 (Thursday)
-- Order 5: 13:45 (Friday)
-- Order 6: 09:15 (Monday)  ← Outlier
-- Order 7: 14:55 (Tuesday)
-- Order 8: 16:20 (Wednesday)
-- Order 9: 15:10 (Thursday)
-- Order 10: 14:30 (Friday)
```

### **Step 2: Calculate Time Window**

```typescript
interface DeliveryTimeData {
  hour: number;
  minute: number;
  dayOfWeek: number;
  timestamp: Date;
}

function calculateDeliveryTimeWindow(
  deliveries: DeliveryTimeData[]
): TimeWindow {
  const MIN_SAMPLES = 5;
  
  if (deliveries.length < MIN_SAMPLES) {
    return {
      type: 'no_prediction',
      message: 'Insufficient data'
    };
  }
  
  // Convert to minutes since midnight for easier calculation
  const deliveryMinutes = deliveries.map(d => 
    d.hour * 60 + d.minute
  );
  
  // Remove outliers (same IQR method as before)
  const cleanedMinutes = removeOutliers(deliveryMinutes);
  
  // Calculate average and standard deviation
  const avgMinutes = cleanedMinutes.reduce((sum, m) => sum + m, 0) / cleanedMinutes.length;
  const stdDev = calculateStdDev(cleanedMinutes, avgMinutes);
  
  // Determine window type based on standard deviation
  if (stdDev < 60) {
    // Narrow window: deliveries within 1 hour
    return {
      type: 'narrow',
      start_hour: Math.floor(avgMinutes / 60),
      end_hour: Math.floor(avgMinutes / 60) + 1,
      confidence: 'high',
      sample_size: cleanedMinutes.length
    };
  } else if (stdDev < 120) {
    // Medium window: deliveries within 2-3 hours
    const startMinutes = avgMinutes - stdDev;
    const endMinutes = avgMinutes + stdDev;
    
    return {
      type: 'medium',
      start_hour: Math.floor(startMinutes / 60),
      end_hour: Math.ceil(endMinutes / 60),
      confidence: 'medium',
      sample_size: cleanedMinutes.length
    };
  } else {
    // Wide window: deliveries vary significantly
    return {
      type: 'wide',
      start_hour: 9,  // Default business hours
      end_hour: 17,
      confidence: 'low',
      sample_size: cleanedMinutes.length,
      message: 'Delivery times vary in this area'
    };
  }
}
```

### **Step 3: Apply Day-of-Week Patterns**

```typescript
function applyDayOfWeekPattern(
  deliveries: DeliveryTimeData[],
  targetDayOfWeek: number
): DeliveryTimeData[] {
  // Filter deliveries for same day of week
  const sameDayDeliveries = deliveries.filter(
    d => d.dayOfWeek === targetDayOfWeek
  );
  
  // If we have enough data for this specific day, use it
  if (sameDayDeliveries.length >= 3) {
    return sameDayDeliveries;
  }
  
  // Otherwise, use all days but weight same-day deliveries higher
  return deliveries;
}

// Example:
// Consumer ordering on Monday
// We have 3 Monday deliveries: [14:00, 14:30, 15:00]
// Use Monday-specific pattern: "14:00-15:00"
// More accurate than using all days
```

---

## 📊 **EXAMPLE CALCULATIONS**

### **Scenario 1: Consistent Delivery Times**

```
Historical data (last 30 days):
- 10 deliveries, all between 14:00-15:00
- [14:15, 14:23, 14:30, 14:45, 14:50, 14:10, 14:35, 14:40, 14:55, 14:20]

Average: 14:34
Std Dev: 15 minutes (narrow)

Display: "Usually delivered around 14:00-15:00" ✅
Confidence: High (10 samples, low variance)
```

### **Scenario 2: Medium Variance**

```
Historical data (last 30 days):
- 10 deliveries, between 13:00-17:00
- [13:30, 14:15, 14:45, 15:20, 15:45, 16:10, 14:30, 15:00, 16:30, 14:00]

Average: 14:54
Std Dev: 75 minutes (medium)

Display: "Usually delivered between 14:00-17:00" ⚠️
Confidence: Medium (10 samples, medium variance)
```

### **Scenario 3: High Variance**

```
Historical data (last 30 days):
- 10 deliveries, throughout the day
- [09:15, 11:30, 13:45, 14:20, 15:00, 16:30, 17:45, 10:00, 12:15, 18:00]

Average: 13:48
Std Dev: 180 minutes (wide)

Display: "Usually delivered during business hours (9:00-18:00)" ℹ️
Confidence: Low (10 samples, high variance)
Note: "Delivery times vary significantly"
```

### **Scenario 4: Monday Pattern**

```
Historical data (Mondays only):
- 5 Monday deliveries
- [14:00, 14:30, 15:00, 14:15, 14:45]

Average: 14:30
Std Dev: 20 minutes

Display: "Usually delivered around 14:00-15:00 on Mondays" ✅
Confidence: High (5 Monday samples, low variance)
```

---

## 🎨 **UI DISPLAY**

### **Home Delivery with Time Prediction:**

```tsx
<DeliveryOption
  courier="PostNord"
  service="Home Delivery"
  trustScore={92}
  rating={4.5}
  price="49 SEK"
  estimatedDelivery={{
    days: "Tomorrow",
    timeWindow: {
      start: "14:00",
      end: "17:00",
      confidence: "high"
    }
  }}
>
  <Box>
    {/* Delivery date */}
    <Typography variant="h6">
      Tomorrow (Nov 9)
    </Typography>
    
    {/* Time window */}
    <Box display="flex" alignItems="center" gap={1} mt={1}>
      <AccessTimeIcon fontSize="small" color="primary" />
      <Typography variant="body1" color="primary.main">
        Usually delivered between 14:00-17:00
      </Typography>
    </Box>
    
    {/* Confidence indicator */}
    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
      <CheckCircleIcon fontSize="small" color="success" />
      <Typography variant="caption" color="success.main">
        Based on 12 recent deliveries to your postal code
      </Typography>
    </Box>
    
    {/* Visual timeline */}
    <Box mt={2}>
      <DeliveryTimeline
        startHour={14}
        endHour={17}
        highlightedRange={[14, 17]}
      />
    </Box>
  </Box>
</DeliveryOption>
```

### **Parcel Locker (No Time Needed):**

```tsx
<DeliveryOption
  courier="PostNord"
  service="Parcel Locker"
  trustScore={92}
  rating={4.6}
  price="39 SEK"
  estimatedDelivery={{
    days: "Tomorrow",
    timeWindow: null  // Not applicable for lockers
  }}
>
  <Box>
    <Typography variant="h6">
      Tomorrow (Nov 9)
    </Typography>
    
    {/* No time window - locker is 24/7 */}
    <Box display="flex" alignItems="center" gap={1} mt={1}>
      <LockerIcon fontSize="small" />
      <Typography variant="body1">
        Pick up anytime (24/7 access)
      </Typography>
    </Box>
    
    <Typography variant="caption" color="text.secondary">
      Nearest locker: 200m away
    </Typography>
  </Box>
</DeliveryOption>
```

### **Visual Timeline Component:**

```tsx
function DeliveryTimeline({ 
  startHour, 
  endHour, 
  highlightedRange 
}: TimelineProps) {
  return (
    <Box sx={{ position: 'relative', height: 40 }}>
      {/* Background timeline (9:00-18:00) */}
      <Box sx={{ 
        position: 'absolute',
        width: '100%',
        height: 8,
        bgcolor: 'grey.200',
        borderRadius: 1,
        top: 16
      }} />
      
      {/* Highlighted delivery window */}
      <Box sx={{
        position: 'absolute',
        left: `${((highlightedRange[0] - 9) / 9) * 100}%`,
        width: `${((highlightedRange[1] - highlightedRange[0]) / 9) * 100}%`,
        height: 8,
        bgcolor: 'primary.main',
        borderRadius: 1,
        top: 16
      }} />
      
      {/* Time labels */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Typography variant="caption">9:00</Typography>
        <Typography variant="caption" fontWeight="bold" color="primary">
          {startHour}:00 - {endHour}:00
        </Typography>
        <Typography variant="caption">18:00</Typography>
      </Box>
    </Box>
  );
}
```

---

## 📋 **DATABASE SCHEMA**

### **Enhanced Delivery Time Cache:**

```sql
CREATE TABLE delivery_time_predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  postal_code VARCHAR(20) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  day_of_week INTEGER,  -- 0-6, NULL for all days
  
  -- Time window prediction
  start_hour INTEGER NOT NULL,  -- 0-23
  end_hour INTEGER NOT NULL,    -- 0-23
  avg_hour INTEGER,             -- Average delivery hour
  avg_minute INTEGER,           -- Average delivery minute
  
  -- Statistical data
  std_deviation_minutes INTEGER,
  sample_size INTEGER NOT NULL,
  confidence_level VARCHAR(20),  -- 'high', 'medium', 'low'
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(courier_id, postal_code, service_type, day_of_week)
);

CREATE INDEX idx_delivery_time_postal ON delivery_time_predictions(postal_code);
CREATE INDEX idx_delivery_time_courier ON delivery_time_predictions(courier_id);
CREATE INDEX idx_delivery_time_dow ON delivery_time_predictions(day_of_week);
```

---

## 🔄 **CALCULATION LOGIC**

### **API Endpoint:**

```typescript
// api/checkout/delivery-time-prediction.ts

export default async function handler(req: Request, res: Response) {
  const { courier_id, postal_code, service_type, delivery_date } = req.body;
  
  // Only predict for home delivery
  if (service_type !== 'home_delivery') {
    return res.json({
      has_prediction: false,
      reason: 'Time prediction only available for home delivery'
    });
  }
  
  const targetDayOfWeek = new Date(delivery_date).getDay();
  
  // Check cache first
  const cached = await supabase
    .from('delivery_time_predictions')
    .select('*')
    .eq('courier_id', courier_id)
    .eq('postal_code', postal_code)
    .eq('service_type', service_type)
    .eq('day_of_week', targetDayOfWeek)
    .gt('expires_at', new Date())
    .single();
  
  if (cached.data) {
    return res.json({
      has_prediction: true,
      time_window: {
        start_hour: cached.data.start_hour,
        end_hour: cached.data.end_hour,
        display: formatTimeWindow(cached.data.start_hour, cached.data.end_hour)
      },
      confidence: cached.data.confidence_level,
      sample_size: cached.data.sample_size,
      source: 'cache'
    });
  }
  
  // Calculate new prediction
  const historicalData = await supabase
    .from('orders')
    .select('delivered_at, delivered_hour')
    .eq('courier_id', courier_id)
    .eq('postal_code', postal_code)
    .eq('service_type', service_type)
    .not('delivered_at', 'is', null)
    .gte('delivered_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  const prediction = calculateTimeWindow(
    historicalData.data,
    targetDayOfWeek
  );
  
  // Cache the result
  await supabase
    .from('delivery_time_predictions')
    .upsert({
      courier_id,
      postal_code,
      service_type,
      day_of_week: targetDayOfWeek,
      ...prediction,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24 hours
    });
  
  return res.json({
    has_prediction: prediction.type !== 'no_prediction',
    time_window: {
      start_hour: prediction.start_hour,
      end_hour: prediction.end_hour,
      display: formatTimeWindow(prediction.start_hour, prediction.end_hour)
    },
    confidence: prediction.confidence,
    sample_size: prediction.sample_size,
    source: 'calculated'
  });
}

function formatTimeWindow(startHour: number, endHour: number): string {
  if (endHour - startHour <= 1) {
    return `around ${startHour}:00`;
  } else if (endHour - startHour <= 3) {
    return `between ${startHour}:00-${endHour}:00`;
  } else {
    return `during business hours`;
  }
}
```

---

## 🎯 **DISPLAY RULES**

### **When to Show Time Prediction:**

```typescript
function shouldShowTimePrediction(
  serviceType: string,
  confidence: string,
  sampleSize: number
): boolean {
  // Only for home delivery
  if (serviceType !== 'home_delivery') {
    return false;
  }
  
  // Need minimum 5 samples
  if (sampleSize < 5) {
    return false;
  }
  
  // Only show if confidence is medium or high
  if (confidence === 'low') {
    return false;
  }
  
  return true;
}
```

### **Display Formats:**

```typescript
// High confidence, narrow window (1 hour)
"Usually delivered around 14:00" ✅

// High confidence, medium window (2-3 hours)
"Usually delivered between 14:00-17:00" ✅

// Medium confidence, wider window (4+ hours)
"Usually delivered between 13:00-17:00" ⚠️

// Low confidence or insufficient data
"Delivered during business hours" ℹ️
```

---

## 📊 **ADVANCED FEATURES**

### **1. Rush Hour Adjustments**

```typescript
// Adjust for traffic patterns
function applyRushHourAdjustment(hour: number): number {
  // Morning rush (7-9): +30 minutes
  // Lunch (12-13): +15 minutes
  // Evening rush (16-18): +30 minutes
  
  const rushHours = {
    7: 30, 8: 30, 9: 30,
    12: 15, 13: 15,
    16: 30, 17: 30, 18: 30
  };
  
  return rushHours[hour] || 0;
}
```

### **2. Real-Time Updates**

```typescript
// Update prediction as courier gets closer
async function updateLiveDeliveryTime(orderId: string) {
  const order = await getOrder(orderId);
  const courierLocation = await getCourierLocation(order.courier_id);
  
  if (courierLocation.distance_km < 5) {
    // Within 5km - calculate ETA based on current location
    const eta = calculateETAFromLocation(
      courierLocation,
      order.delivery_address
    );
    
    return {
      type: 'live',
      estimated_arrival: eta,
      message: 'Driver is nearby - arriving in ~20 minutes'
    };
  }
  
  // Fall back to historical prediction
  return getHistoricalPrediction(order);
}
```

### **3. Weather Delays**

```typescript
// Adjust for weather conditions
async function applyWeatherDelay(
  baseTime: number,
  postal_code: string
): Promise<number> {
  const weather = await getWeatherForecast(postal_code);
  
  if (weather.severe) {
    return baseTime + 120;  // +2 hours for severe weather
  } else if (weather.rain) {
    return baseTime + 30;   // +30 minutes for rain
  }
  
  return baseTime;
}
```

---

## ✅ **BENEFITS**

1. **Better customer experience** - Know when to be home
2. **Reduced missed deliveries** - Consumer can plan
3. **Competitive advantage** - Most platforms don't show this
4. **Data-driven** - Based on actual tracking timestamps
5. **Postal code-specific** - Accounts for local patterns
6. **Day-aware** - Mondays might differ from Fridays

---

## 🚀 **IMPLEMENTATION**

**Phase 3: Optimization (4-6 weeks from now)**

**Quick Win (Phase 1):**
```sql
-- Start collecting delivery hour data NOW
ALTER TABLE orders
ADD COLUMN delivered_hour INTEGER GENERATED ALWAYS AS (
  EXTRACT(HOUR FROM delivered_at)
) STORED;

-- Will have data ready when implementing predictions
```

---

## 📋 **SUMMARY**

### **What Consumer Sees:**

**Home Delivery:**
```
Tomorrow (Nov 9)
⏰ Usually delivered between 14:00-17:00
✅ Based on 12 recent deliveries to your postal code
```

**Parcel Locker:**
```
Tomorrow (Nov 9)
📦 Pick up anytime (24/7 access)
Nearest locker: 200m away
```

**Parcel Shop:**
```
Tomorrow (Nov 9)
🏪 Pick up during store hours (10:00-20:00)
Nearest shop: ICA Supermarket, 500m
```

---

**Document:** `docs/daily/2025-11-08/TIME_OF_DAY_DELIVERY_PREDICTIONS.md`

**This is a game-changer for home delivery UX!** 🚀
