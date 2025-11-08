# UNIFIED BOOKING WITH CHANGE NOTIFICATIONS

**Date:** November 8, 2025, 8:35 PM  
**Status:** ✅ Enhanced  
**Priority:** P1 - Critical for UX

---

## 🎯 OBJECTIVE

Handle courier/service pre-selection from checkout and notify all parties when merchant makes changes.

---

## 📊 FLOW SCENARIOS

### **Scenario 1: Checkout Pre-Selected (No Changes)**
```
Webshop Checkout
  ├─ Customer selects: PostNord + Home Delivery
  ├─ Order created with courier_id + level_of_service
  └─ Webhook → Performile
  ↓
Performile Orders View
  ├─ Shows: PostNord + Home Delivery (pre-selected)
  └─ "Book Shipment" button
  ↓
Merchant Clicks "Book Shipment"
  ↓
BookShipmentModal Opens
  ├─ ℹ️ Alert: "Selected at Checkout: PostNord • Home Delivery"
  ├─ Pre-filled: courier = PostNord, service = Home Delivery
  └─ Merchant confirms (no changes)
  ↓
Book Shipment
  ├─ POST /api/shipments/book
  ├─ send_notifications = false (no changes)
  └─ Get tracking number + label
  ↓
Success
  ├─ ✅ "Shipment booked successfully!"
  ├─ NO notifications sent (customer already knows)
  └─ Order updated with tracking number
```

### **Scenario 2: Merchant Changes Courier**
```
Webshop Checkout
  ├─ Customer selects: PostNord + Home Delivery
  └─ Webhook → Performile
  ↓
Merchant Clicks "Book Shipment"
  ↓
BookShipmentModal Opens
  ├─ ℹ️ Alert: "Selected at Checkout: PostNord • Home Delivery"
  ├─ Pre-filled: PostNord + Home Delivery
  └─ Merchant changes to: Bring + Home Delivery
  ↓
⚠️ Warning Alert Appears
  ├─ "Changes Detected"
  ├─ "Courier has been changed"
  ├─ "Notifications will be sent to customer and webshop"
  └─ ☑️ "Send notifications about changes" (checked)
  ↓
Book Shipment
  ├─ POST /api/shipments/book
  ├─ send_notifications = true
  ├─ courier_changed = true
  └─ Get tracking number + label
  ↓
Send Notifications
  ├─ 📧 Email to Customer
  │   ├─ Subject: "Shipping Update for Order #123"
  │   ├─ Body: "Your shipment will be delivered by Bring instead of PostNord"
  │   └─ Include: New tracking number, new ETA
  │
  ├─ 📧 Email to Merchant
  │   ├─ Subject: "Shipment Booked with Changes"
  │   └─ Body: "Courier changed from PostNord to Bring"
  │
  └─ 🔗 Webhook to Webshop
      ├─ POST to merchant's webhook URL
      ├─ Event: "shipment.courier_changed"
      └─ Data: { old_courier, new_courier, tracking_number }
  ↓
Success
  ├─ ✅ "Shipment booked! Notifications sent to customer and webshop."
  └─ Order updated
```

### **Scenario 3: Merchant Changes Service Type**
```
Webshop Checkout
  ├─ Customer selects: PostNord + Home Delivery
  └─ Webhook → Performile
  ↓
Merchant Changes Service
  ├─ From: Home Delivery
  └─ To: Parcel Shop
  ↓
⚠️ Warning Alert
  ├─ "Service type has been changed"
  └─ Notifications enabled
  ↓
Send Notifications
  ├─ 📧 Email to Customer
  │   ├─ Subject: "Delivery Method Updated"
  │   ├─ Body: "Your package will be delivered to a parcel shop"
  │   └─ Include: Parcel shop address, pickup instructions
  │
  └─ 🔗 Webhook to Webshop
      ├─ Event: "shipment.service_changed"
      └─ Data: { old_service, new_service, parcel_shop }
```

### **Scenario 4: No Pre-Selection (Manual Booking)**
```
Webshop Order
  ├─ NO courier selected
  ├─ NO service selected
  └─ Webhook → Performile
  ↓
Merchant Clicks "Book Shipment"
  ↓
BookShipmentModal Opens
  ├─ NO pre-selection alert
  ├─ Empty courier dropdown
  └─ Empty service dropdown
  ↓
Merchant Selects
  ├─ Courier: PostNord
  └─ Service: Home Delivery
  ↓
Book Shipment
  ├─ send_notifications = true (first time selection)
  └─ Get tracking number
  ↓
Send Notifications
  ├─ 📧 Email to Customer
  │   ├─ Subject: "Your Order Has Shipped!"
  │   ├─ Body: "Your package is on its way"
  │   └─ Include: Tracking number, courier, ETA
  │
  └─ 🔗 Webhook to Webshop
      ├─ Event: "shipment.booked"
      └─ Data: { tracking_number, courier, service, eta }
```

