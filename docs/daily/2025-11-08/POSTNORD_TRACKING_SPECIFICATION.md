# POSTNORD TRACKING IMPLEMENTATION SPECIFICATION

**Date:** November 8, 2025, 7:09 PM  
**Status:** 🚀 Ready to Build  
**Priority:** P0 - CRITICAL (Foundation for all features)

---

## 🎯 OVERVIEW

Complete PostNord tracking integration with:
1. ✅ Track shipments via API (cache-first)
2. ✅ Add tracking link to orders
3. ✅ Search shipments in track page
4. ✅ Auto-update orders on status changes (webhook/polling)
5. ✅ Real-time notifications
6. ✅ Consumer tracking portal

---

## 📋 REQUIREMENTS (Your Request)

### **1. Track Shipments** ✅
- Use PostNord API to track by shipment ID
- Cache responses (60 min TTL)
- Log all API requests
- Update order status automatically

### **2. Add Tracking Link in Order** ✅
- Generate PostNord tracking URL
- Store in `courier_metadata.postnord.tracking_url`
- Display in merchant dashboard
- Display in consumer portal
- Include in email notifications

### **3. Search for Tracking in Track Shipment** ✅
- Search by tracking number
- Search by order ID
- Search by customer email
- Show tracking timeline
- Show current status
- Show estimated delivery

### **4. Update Order When Status Changes** ✅
- Listen to PostNord webhooks (scans from courier)
- Polling fallback (every 30 min for active shipments)
- Update `order_status` based on courier status
- Update `courier_metadata.postnord` with latest data
- Trigger notifications on status changes
- Log all status changes in `tracking_events`

---

## 💡 ADDITIONAL SUGGESTIONS

### **5. Real-Time Notifications** 🆕
**Why:** Keep merchants and consumers informed
- Email on: shipped, in_transit, out_for_delivery, delivered, exception
- SMS for: out_for_delivery, delivered (optional, premium feature)
- Push notifications (mobile app - Week 4)
- In-app notifications (dashboard)

### **6. Tracking Analytics** 🆕
**Why:** Measure PostNord performance
- Average delivery time by postal code
- On-time delivery rate
- Exception rate (delays, failed deliveries)
- Customer satisfaction per shipment
- Compare PostNord vs other couriers

### **7. Proactive Issue Detection** 🆕
**Why:** Fix problems before customers complain
- Detect stuck shipments (no scan in 48 hours)
- Detect delayed shipments (past ETA)
- Auto-create claims for exceptions
- Alert merchant to take action

### **8. Consumer Self-Service** 🆕
**Why:** Reduce support tickets
- Consumer tracking portal (magic link)
- Delivery preferences (leave at door, neighbor, etc.)
- Reschedule delivery
- Change delivery address (if allowed)
- Report issues directly

### **9. Delivery Proof** 🆕
**Why:** Reduce disputes
- Capture signature (if available from PostNord)
- Capture delivery photo (if available)
- Store in `courier_metadata.postnord.proof_of_delivery`
- Display to merchant and consumer

### **10. Multi-Parcel Tracking** 🆕
**Why:** Handle split shipments
- Track multiple parcels per order
- Show combined status
- Notify when all parcels delivered
- Handle partial deliveries

---

## 🏗️ ARCHITECTURE

### **Database (Already Created ✅)**
```sql
-- orders table
courier_metadata JSONB {
  "postnord": {
    "shipment_id": "ABC123",
    "tracking_number": "370123456789",
    "tracking_url": "https://tracking.postnord.com/...",
    "service_code": "17",
    "last_tracking_update": "2025-11-08T19:00:00Z",
    "tracking_status": "IN_TRANSIT",
    "estimated_delivery": "2025-11-10T18:00:00Z",
    "events_count": 5,
    "proof_of_delivery": {
      "signature": "...",
      "photo_url": "...",
      "delivered_to": "John Doe",
      "delivered_at": "2025-11-10T14:30:00Z"
    }
  }
}

-- courier_tracking_cache (caching)
-- courier_api_requests (logging)
-- tracking_events (status history)
```

### **API Endpoints**

**Already Exists:**
- ✅ `POST /api/tracking/postnord` - Track by shipment ID

