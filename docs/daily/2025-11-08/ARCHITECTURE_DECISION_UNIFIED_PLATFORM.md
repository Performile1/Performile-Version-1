# ARCHITECTURE DECISION: UNIFIED PLATFORM

**Date:** November 8, 2025, 2:20 PM  
**Decision:** ❌ **NO SEPARATE COURIER-SPECIFIC VIEWS**  
**Status:** 🔴 **CRITICAL RULE**

---

## 🎯 THE RULE

### **❌ DO NOT BUILD:**
- Separate PostNord views
- Separate Bring views
- Separate DHL views
- Separate Budbee views
- Any courier-specific UI components

### **✅ USE EXISTING PLATFORM:**
- `orders` table (unified for all couriers)
- `tracking_events` table (unified for all couriers)
- `checkout_courier_analytics` table (unified)
- `service_performance` views (unified)
- `parcel_points` table (unified)
- `analytics` dashboards (unified)

---

## 🏗️ ARCHITECTURE PRINCIPLE

**"One Platform, Multiple Couriers"**

```
┌─────────────────────────────────────────┐
│         PERFORMILE PLATFORM             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Unified Orders Table          │   │
│  │   - All couriers                │   │
│  │   - Single schema               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Unified Tracking              │   │
│  │   - tracking_events             │   │
│  │   - courier_tracking_cache      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Unified Analytics             │   │
│  │   - checkout_courier_analytics  │   │
│  │   - service_performance         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
         ↓         ↓         ↓
    PostNord    Bring     Budbee
    (API only)  (API only) (API only)
```

---

## 📊 DATABASE STRUCTURE

### **Unified Orders Table:**
```sql
orders (
  order_id UUID,
  courier_id UUID,  -- Links to couriers table
  tracking_number VARCHAR(100),
  
  -- Courier-agnostic fields
  order_status VARCHAR(50),
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  
  -- Courier-specific data (JSONB)
  courier_metadata JSONB  -- Store courier-specific data here
)
```

### **Courier Metadata Example:**
```json
{
  "postnord": {
    "shipment_id": "ABC123",
    "service_code": "17",
    "delivery_option_id": "xyz789"
  },
  "bring": {
    "consignment_id": "DEF456",
    "product_code": "SERVICEPAKKE"
  }
}
```

---

## 🎨 UI ARCHITECTURE

### **❌ WRONG APPROACH:**
```
/dashboard/postnord/orders
/dashboard/postnord/tracking
/dashboard/postnord/analytics

/dashboard/bring/orders
/dashboard/bring/tracking
/dashboard/bring/analytics

/dashboard/budbee/orders
/dashboard/budbee/tracking
/dashboard/budbee/analytics
```

### **✅ CORRECT APPROACH:**
```
/dashboard/orders           (all couriers)
/dashboard/tracking         (all couriers)
/dashboard/analytics        (all couriers)
/dashboard/service-performance  (all couriers)
/dashboard/parcel-points    (all couriers)

Filter by courier:
- Dropdown: "All Couriers" | "PostNord" | "Bring" | "Budbee"
- URL: /dashboard/orders?courier=postnord
```

---

## 💻 IMPLEMENTATION PATTERN

### **Unified Orders Page:**
```tsx
// ✅ CORRECT - Single orders page
export function OrdersPage() {
  const [selectedCourier, setSelectedCourier] = useState('all');
  
  const { data: orders } = useQuery({
    queryKey: ['orders', selectedCourier],
    queryFn: () => fetchOrders({ courier: selectedCourier })
  });
  
  return (
    <div>
      <CourierFilter 
        value={selectedCourier}
        onChange={setSelectedCourier}
      />
      
      <OrdersTable orders={orders} />
    </div>
  );
}
```

### **Unified Tracking Page:**
```tsx
// ✅ CORRECT - Single tracking page
export function TrackingPage() {
  const [selectedCourier, setSelectedCourier] = useState('all');
  
  const { data: tracking } = useQuery({
    queryKey: ['tracking', selectedCourier],
    queryFn: () => fetchTracking({ courier: selectedCourier })
  });
  
  return (
    <div>
      <CourierFilter 
        value={selectedCourier}
        onChange={setSelectedCourier}
      />
      
      <TrackingTimeline events={tracking} />
    </div>
  );
}
```

---

## 🔧 API ENDPOINTS

### **✅ CORRECT - Unified Endpoints:**
```
GET  /api/orders?courier=postnord
GET  /api/tracking?courier=postnord
GET  /api/analytics?courier=postnord
GET  /api/service-performance?courier=postnord
```

### **❌ WRONG - Separate Endpoints:**
```
GET  /api/postnord/orders
GET  /api/postnord/tracking
GET  /api/postnord/analytics

GET  /api/bring/orders
GET  /api/bring/tracking
GET  /api/bring/analytics
```

---

## 📦 COURIER INTEGRATION PATTERN

### **Backend Structure:**
```
api/
  ├── lib/
  │   └── couriers/
  │       ├── PostNordCourier.ts   ✅ Courier-specific logic
  │       ├── BringCourier.ts      ✅ Courier-specific logic
  │       └── BudbeeCourier.ts     ✅ Courier-specific logic
  │
  ├── orders/
  │   └── index.ts                 ✅ Unified orders endpoint
  │
  ├── tracking/
  │   ├── postnord.ts              ✅ PostNord-specific tracking
  │   ├── bring.ts                 ✅ Bring-specific tracking
  │   └── index.ts                 ✅ Unified tracking endpoint
  │
  └── analytics/
      └── index.ts                 ✅ Unified analytics endpoint
```