---

## 🔧 ENHANCED API ENDPOINT

### **POST /api/shipments/book**

**Request Body:**
```typescript
{
  order_id: string;
  courier_id: string;
  service_type: string;
  send_notifications: boolean; // NEW: Control notifications
  courier_changed?: boolean;   // NEW: Track if changed
  service_changed?: boolean;   // NEW: Track if changed
  original_courier_id?: string; // NEW: For comparison
  original_service_type?: string; // NEW: For comparison
  pickup_address: Address;
  delivery_address: Address;
  package_details: PackageDetails;
  parcel_shop_id?: string;
}
```

**Response:**
```typescript
{
  success: true;
  tracking_number: string;
  label_url: string;
  estimated_delivery: string;
  courier_name: string;
  service_type: string;
  notifications_sent: {
    customer_email: boolean;
    merchant_email: boolean;
    webshop_webhook: boolean;
  };
  changes_detected: {
    courier_changed: boolean;
    service_changed: boolean;
  };
}
```

---

## 📧 NOTIFICATION TEMPLATES

### **Customer Email: Courier Changed**
```
Subject: Shipping Update for Order #{{order_number}}

Hi {{customer_name}},

We have an update about your order #{{order_number}}.

Your shipment will now be delivered by {{new_courier}} instead of {{old_courier}}.

New Shipping Details:
- Courier: {{new_courier}}
- Service: {{service_type}}
- Tracking Number: {{tracking_number}}
- Estimated Delivery: {{estimated_delivery}}

Track your package: {{tracking_url}}

If you have any questions, please contact us.

Best regards,
{{store_name}}
```

### **Customer Email: Service Changed**
```
Subject: Delivery Method Updated for Order #{{order_number}}

Hi {{customer_name}},

Your delivery method has been updated for order #{{order_number}}.

{{#if parcel_shop}}
Your package will be delivered to a parcel shop instead of your home address.

Pickup Location:
{{parcel_shop_name}}
{{parcel_shop_address}}

You will receive a notification when your package is ready for pickup.
{{else}}
Your package will be delivered to your home address instead of a parcel shop.

Delivery Address:
{{delivery_address}}
{{/if}}

Tracking Number: {{tracking_number}}
Track your package: {{tracking_url}}

Best regards,
{{store_name}}
```

### **Webshop Webhook: Courier Changed**
```json
{
  "event": "shipment.courier_changed",
  "timestamp": "2025-11-08T20:35:00Z",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-001",
    "old_courier": {
      "id": "uuid",
      "name": "PostNord",
      "code": "POSTNORD"
    },
    "new_courier": {
      "id": "uuid",
      "name": "Bring",
      "code": "BRING"
    },
    "tracking_number": "370123456789",
    "label_url": "https://...",
    "estimated_delivery": "2025-11-12T18:00:00Z",
    "reason": "merchant_changed"
  }
}
```

### **Webshop Webhook: Service Changed**
```json
{
  "event": "shipment.service_changed",
  "timestamp": "2025-11-08T20:35:00Z",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-001",
    "old_service": "home_delivery",
    "new_service": "parcel_shop",
    "parcel_shop": {
      "id": "12345",
      "name": "Circle K Majorstuen",
      "address": "Bogstadveien 1, 0355 Oslo"
    },
    "tracking_number": "370123456789",
    "reason": "merchant_changed"
  }
}
```

---

## 🎨 ENHANCED UI COMPONENTS

### **BookShipmentModal Features:**

**1. Pre-Selection Alert (Info)**
```
┌────────────────────────────────────────────┐
│ ℹ️ Selected at Checkout:                   │
│ Courier: PostNord • Service: Home Delivery │
│                                            │
│ You can change these selections below.    │
│ Customer will be notified of changes.     │
└────────────────────────────────────────────┘
```

