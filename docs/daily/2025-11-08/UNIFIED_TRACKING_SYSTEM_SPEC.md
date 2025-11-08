# UNIFIED TRACKING SYSTEM SPECIFICATION

**Date:** November 8, 2025, 7:14 PM  
**Purpose:** Complete multi-courier, multi-merchant, multi-consumer tracking system  
**Status:** 🚀 Ready to Build  
**Priority:** P0 - CRITICAL

---

## 🎯 VISION

**"One tracking system for ALL couriers, ALL merchants, ALL consumers"**

A unified platform where:
- ✅ **Merchants** track all orders across all couriers in one dashboard
- ✅ **Consumers** track all packages from any courier with one tracking number
- ✅ **Couriers** integrate once and work with all merchants
- ✅ **Performile** acts as the universal tracking layer

---

## 🏗️ ARCHITECTURE PRINCIPLES

### **1. Courier-Agnostic Design**
- One `orders` table (not postnord_orders, bring_orders, etc.)
- One `tracking_events` table (all couriers)
- One `courier_tracking_cache` table (all couriers)
- One UI (`/track/:trackingNumber` - works for any courier)
- One API (`/api/tracking/*` - unified endpoints)

### **2. Flexible Data Model**
- `courier_metadata` JSONB (courier-specific data)
- Adapters per courier (PostNordAdapter, BringAdapter, etc.)
- Unified status mapping (courier status → Performile status)
- Extensible (add new couriers without schema changes)

### **3. Multi-Tenant**
- Multiple merchants
- Multiple stores per merchant
- Multiple couriers per merchant
- Multiple consumers
- Isolated data (RLS policies)

---

## 📊 EXISTING INFRASTRUCTURE (Already Built ✅)

### **Database Tables:**
1. ✅ `orders` - All orders from all couriers
2. ✅ `tracking_events` - All tracking events
3. ✅ `courier_tracking_cache` - Unified cache
4. ✅ `courier_api_requests` - API logging
5. ✅ `couriers` - Courier registry
6. ✅ `courier_api_credentials` - Per-merchant credentials
7. ✅ `stores` - Multi-store support
8. ✅ `users` - Merchants, couriers, consumers

### **API Endpoints (Existing):**
1. ✅ `GET /api/tracking/[trackingNumber]` - Track by number
2. ✅ `POST /api/tracking/postnord` - PostNord tracking
3. ✅ `POST /api/tracking/refresh` - Force refresh
4. ✅ `GET /api/shipment-tracking?action=*` - Various actions
5. ✅ `POST /api/shipment-tracking?action=webhook` - Webhook handler

### **Frontend Components (Existing):**
1. ✅ `TrackingPage.tsx` - Public tracking page
2. ✅ `OrderTracking.tsx` - Order tracking component
3. ✅ `ShipmentTracking.tsx` - Shipment tracking
4. ✅ `TrackingWidget.tsx` - Embeddable widget
5. ✅ `TrackingService.ts` - Unified tracking service

### **Courier Adapters (Existing):**
1. ✅ `PostNordAdapter.ts` - PostNord integration
2. ✅ `BringAdapter.ts` - Bring integration
3. ✅ `BudbeeAdapter.ts` - Budbee integration
4. ✅ `DHLAdapter.ts` - DHL integration
5. ✅ `BaseAdapter.ts` - Base adapter class

---

## 🆕 WHAT NEEDS TO BE BUILT

### **1. Unified Tracking Search** 🔴 PRIORITY
**Purpose:** Search tracking across all couriers, merchants, stores

**Features:**
- Search by tracking number (any courier)
- Search by order ID
- Search by customer email
- Search by date range
- Filter by courier
- Filter by status
- Filter by store
- Filter by merchant (admin only)

**API Endpoint:**
```typescript
GET /api/tracking/search?q={query}&courier={courier}&status={status}&store={store}
```

