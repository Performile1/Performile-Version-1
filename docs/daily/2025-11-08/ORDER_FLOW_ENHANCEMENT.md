# ORDER FLOW ENHANCEMENT - TRACKING & BOOKING

**Date:** November 8, 2025, 8:30 PM  
**Status:** Enhancement Specification  
**Priority:** P1 - High

---

## 🎯 OBJECTIVE

Enhance order flow to:
1. ✅ Show tracking number immediately when received from webshop
2. ✅ Allow booking shipments directly in Performile
3. ✅ Update tracking and shipment status in real-time in Orders view
4. ✅ Seamless integration with unified tracking system

---

## 📊 CURRENT STATE

### **What We Have:**
✅ Orders view shows tracking numbers
✅ Tracking numbers are clickable links
✅ Shipment booking API exists (`/api/shipments/book`)
✅ Unified tracking system (Phase 1-4 complete)
✅ Real-time webhook updates
✅ Status updates via webhooks

### **What's Missing:**
❌ Real-time status updates in Orders view (need polling/websocket)
❌ "Book Shipment" button in Orders view
❌ Inline status indicator with live updates
❌ Quick actions (track, book, claim) in Orders table

---

## 🔄 ENHANCED ORDER FLOW

### **Flow 1: Order from Webshop (with tracking)**
```
Webshop Order Created
  ↓
Webhook → Performile
  ├─ order_number
  ├─ tracking_number (if available)
  ├─ customer details
  └─ delivery address
  ↓
Create Order in Performile
  ├─ order_status = 'pending'
  ├─ tracking_number = '370123456789'
  └─ courier_id (if known)
  ↓
Display in Orders View
  ├─ ✅ Tracking number shown immediately
  ├─ 🔗 Clickable link to tracking page
  └─ 📊 Status badge
  ↓
Courier Webhook → Performile
  ↓
Update Order Status (real-time)
  ├─ order_status = 'picked_up'
  ├─ courier_metadata updated
  └─ estimated_delivery updated
  ↓
Orders View Updates (auto-refresh)
  ├─ Status badge changes color
  ├─ Tracking info refreshed
  └─ Notification sent
```

### **Flow 2: Order from Webshop (no tracking)**
```
Webshop Order Created
  ↓
Webhook → Performile
  ├─ order_number
  ├─ NO tracking_number
  ├─ customer details
  └─ delivery address
  ↓
Create Order in Performile
  ├─ order_status = 'pending'
  ├─ tracking_number = NULL
  └─ courier_id = NULL
  ↓
Display in Orders View
  ├─ ⚠️ "No tracking" indicator
  ├─ 📦 "Book Shipment" button
  └─ Select courier dropdown
  ↓
Merchant Clicks "Book Shipment"
  ↓
Book Shipment Modal Opens
  ├─ Select courier
  ├─ Select service type
  ├─ Confirm addresses
  └─ Confirm package details
  ↓
POST /api/shipments/book
  ├─ Call courier API
  ├─ Get tracking number
  └─ Get label URL
  ↓
Update Order
  ├─ tracking_number = '370123456789'
  ├─ courier_id = 'uuid'
  ├─ order_status = 'confirmed'
  ├─ label_url = 'https://...'
  └─ estimated_delivery = '2025-11-12'
  ↓
Orders View Updates
  ├─ ✅ Tracking number shown
  ├─ 🔗 Clickable link
  ├─ 🏷️ "Download Label" button
  └─ Status = 'confirmed'
  ↓
Courier Webhook → Performile
  ↓
Real-time Status Updates
```

### **Flow 3: Manual Order Creation**
```
Merchant Clicks "New Order"
  ↓
Order Form Opens
  ├─ Order number (optional)
  ├─ Customer details
  ├─ Delivery address
  ├─ Package details
  └─ Select courier (optional)
  ↓
Option 1: Enter Tracking Number
  ├─ tracking_number = '370123456789'
  ├─ courier_id = 'uuid'
  └─ order_status = 'pending'
  ↓
Option 2: Book Shipment Now
  ├─ Select courier
  ├─ Select service type
  └─ Book via API
  ↓
Option 3: Save Without Tracking
  ├─ tracking_number = NULL
  ├─ courier_id = NULL
  └─ order_status = 'pending'
  ↓
Display in Orders View
  └─ Show appropriate actions
```