**Need to Build:**
- 🆕 `GET /api/tracking/search` - Search tracking by various criteria
- 🆕 `POST /api/tracking/webhook/postnord` - Receive PostNord webhooks
- 🆕 `GET /api/tracking/order/:orderId` - Get tracking for order
- 🆕 `POST /api/tracking/refresh` - Force refresh tracking
- 🆕 `GET /api/tracking/url/:shipmentId` - Get tracking URL
- 🆕 `POST /api/tracking/subscribe` - Subscribe to tracking updates

### **Background Jobs**

**Need to Build:**
- 🆕 **Tracking Poller** - Poll active shipments every 30 min
- 🆕 **Status Updater** - Update order status based on tracking
- 🆕 **Notification Sender** - Send notifications on status changes
- 🆕 **Issue Detector** - Detect stuck/delayed shipments
- 🆕 **Cache Cleaner** - Remove expired cache entries

---

## 📊 STATUS MAPPING

### **PostNord → Performile Order Status**

```typescript
const STATUS_MAPPING = {
  // PostNord Status → Performile Status
  'INFORMED': 'pending',           // Label created
  'COLLECTED': 'picked_up',        // Picked up from sender
  'IN_TRANSIT': 'in_transit',      // In transit
  'ARRIVED_AT_DELIVERY_POINT': 'out_for_delivery',
  'DELIVERED': 'delivered',        // Delivered
  'RETURNED': 'returned',          // Returned to sender
  'STOPPED': 'exception',          // Stopped/held
  'NO_INFO': 'pending',            // No tracking info yet
  'NOTIFICATION_SENT': 'out_for_delivery',
  'READY_FOR_PICKUP': 'ready_for_pickup'
};
```

---

## 🔔 NOTIFICATION TRIGGERS

### **Email Notifications:**
1. **Shipped** - Order picked up by PostNord
2. **In Transit** - First scan in transit
3. **Out for Delivery** - On delivery vehicle
4. **Delivered** - Successfully delivered
5. **Exception** - Delay, failed delivery, returned
6. **Ready for Pickup** - At parcel shop/locker

### **SMS Notifications (Premium):**
1. **Out for Delivery** - Delivery today
2. **Delivered** - Package delivered
3. **Exception** - Urgent issue

---

## 🔄 WEBHOOK FLOW

```
PostNord Scan → PostNord Webhook → /api/tracking/webhook/postnord
  ↓
Verify webhook signature
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
Update analytics
```

---

## 🎨 FRONTEND COMPONENTS

### **Merchant Dashboard:**
- 🆕 `TrackingTimeline.tsx` - Visual timeline of tracking events
- 🆕 `TrackingSearch.tsx` - Search tracking by various criteria
- 🆕 `TrackingMap.tsx` - Map showing shipment location
- 🆕 `TrackingDetails.tsx` - Detailed tracking information
- 🆕 `TrackingActions.tsx` - Actions (refresh, contact courier, etc.)

### **Consumer Portal:**
- 🆕 `ConsumerTracking.tsx` - Consumer-facing tracking page
- 🆕 `DeliveryPreferences.tsx` - Set delivery preferences
- 🆕 `ReportIssue.tsx` - Report delivery issues

---

## 📝 IMPLEMENTATION PLAN

### **Phase 1: Core Tracking (2 hours)** 🔴 PRIORITY
**Tasks:**
1. ✅ PostNord API integration (already done)
2. 🆕 Add tracking URL generation to orders
3. 🆕 Build tracking search endpoint
4. 🆕 Build tracking display components
5. 🆕 Test with real PostNord API

**Files to Create/Modify:**
- `api/tracking/search.ts` (new)
- `api/tracking/url.ts` (new)
- `api/orders/index.ts` (add tracking_url to response)
- `apps/web/src/components/tracking/TrackingTimeline.tsx` (new)
- `apps/web/src/components/tracking/TrackingSearch.tsx` (new)

### **Phase 2: Webhooks & Auto-Updates (2 hours)** 🟡
**Tasks:**
1. 🆕 Build webhook endpoint
2. 🆕 Implement webhook signature verification
3. 🆕 Build status update logic
4. 🆕 Create tracking_events on status changes
5. 🆕 Test webhook with PostNord test environment

**Files to Create:**
- `api/tracking/webhook/postnord.ts` (new)
- `api/lib/webhooks/PostNordWebhook.ts` (new)
- `api/lib/services/OrderStatusUpdater.ts` (new)