### **Courier Factory Pattern:**
```typescript
// ✅ CORRECT - Factory pattern
export function getCourierClient(courierId: string) {
  switch (courierCode) {
    case 'POSTNORD':
      return new PostNordCourier(apiKey, courierId);
    case 'BRING':
      return new BringCourier(apiKey, courierId);
    case 'BUDBEE':
      return new BudbeeCourier(apiKey, courierId);
    default:
      throw new Error('Unsupported courier');
  }
}

// Usage in unified endpoint
const courier = getCourierClient(order.courier_id);
const tracking = await courier.trackShipment(order.tracking_number);
```

---

## 🎯 WHAT WE BUILT (CORRECT)

### **✅ PostNord Integration:**
- `PostNordCourier` class (courier-specific logic)
- `/api/tracking/postnord` (courier-specific endpoint)
- Stores data in unified `orders` table
- Uses unified `courier_tracking_cache` table
- Logs to unified `courier_api_requests` table

### **✅ No Separate Views:**
- No `/dashboard/postnord` routes
- No PostNord-specific UI components
- No PostNord-specific analytics pages

---

## 🚀 NEXT STEPS

### **When Adding Bring/Budbee:**

**1. Create Courier Class:**
```typescript
// api/lib/couriers/BringCourier.ts
export class BringCourier {
  async trackShipment(id: string) { }
  async getTrackingUrl(id: string) { }
  async searchPostalCode(code: string) { }
}
```

**2. Create Courier-Specific Endpoint:**
```typescript
// api/tracking/bring.ts
export default async function handler(req, res) {
  const bring = new BringCourier(apiKey, courierId);
  const tracking = await bring.trackShipment(shipmentId);
  
  // Store in UNIFIED tables
  await updateTrackingCache(tracking);
  await updateOrder(orderId, tracking);
}
```

**3. Use Existing UI:**
- Orders page already shows all couriers
- Tracking page already shows all couriers
- Analytics already aggregates all couriers
- Just add filter: "Bring" to dropdown

---

## 📋 CHECKLIST FOR NEW COURIERS

When integrating a new courier:

- [ ] ✅ Create courier class (`BringCourier.ts`)
- [ ] ✅ Create courier-specific API endpoint (`/api/tracking/bring.ts`)
- [ ] ✅ Store data in unified `orders` table
- [ ] ✅ Store tracking in unified `courier_tracking_cache`
- [ ] ✅ Log requests to unified `courier_api_requests`
- [ ] ✅ Add courier to `couriers` table
- [ ] ✅ Add courier logo to `/courier-logos/`
- [ ] ✅ Update courier factory function
- [ ] ❌ **DO NOT** create separate UI views
- [ ] ❌ **DO NOT** create separate database tables
- [ ] ❌ **DO NOT** create separate analytics

---

## 💡 BENEFITS OF UNIFIED PLATFORM

### **1. Single Source of Truth:**
- All orders in one table
- All tracking in one table
- All analytics in one place

### **2. Easy Comparison:**
- Compare PostNord vs Bring performance
- See all orders in one view
- Unified analytics across couriers

### **3. Simpler Maintenance:**
- One UI codebase
- One database schema
- One analytics system

### **4. Better UX:**
- Merchants see all orders together
- No switching between courier dashboards
- Unified search and filtering

### **5. Scalability:**
- Add new couriers without UI changes
- Just add courier class + API endpoint
- Existing UI automatically supports it

---

## 🔒 HARD RULES

### **Rule #1: One Orders Table**
❌ Never create `postnord_orders`, `bring_orders`, etc.  
✅ Always use unified `orders` table with `courier_id`

### **Rule #2: One Tracking System**
❌ Never create `postnord_tracking`, `bring_tracking`, etc.  
✅ Always use unified `tracking_events` and `courier_tracking_cache`

### **Rule #3: One UI**
❌ Never create `/dashboard/postnord/*` routes  
✅ Always use unified `/dashboard/*` with courier filter

### **Rule #4: One Analytics**
❌ Never create separate analytics per courier  
✅ Always use unified analytics with courier breakdown

### **Rule #5: Courier-Specific Logic in Classes**
✅ Courier differences handled in courier classes  
✅ API endpoints can be courier-specific  
❌ UI must remain unified

---

## 📖 EXAMPLES

### **✅ CORRECT - Unified Orders Query:**
```sql
SELECT 
  o.order_id,
  o.tracking_number,
  c.courier_name,
  o.order_status,
  o.estimated_delivery
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.merchant_id = $1
  AND ($2 = 'all' OR c.courier_code = $2)  -- Filter by courier
ORDER BY o.created_at DESC;
```

### **✅ CORRECT - Unified Analytics:**
```sql
SELECT 
  c.courier_name,
  COUNT(*) as total_orders,
  AVG(EXTRACT(EPOCH FROM (o.actual_delivery - o.estimated_delivery))) as avg_delay_seconds,
  SUM(CASE WHEN o.actual_delivery <= o.estimated_delivery THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as on_time_rate
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.merchant_id = $1
GROUP BY c.courier_name;
```

---

## ✅ SUMMARY

**Architecture:** 🏗️ **Unified Platform**

**What This Means:**
- ✅ One database schema for all couriers
- ✅ One UI for all couriers
- ✅ One analytics system for all couriers
- ✅ Courier-specific logic in classes only
- ❌ No separate views per courier

**Benefits:**
- 🚀 Faster development
- 🎯 Better UX
- 📊 Unified analytics
- 🔧 Easier maintenance
- 📈 Scalable architecture

---

**Status:** 🔴 **CRITICAL ARCHITECTURAL RULE**  
**Applies To:** All courier integrations (PostNord, Bring, Budbee, DHL, etc.)  
**Effective:** Immediately

---

**This is the foundation of Performile's architecture! 🏗️**