---

## 🎨 ENHANCED ORDERS VIEW UI

### **Table Columns:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ [✓] Tracking #   Order #  Store   Courier   Status   Date   Actions │
├──────────────────────────────────────────────────────────────────────┤
│ [✓] 370123456789 ORD-001  Store1  [PostNord] [Delivered] 2025-11-08 │
│     🔗 Click to track                        🟢 Live                 │
│                                                                       │
│ [✓] No tracking  ORD-002  Store2  -         [Pending]   2025-11-08  │
│     📦 Book Shipment                         ⚠️ Action needed        │
│                                                                       │
│ [✓] 370987654321 ORD-003  Store1  [Bring]   [In Transit] 2025-11-07│
│     🔗 Click to track                        🔵 Live                 │
└──────────────────────────────────────────────────────────────────────┘
```

### **Status Indicators:**
- 🟢 **Delivered** - Green badge
- 🔵 **In Transit** - Blue badge
- 🟡 **Pending** - Orange badge
- 🔴 **Exception** - Red badge
- ⚪ **No Tracking** - Gray badge

### **Quick Actions (Row Menu):**
- 👁️ **View Details** - Open drawer
- 🔗 **Track Shipment** - Open tracking page
- 📦 **Book Shipment** - Open booking modal (if no tracking)
- 🏷️ **Download Label** - Download shipping label
- 📧 **Send Notification** - Send tracking email
- ⚠️ **File Claim** - Open claims modal
- ✏️ **Edit Order** - Edit order details
- 🗑️ **Delete Order** - Delete order

---

## 🔄 REAL-TIME STATUS UPDATES

### **Option 1: Polling (Simple)**
```typescript
// Poll every 30 seconds for active orders
useEffect(() => {
  const interval = setInterval(() => {
    if (hasActiveOrders) {
      refetch(); // Refetch orders
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [hasActiveOrders]);
```

### **Option 2: WebSocket (Advanced - Week 4)**
```typescript
// Real-time updates via WebSocket
const ws = new WebSocket('wss://api.performile.com/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  if (update.type === 'order_status_changed') {
    // Update specific order in cache
    queryClient.setQueryData(['orders'], (old) => {
      return old.map(order => 
        order.order_id === update.order_id
          ? { ...order, ...update.data }
          : order
      );
    });
  }
};
```

### **Option 3: Server-Sent Events (SSE)**
```typescript
// Server pushes updates to client
const eventSource = new EventSource('/api/orders/stream');

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // Update orders cache
};
```

**Recommendation:** Start with **Polling** (Option 1), upgrade to **WebSocket** in Week 4.

---

## 📦 BOOK SHIPMENT MODAL

### **UI Components:**

```typescript
<BookShipmentModal
  open={bookingModalOpen}
  order={selectedOrder}
  onClose={() => setBookingModalOpen(false)}
  onSuccess={(trackingNumber, labelUrl) => {
    // Update order
    // Show success message
    // Refresh orders list
  }}
/>
```

### **Modal Steps:**

**Step 1: Select Courier**
- List of available couriers
- Show courier logos
- Show service types per courier
- Show estimated costs

**Step 2: Confirm Details**
- Pickup address (from store)
- Delivery address (from order)
- Package details (weight, dimensions)
- Service type (home delivery, parcel shop, locker)

**Step 3: Book & Generate Label**
- Call `/api/shipments/book`
- Show loading spinner
- Display tracking number
- Display label URL
- Option to download label
- Option to print label

**Step 4: Success**
- ✅ Shipment booked
- 🔗 Tracking number: 370123456789
- 🏷️ Label ready
- 📧 Notification sent to customer

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 1: Enhanced Orders View** (30 min)
1. Add "Book Shipment" button for orders without tracking
2. Add status indicator with live badge
3. Add quick actions menu
4. Add polling for real-time updates

### **Phase 2: Book Shipment Modal** (45 min)
1. Create BookShipmentModal component
2. Integrate with `/api/shipments/book`
3. Handle success/error states
4. Update orders cache

### **Phase 3: Real-Time Updates** (30 min)
1. Implement polling (30s interval)
2. Update status badges in real-time
3. Show toast notifications for updates
4. Highlight changed rows

### **Phase 4: Enhanced Tracking Display** (15 min)
1. Show latest tracking event in table
2. Add ETA countdown
3. Add delivery progress indicator
4. Add exception warnings

---

## 📊 ENHANCED ORDER OBJECT

```typescript
interface EnhancedOrder {
  // Existing fields
  order_id: string;
  tracking_number: string | null;
  order_number: string;
  order_status: string;
  
  // Enhanced fields
  courier_metadata: {
    postnord?: {
      last_tracking_update: string;
      tracking_status: string;
      latest_event: {
        timestamp: string;
        description: string;
        location: string;
      };
      estimated_delivery: string;
      label_url?: string;
    };
  };
  
  // Computed fields
  has_tracking: boolean;
  can_book_shipment: boolean;
  can_track: boolean;
  can_file_claim: boolean;
  is_active: boolean; // In transit or out for delivery
  needs_action: boolean; // No tracking or exception
  
  // Performance fields (from courier_performance)
  otd_status?: 'on_time' | 'delayed' | 'early';
  delivery_time_hours?: number;
  had_exception?: boolean;
}
```

---

## 🎯 USER EXPERIENCE IMPROVEMENTS

### **Immediate Visibility:**
✅ Tracking number shown as soon as available
✅ Clickable link to tracking page
✅ Status badge with color coding
✅ Latest tracking event preview

### **Quick Actions:**
✅ Book shipment (if no tracking)
✅ Track shipment (if has tracking)
✅ Download label (if booked)
✅ File claim (if exception)
✅ Send notification (manual)

### **Real-Time Updates:**
✅ Status changes reflected immediately
✅ Toast notifications for important events
✅ Highlight changed rows
✅ Auto-refresh active orders

### **Smart Indicators:**
✅ 🟢 Live status badge
✅ ⚠️ Action needed indicator
✅ 🔔 New update indicator
✅ ⏱️ ETA countdown

---

## 🚀 DEPLOYMENT

### **Files to Create:**
1. `apps/web/src/components/orders/BookShipmentModal.tsx`
2. `apps/web/src/components/orders/OrderStatusBadge.tsx`
3. `apps/web/src/components/orders/OrderQuickActions.tsx`
4. `apps/web/src/hooks/useOrderPolling.ts`

### **Files to Enhance:**
1. `apps/web/src/pages/Orders.tsx` - Add booking + polling
2. `api/orders/index.ts` - Add computed fields
3. `api/shipments/book.ts` - Enhance response

### **Database:**
- No new tables needed
- Use existing `orders` table
- Use existing `courier_metadata` JSONB

---

## ✅ SUCCESS CRITERIA

### **Must Have:**
- ✅ Show tracking number immediately when available
- ✅ "Book Shipment" button for orders without tracking
- ✅ Real-time status updates (polling)
- ✅ Clickable tracking links
- ✅ Status badges with colors

### **Should Have:**
- ✅ Book shipment modal
- ✅ Download label button
- ✅ Quick actions menu
- ✅ Latest event preview
- ✅ Action needed indicators

### **Nice to Have:**
- ⏳ WebSocket real-time updates (Week 4)
- ⏳ ETA countdown
- ⏳ Delivery progress bar
- ⏳ Bulk booking

---

## 📈 IMPACT

### **For Merchants:**
- ✅ See tracking numbers immediately
- ✅ Book shipments without leaving Performile
- ✅ Real-time status updates
- ✅ Quick access to all actions
- ✅ Better order management

### **For Operations:**
- ✅ Faster order processing
- ✅ Fewer manual steps
- ✅ Better visibility
- ✅ Proactive issue detection

### **For Customers:**
- ✅ Faster tracking info
- ✅ More accurate ETAs
- ✅ Better communication

---

**Status:** Ready to implement  
**Time Estimate:** 2 hours  
**Priority:** P1 - High  
**Dependencies:** Unified tracking system (✅ Complete)