**Response:**
```json
{
  "results": [
    {
      "tracking_number": "370123456789",
      "order_id": "uuid",
      "courier": "PostNord",
      "courier_logo": "url",
      "status": "in_transit",
      "customer_name": "John Doe",
      "store_name": "Demo Store",
      "estimated_delivery": "2025-11-10",
      "last_event": {
        "timestamp": "2025-11-08T14:00:00Z",
        "description": "In transit",
        "location": "Stockholm"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20
}
```

**Files to Create:**
- `api/tracking/search.ts` (new)
- `apps/web/src/components/tracking/TrackingSearch.tsx` (new)
- `apps/web/src/components/tracking/TrackingSearchResults.tsx` (new)

---

### **2. Unified Webhook Handler** 🔴 PRIORITY
**Purpose:** Receive webhooks from ALL couriers in one endpoint

**Features:**
- Single webhook URL for all couriers
- Courier detection (from signature/payload)
- Signature verification per courier
- Route to appropriate adapter
- Update orders automatically
- Trigger notifications
- Log all webhooks

**API Endpoint:**
```typescript
POST /api/tracking/webhook
Headers:
  X-Courier: postnord|bring|budbee|dhl
  X-Webhook-Signature: {signature}
Body: {courier-specific payload}
```

**Flow:**
```
Courier Webhook → /api/tracking/webhook
  ↓
Detect courier (header or payload)
  ↓
Verify signature (courier-specific)
  ↓
Route to adapter (PostNordAdapter, BringAdapter, etc.)
  ↓
Parse event
  ↓
Update courier_tracking_cache
  ↓
Update order.courier_metadata
  ↓
Update order.order_status
  ↓
Create tracking_event
  ↓
Trigger notifications
  ↓
Return 200 OK
```

**Files to Create:**
- `api/tracking/webhook.ts` (new - unified handler)
- `api/lib/webhooks/WebhookRouter.ts` (new - route to adapters)
- `api/lib/webhooks/SignatureVerifier.ts` (new - verify signatures)
- `api/lib/webhooks/PostNordWebhook.ts` (new)
- `api/lib/webhooks/BringWebhook.ts` (new)
- `api/lib/webhooks/BudbeeWebhook.ts` (new)

---

### **3. Unified Status Updater** 🔴 PRIORITY
**Purpose:** Update order status based on tracking events (any courier)

**Features:**
- Map courier status → Performile status
- Update order.order_status
- Update order.courier_metadata
- Create tracking_event
- Detect exceptions (delays, failures)
- Trigger notifications
- Update analytics

**Status Mapping (Unified):**
```typescript
const UNIFIED_STATUS_MAP = {
  // PostNord
  'INFORMED': 'pending',
  'COLLECTED': 'picked_up',
  'IN_TRANSIT': 'in_transit',
  'DELIVERED': 'delivered',
  
  // Bring
  'REGISTERED': 'pending',
  'COLLECTED': 'picked_up',
  'IN_TRANSIT': 'in_transit',
  'DELIVERED': 'delivered',
  
  // Budbee
  'CREATED': 'pending',
  'PICKED_UP': 'picked_up',
  'IN_TRANSIT': 'in_transit',
  'DELIVERED': 'delivered',
  
  // DHL
  'TRANSIT': 'in_transit',
  'DELIVERED': 'delivered',
  
  // Universal
  'EXCEPTION': 'exception',
  'RETURNED': 'returned',
  'CANCELLED': 'cancelled'
};
```

**Files to Create:**
- `api/lib/services/UnifiedStatusUpdater.ts` (new)
- `api/lib/services/StatusMapper.ts` (new)
- `api/lib/services/ExceptionDetector.ts` (new)

---

### **4. Unified Notification System** 🟡
**Purpose:** Send notifications for ALL couriers, ALL merchants, ALL consumers

**Features:**
- Email notifications (all status changes)
- SMS notifications (premium - critical events)
- Push notifications (mobile app - Week 4)
- In-app notifications (dashboard)
- Webhook notifications (merchant API)
- Customizable per merchant
- Customizable per consumer
- Multi-language support