### **Phase 3: Polling Fallback (1 hour)** 🟡
**Tasks:**
1. 🆕 Build tracking poller (Vercel Cron)
2. 🆕 Poll active shipments every 30 min
3. 🆕 Update orders with latest tracking data
4. 🆕 Detect stuck/delayed shipments

**Files to Create:**
- `api/cron/poll-tracking.ts` (new)
- `vercel.json` (add cron job)

### **Phase 4: Notifications (1.5 hours)** 🟢
**Tasks:**
1. 🆕 Build notification service
2. 🆕 Email templates for each status
3. 🆕 Trigger notifications on status changes
4. 🆕 SMS integration (optional)

**Files to Create:**
- `api/lib/services/NotificationService.ts` (new)
- `api/lib/templates/tracking-emails.ts` (new)

### **Phase 5: Consumer Portal (2 hours)** 🟢
**Tasks:**
1. 🆕 Build consumer tracking page
2. 🆕 Magic link authentication
3. 🆕 Delivery preferences
4. 🆕 Issue reporting

**Files to Create:**
- `apps/web/src/pages/track/[trackingNumber].tsx` (new)
- `apps/web/src/components/consumer/ConsumerTracking.tsx` (new)

### **Phase 6: Analytics & Proactive Detection (1 hour)** 🟢
**Tasks:**
1. 🆕 Track PostNord performance metrics
2. 🆕 Detect stuck shipments
3. 🆕 Detect delayed shipments
4. 🆕 Auto-create claims

**Files to Create:**
- `api/cron/detect-issues.ts` (new)
- `api/analytics/courier-performance.ts` (enhance)

---

## ⏱️ TOTAL ESTIMATED TIME

**Phase 1 (Core):** 2 hours 🔴 **START HERE**  
**Phase 2 (Webhooks):** 2 hours 🟡  
**Phase 3 (Polling):** 1 hour 🟡  
**Phase 4 (Notifications):** 1.5 hours 🟢  
**Phase 5 (Consumer):** 2 hours 🟢  
**Phase 6 (Analytics):** 1 hour 🟢  

**Total:** 9.5 hours (can be done over 2 days)

---

## ✅ SUCCESS CRITERIA

### **Minimum (Must Have):**
- ✅ Track shipments via API
- ✅ Display tracking in merchant dashboard
- ✅ Add tracking link to orders
- ✅ Search tracking by tracking number
- ✅ Update order status automatically

### **Target (Should Have):**
- ✅ Webhook integration
- ✅ Email notifications
- ✅ Consumer tracking portal
- ✅ Tracking timeline UI
- ✅ Polling fallback

### **Stretch (Nice to Have):**
- ✅ SMS notifications
- ✅ Proactive issue detection
- ✅ Delivery preferences
- ✅ Proof of delivery
- ✅ Multi-parcel tracking

---

## 🚀 RECOMMENDED APPROACH

### **Today (Phase 1 - 2 hours):**
1. Add tracking URL generation
2. Build tracking search endpoint
3. Create tracking timeline component
4. Test with PostNord API

### **Tomorrow (Phases 2-3 - 3 hours):**
1. Build webhook endpoint
2. Implement auto-status updates
3. Build polling fallback

### **Next Week (Phases 4-6 - 4.5 hours):**
1. Notifications
2. Consumer portal
3. Analytics & detection

---

## 📚 RESOURCES

**PostNord API Documentation:**
- Tracking API: https://developer.postnord.com/api/docs/tracking
- Webhooks: https://developer.postnord.com/api/docs/webhooks
- Tracking URL: https://developer.postnord.com/api/docs/links

**Existing Code:**
- ✅ `api/tracking/postnord.ts` - Basic tracking
- ✅ `api/lib/couriers/PostNordCourier.ts` - Courier class
- ✅ Database functions: `get_cached_tracking()`, `update_tracking_cache()`, `log_courier_api_request()`

---

## 🎯 NEXT STEPS

**Immediate (Phase 1):**
1. Start with tracking URL generation
2. Build search endpoint
3. Create UI components
4. Test end-to-end

**Questions to Answer:**
- Do you want to start with Phase 1 now?
- Should we prioritize webhooks or polling first?
- Do you want SMS notifications (requires Twilio/similar)?
- Should consumer portal be public or require magic link?

---

**Ready to build! Which phase should we start with?** 🚀