**2. Courier Dropdown (with indicator)**
```
┌────────────────────────────────────────────┐
│ Courier                                    │
│ ┌────────────────────────────────────────┐ │
│ │ [PostNord Logo] PostNord [From Checkout]│ │
│ │ [Bring Logo] Bring                      │ │
│ │ [Budbee Logo] Budbee                    │ │
│ │ [DHL Logo] DHL                          │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**3. Change Warning Alert**
```
┌────────────────────────────────────────────┐
│ ⚠️ Changes Detected                        │
│                                            │
│ Courier has been changed.                 │
│ Service type has been changed.            │
│                                            │
│ Notifications will be sent to customer    │
│ and webshop about these changes.          │
│                                            │
│ ☑️ Send notifications about changes       │
└────────────────────────────────────────────┘
```

**4. Success Message (with changes)**
```
✅ Shipment booked! Notifications sent to customer and webshop.
```

**5. Success Message (no changes)**
```
✅ Shipment booked successfully!
```

---

## 🔄 NOTIFICATION FLOW

### **When to Send Notifications:**

**Always Send:**
- First time booking (no pre-selection)
- Courier changed from checkout selection
- Service changed from checkout selection
- Parcel shop changed

**Never Send:**
- Booking with pre-selected values (no changes)
- Merchant unchecks "Send notifications"

### **Notification Recipients:**

**Customer Email:**
- Always for changes
- Optional for first booking
- Include: New tracking, new ETA, new courier/service

**Merchant Email:**
- Always for changes
- Confirmation of booking
- Include: What changed, why

**Webshop Webhook:**
- Always (if configured)
- Include: Full change details
- Webshop can update order status

---

## 🎯 BEST PRACTICES

### **1. Order Confirmation in Performile (Recommended)**

**Why Better:**
- ✅ Single source of truth
- ✅ Consistent branding
- ✅ Real-time updates
- ✅ Tracking integration
- ✅ Easier to maintain

**Implementation:**
```typescript
// In Performile notification service
if (send_notifications && (courier_changed || service_changed)) {
  // Send email from Performile
  await sendCustomerEmail({
    template: 'shipping_update',
    to: customer_email,
    data: {
      order_number,
      old_courier,
      new_courier,
      tracking_number,
      tracking_url,
      estimated_delivery
    }
  });
  
  // Also notify webshop (for their records)
  await sendWebshopWebhook({
    event: 'shipment.courier_changed',
    data: { ... }
  });
}
```

### **2. Webshop Handles Confirmation (Alternative)**

**When to Use:**
- Webshop has custom email templates
- Webshop wants full control
- Multi-language requirements

**Implementation:**
```typescript
// Performile only sends webhook
if (send_notifications) {
  await sendWebshopWebhook({
    event: 'shipment.courier_changed',
    data: {
      order_id,
      changes: {
        courier: { old, new },
        service: { old, new }
      },
      tracking_number,
      customer_email,
      // Webshop sends email
      action_required: 'send_customer_email'
    }
  });
}
```

---

## 📊 DATABASE CHANGES

### **orders table (enhanced):**
```sql
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS original_courier_id UUID REFERENCES public.couriers(courier_id),
ADD COLUMN IF NOT EXISTS original_service_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS courier_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS courier_changed_by UUID REFERENCES public.users(user_id),
ADD COLUMN IF NOT EXISTS courier_change_reason TEXT;

COMMENT ON COLUMN public.orders.original_courier_id IS 'Courier selected at checkout (before merchant changes)';
COMMENT ON COLUMN public.orders.original_service_type IS 'Service selected at checkout (before merchant changes)';
COMMENT ON COLUMN public.orders.courier_changed_at IS 'When courier/service was changed by merchant';
COMMENT ON COLUMN public.orders.courier_changed_by IS 'Which merchant user made the change';
```

### **order_change_log table (new):**
```sql
CREATE TABLE IF NOT EXISTS public.order_change_log (
  change_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(user_id),
  change_type VARCHAR(50) NOT NULL, -- courier_changed, service_changed, address_changed
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  notifications_sent JSONB, -- { customer: true, merchant: true, webshop: true }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_change_log_order_id ON public.order_change_log(order_id);
CREATE INDEX idx_order_change_log_change_type ON public.order_change_log(change_type);
CREATE INDEX idx_order_change_log_created_at ON public.order_change_log(created_at);
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Frontend:**
- ✅ Enhanced BookShipmentModal
- ✅ Pre-selection alert
- ✅ Change detection
- ✅ Warning alert
- ✅ Notification checkbox
- ✅ Success messages

### **Backend:**
- ⏳ Enhanced /api/shipments/book
- ⏳ Change detection logic
- ⏳ Notification service integration
- ⏳ Email templates
- ⏳ Webhook integration

### **Database:**
- ⏳ Add columns to orders table
- ⏳ Create order_change_log table
- ⏳ Update RLS policies

### **Testing:**
- ⏳ Test pre-selection flow
- ⏳ Test courier change
- ⏳ Test service change
- ⏳ Test notifications
- ⏳ Test webhook delivery

---

## 🎉 SUMMARY

**Enhanced Features:**
- ✅ Pre-selected courier/service from checkout
- ✅ Visual indicators ("From Checkout" badges)
- ✅ Change detection (courier + service)
- ✅ Warning alerts when changes detected
- ✅ Notification control (checkbox)
- ✅ Smart notification logic
- ✅ Customer email notifications
- ✅ Webshop webhook notifications
- ✅ Change audit log

**User Experience:**
- Merchant sees what customer selected
- Merchant can change if needed
- Customer gets notified of changes
- Webshop stays in sync
- Full transparency

**Recommendation:**
✅ **Handle order confirmations in Performile** for:
- Single source of truth
- Real-time tracking updates
- Consistent branding
- Easier maintenance

**Status:** ✅ Frontend Complete, Backend Ready to Implement  
**Next:** Implement backend notification logic + email templates