**Notification Types:**
1. **Order Shipped** - Courier picked up package
2. **In Transit** - Package moving
3. **Out for Delivery** - Delivery today
4. **Delivered** - Package delivered
5. **Exception** - Delay, failed delivery, returned
6. **Ready for Pickup** - At parcel shop/locker
7. **Delivery Attempt Failed** - Nobody home
8. **Customs Clearance** - International shipments

**Email Templates (Per Courier):**
- PostNord branded
- Bring branded
- Budbee branded
- DHL branded
- Performile white-label (default)

**Files to Create:**
- `api/lib/services/UnifiedNotificationService.ts` (new)
- `api/lib/templates/email/tracking-notifications.ts` (new)
- `api/lib/templates/sms/tracking-sms.ts` (new)
- `apps/web/src/components/settings/NotificationSettings.tsx` (new)

---

### **5. Consumer Tracking Portal** 🟡
**Purpose:** Public tracking portal for ALL consumers, ALL couriers

**Features:**
- Public URL: `https://track.performile.com/{trackingNumber}`
- No login required (magic link optional)
- Works for ANY courier
- Shows tracking timeline
- Shows map (if available)
- Shows estimated delivery
- Shows delivery proof (signature, photo)
- Delivery preferences (leave at door, etc.)
- Report issues
- Request redelivery
- Change delivery address (if allowed)
- Multi-language
- Mobile-optimized
- Embeddable widget

**URL Structure:**
```
https://track.performile.com/370123456789
https://track.performile.com/370123456789?lang=sv
https://track.performile.com/order/{orderId}
https://track.performile.com/order/{orderId}/magic/{token}
```

**Features by Courier:**
| Feature | PostNord | Bring | Budbee | DHL |
|---------|----------|-------|--------|-----|
| Tracking Timeline | ✅ | ✅ | ✅ | ✅ |
| Map | ✅ | ✅ | ✅ | ✅ |
| ETA | ✅ | ✅ | ✅ | ✅ |
| Delivery Proof | ✅ | ✅ | ❌ | ✅ |
| Change Address | ✅ | ❌ | ✅ | ✅ |
| Reschedule | ✅ | ✅ | ✅ | ✅ |
| Delivery Preferences | ✅ | ✅ | ✅ | ❌ |

**Files to Create:**
- `apps/web/src/pages/track/[trackingNumber].tsx` (new - public page)
- `apps/web/src/components/consumer/ConsumerTrackingPortal.tsx` (new)
- `apps/web/src/components/consumer/TrackingTimeline.tsx` (enhance existing)
- `apps/web/src/components/consumer/TrackingMap.tsx` (new)
- `apps/web/src/components/consumer/DeliveryPreferences.tsx` (new)
- `apps/web/src/components/consumer/ReportIssue.tsx` (new)

---

### **6. Background Jobs (Vercel Cron)** 🟢
**Purpose:** Automated tracking updates for ALL couriers

**Jobs:**

**1. Tracking Poller** (Every 30 minutes)
- Poll active shipments (in_transit, out_for_delivery)
- Update tracking data
- Detect status changes
- Trigger notifications
- Update analytics

**2. Issue Detector** (Every hour)
- Detect stuck shipments (no scan in 48 hours)
- Detect delayed shipments (past ETA)
- Detect failed deliveries
- Auto-create claims
- Alert merchants

**3. Cache Cleaner** (Daily at 2 AM)
- Remove expired cache entries
- Clean up old API logs (>90 days)
- Archive old tracking events (>1 year)

**4. Analytics Updater** (Daily at 3 AM)
- Update courier performance metrics
- Calculate on-time delivery rates
- Update TrustScores
- Generate reports

**Files to Create:**
- `api/cron/poll-tracking.ts` (new)
- `api/cron/detect-issues.ts` (new)
- `api/cron/clean-cache.ts` (new)
- `api/cron/update-analytics.ts` (new)
- `vercel.json` (add cron jobs)

---

## 📱 FRONTEND ARCHITECTURE

### **Unified Components (Reusable for ALL couriers)**

**1. TrackingTimeline.tsx**
- Visual timeline of events
- Works for any courier
- Courier-branded icons
- Responsive design

**2. TrackingMap.tsx**
- Shows shipment location
- Works for any courier
- Google Maps / Mapbox
- Real-time updates

**3. TrackingSearch.tsx**
- Unified search interface
- Filter by courier, status, date
- Auto-complete
- Recent searches

**4. TrackingDetails.tsx**
- Detailed tracking info
- Courier-specific data
- Delivery proof
- Actions (refresh, contact, etc.)

**5. CourierBadge.tsx**
- Shows courier logo
- Shows courier name
- Clickable (filter by courier)

---

## 🔄 DATA FLOW

### **Tracking Update Flow (Unified)**

```
1. Trigger (Webhook or Polling)
   ↓
2. Unified Webhook Handler (/api/tracking/webhook)
   ↓
3. Detect Courier (PostNord, Bring, Budbee, DHL)
   ↓
4. Route to Adapter (PostNordAdapter, BringAdapter, etc.)
   ↓
5. Parse Event (courier-specific format → unified format)
   ↓
6. Update Cache (courier_tracking_cache)
   ↓
7. Update Order (courier_metadata, order_status)
   ↓
8. Create Event (tracking_events)
   ↓
9. Map Status (courier status → Performile status)
   ↓
10. Detect Issues (delays, exceptions)
    ↓
11. Trigger Notifications (email, SMS, push)
    ↓
12. Update Analytics (performance metrics)
    ↓
13. Return Success
```

---

## 🎨 UI/UX DESIGN

### **Merchant Dashboard**
```
┌─────────────────────────────────────────────┐
│ 🔍 Search Tracking                          │
│ [Search by tracking #, order ID, email...] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📦 Active Shipments (150)                   │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🚚 PostNord  370123456789               │ │
│ │ John Doe • Demo Store                   │ │
│ │ ● In Transit → Stockholm                │ │
│ │ ETA: Nov 10, 2025                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 🚚 Bring  SHIPMENTID123                 │ │
│ │ Jane Smith • Demo Electronics           │ │
│ │ ● Out for Delivery → Oslo               │ │
│ │ ETA: Today                              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

Filters: [All Couriers ▼] [All Status ▼] [All Stores ▼]
```

### **Consumer Portal**
```
┌─────────────────────────────────────────────┐
│ Track Your Package                          │
│ [Enter tracking number...]         [Track] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📦 Package from Demo Store                  │
│ 🚚 PostNord • 370123456789                  │
│                                             │
│ ● Delivered                                 │
│ Nov 10, 2025 at 2:30 PM                    │
│                                             │
│ Timeline:                                   │
│ ✓ Nov 8 - Picked up (Stockholm)            │
│ ✓ Nov 9 - In transit (Gothenburg)          │
│ ✓ Nov 10 - Out for delivery                │
│ ✓ Nov 10 - Delivered                       │
│                                             │
│ 📸 Delivery Proof                           │
│ [Photo] Signature: John Doe                │
│                                             │
│ [📧 Email Updates] [📱 SMS Alerts]          │
│ [⚠️ Report Issue] [📍 Track on Map]        │
└─────────────────────────────────────────────┘
```

---

## 📊 IMPLEMENTATION PLAN

### **Phase 1: Unified Search (3 hours)** 🔴 START HERE
1. Build search API endpoint
2. Create search UI component
3. Add filters (courier, status, store)
4. Test with multiple couriers
5. Deploy

**Files:**
- `api/tracking/search.ts`
- `apps/web/src/components/tracking/TrackingSearch.tsx`
- `apps/web/src/components/tracking/TrackingSearchResults.tsx`

### **Phase 2: Unified Webhooks (4 hours)** 🔴
1. Build webhook router
2. Implement signature verification
3. Create courier-specific webhook handlers
4. Test with PostNord, Bring, Budbee
5. Deploy

**Files:**
- `api/tracking/webhook.ts`
- `api/lib/webhooks/WebhookRouter.ts`
- `api/lib/webhooks/SignatureVerifier.ts`
- `api/lib/webhooks/PostNordWebhook.ts`
- `api/lib/webhooks/BringWebhook.ts`

### **Phase 3: Status Updater (2 hours)** 🟡
1. Build unified status mapper
2. Implement status updater
3. Add exception detection
4. Test with all couriers
5. Deploy

**Files:**
- `api/lib/services/UnifiedStatusUpdater.ts`
- `api/lib/services/StatusMapper.ts`
- `api/lib/services/ExceptionDetector.ts`

### **Phase 4: Notifications (3 hours)** 🟡
1. Build notification service
2. Create email templates (per courier)
3. Add SMS integration (optional)
4. Test notifications
5. Deploy

**Files:**
- `api/lib/services/UnifiedNotificationService.ts`
- `api/lib/templates/email/tracking-notifications.ts`
- `api/lib/templates/sms/tracking-sms.ts`

### **Phase 5: Consumer Portal (4 hours)** 🟢
1. Build public tracking page
2. Create tracking timeline
3. Add tracking map
4. Implement delivery preferences
5. Test and deploy

**Files:**
- `apps/web/src/pages/track/[trackingNumber].tsx`
- `apps/web/src/components/consumer/ConsumerTrackingPortal.tsx`
- `apps/web/src/components/consumer/TrackingTimeline.tsx`
- `apps/web/src/components/consumer/TrackingMap.tsx`

### **Phase 6: Background Jobs (2 hours)** 🟢
1. Build tracking poller
2. Build issue detector
3. Build cache cleaner
4. Add to vercel.json
5. Test and deploy

**Files:**
- `api/cron/poll-tracking.ts`
- `api/cron/detect-issues.ts`
- `api/cron/clean-cache.ts`
- `vercel.json`

---

## ⏱️ TOTAL TIME ESTIMATE

**Phase 1 (Search):** 3 hours 🔴  
**Phase 2 (Webhooks):** 4 hours 🔴  
**Phase 3 (Status):** 2 hours 🟡  
**Phase 4 (Notifications):** 3 hours 🟡  
**Phase 5 (Consumer):** 4 hours 🟢  
**Phase 6 (Jobs):** 2 hours 🟢  

**Total:** 18 hours (2-3 days)

---

## ✅ SUCCESS CRITERIA

### **Minimum (Must Have):**
- ✅ Search tracking across all couriers
- ✅ Unified webhook handler
- ✅ Auto-update order status
- ✅ Email notifications
- ✅ Consumer tracking portal

### **Target (Should Have):**
- ✅ SMS notifications
- ✅ Tracking map
- ✅ Delivery preferences
- ✅ Background polling
- ✅ Issue detection

### **Stretch (Nice to Have):**
- ✅ Push notifications
- ✅ Webhook notifications (merchant API)
- ✅ Multi-language support
- ✅ Embeddable widget
- ✅ Analytics dashboard

---

## 🚀 NEXT STEPS

**Immediate:**
1. Start with Phase 1 (Unified Search)
2. Build search API endpoint
3. Create search UI
4. Test with PostNord + Bring

**This Week:**
1. Complete Phase 1-2 (Search + Webhooks)
2. Test with real courier webhooks
3. Deploy to production

**Next Week:**
1. Complete Phase 3-6
2. Full system testing
3. Launch consumer portal

---

## 📚 ARCHITECTURE BENEFITS

### **For Merchants:**
- ✅ One dashboard for all couriers
- ✅ Unified tracking experience
- ✅ Easy to add new couriers
- ✅ Consistent UI/UX

### **For Consumers:**
- ✅ Track any package with one URL
- ✅ No need to know which courier
- ✅ Consistent experience
- ✅ Mobile-friendly

### **For Couriers:**
- ✅ Integrate once, work with all merchants
- ✅ Standard webhook format
- ✅ Automatic status updates
- ✅ Analytics and insights

### **For Performile:**
- ✅ Scalable architecture
- ✅ Easy to add new couriers
- ✅ Unified data model
- ✅ Single codebase
- ✅ Lower maintenance

---

**Ready to build the unified tracking system!** 🚀

**Which phase should we start with?**
1. Phase 1 (Unified Search) - Recommended
2. Phase 2 (Unified Webhooks) - Critical
3. All phases in order
