# LABEL GENERATION & PICKUP SCHEDULING

**Date:** November 8, 2025, 8:40 PM  
**Status:** Enhancement Specification  
**Priority:** P1 - Critical for TA (Transport Authorization)

---

## 🎯 OBJECTIVE

When booking shipments in Performile, automatically:
1. ✅ Generate shipping label (PDF)
2. ✅ Schedule pickup (if no fixed pickup arrangement)
3. ✅ Store label for merchant download
4. ✅ Notify merchant of pickup time

---

## 📊 COMPLETE BOOKING FLOW

### **Step 1: Book Shipment**
```
Merchant Clicks "Book Shipment"
  ↓
BookShipmentModal
  ├─ Select courier
  ├─ Select service type
  ├─ Confirm addresses
  └─ Confirm package details
  ↓
POST /api/shipments/book
  ├─ Call courier API
  ├─ Get tracking number
  ├─ Get shipment ID
  └─ Get label URL (or generate)
```

### **Step 2: Generate Label**
```
Courier API Response
  ↓
Check if label included
  ├─ YES: Label URL provided
  │   └─ Store label URL
  │
  └─ NO: Label URL not provided
      ↓
      Generate Label
      ├─ POST /api/labels/generate
      ├─ Courier: PostNord, Bring, DHL, etc.
      ├─ Format: PDF (A4 or 4x6)
      └─ Get label URL
      ↓
      Store Label
      ├─ Upload to storage (S3, Supabase Storage)
      ├─ Generate public URL
      └─ Save to database
```

### **Step 3: Check Pickup Arrangement**
```
Check Merchant Settings
  ↓
Has Fixed Pickup?
  ├─ YES: Fixed pickup arrangement
  │   ├─ Courier picks up daily at X time
  │   ├─ No scheduling needed
  │   └─ Just notify merchant
  │
  └─ NO: No fixed pickup
      ↓
      Schedule Pickup
      ├─ POST /api/pickups/schedule
      ├─ Pickup date: Tomorrow or selected date
      ├─ Pickup time window: 09:00-17:00
      ├─ Pickup address: Merchant address
      └─ Get pickup confirmation
      ↓
      Store Pickup Details
      ├─ pickup_id
      ├─ pickup_date
      ├─ pickup_time_window
      └─ pickup_status: scheduled
```

### **Step 4: Notify Merchant**
```
Send Notification
  ├─ 📧 Email to Merchant
  │   ├─ Subject: "Shipment Booked - Label Ready"
  │   ├─ Tracking number
  │   ├─ Label download link
  │   └─ Pickup details (if scheduled)
  │
  └─ 🔔 In-App Notification
      ├─ "Shipment booked successfully"
      ├─ "Label ready for download"
      └─ "Pickup scheduled for [date]"
```

---

## 🏷️ LABEL GENERATION

### **Courier-Specific Label APIs:**

**PostNord:**
```typescript
// PostNord provides label URL in booking response
const bookingResponse = await postNordAPI.book(...);
const labelUrl = bookingResponse.order.label.url; // PDF URL

// If not included, generate separately
const labelResponse = await postNordAPI.getLabel(shipmentId);
const labelUrl = labelResponse.label.url;
```

**Bring:**
```typescript
// Bring provides label in booking response
const bookingResponse = await bringAPI.book(...);
const labelUrl = bookingResponse.consignments[0].labels[0].url;

// Format options
const labelFormat = {
  format: 'PDF', // or 'ZPL' for thermal printers
  size: 'A4',    // or '10x19cm' for label printers
  layout: '2x2'  // 2 labels per page
};
```

**DHL:**
```typescript
// DHL provides base64 encoded label
const bookingResponse = await dhlAPI.book(...);
const labelBase64 = bookingResponse.documents[0].content;

// Convert to PDF and upload
const labelPdf = Buffer.from(labelBase64, 'base64');
const labelUrl = await uploadToStorage(labelPdf, 'label.pdf');
```

**Budbee:**
```typescript
// Budbee provides label URL
const bookingResponse = await budbeeAPI.book(...);
const labelUrl = bookingResponse.labelUrl;
```

---

## 📦 PICKUP SCHEDULING

### **Merchant Pickup Settings:**

**Database Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.merchant_pickup_settings (
  setting_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.users(user_id),
  store_id UUID REFERENCES public.stores(store_id),
  courier_id UUID REFERENCES public.couriers(courier_id),
  
  -- Pickup Type
  has_fixed_pickup BOOLEAN DEFAULT false,
  fixed_pickup_time VARCHAR(50), -- e.g., "Daily at 15:00"
  fixed_pickup_days VARCHAR(50), -- e.g., "Mon-Fri"
  
  -- Pickup Address (if different from store)
  pickup_address_line_1 VARCHAR(255),
  pickup_address_line_2 VARCHAR(255),
  pickup_postal_code VARCHAR(20),
  pickup_city VARCHAR(100),
  pickup_country VARCHAR(2),
  
  -- Pickup Contact
  pickup_contact_name VARCHAR(255),
  pickup_contact_phone VARCHAR(50),
  pickup_contact_email VARCHAR(255),
  
  -- Pickup Instructions
  pickup_instructions TEXT,
  access_code VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(merchant_id, store_id, courier_id)
);
```

### **Pickup Scheduling API:**

**PostNord Pickup API:**
```typescript
// Schedule pickup
const pickupResponse = await postNordAPI.schedulePickup({
  customerNumber: process.env.POSTNORD_CUSTOMER_NUMBER,
  pickupDate: '2025-11-09', // Tomorrow
  pickupTimeFrom: '09:00',
  pickupTimeTo: '17:00',
  address: {
    name: 'Merchant Store',
    street: 'Storgata 1',
    postalCode: '0155',
    city: 'Oslo',
    country: 'NO'
  },
  contact: {
    name: 'Store Manager',
    phone: '+4712345678',
    email: 'store@merchant.com'
  },
  parcels: [{
    shipmentId: '370123456789',
    weight: 1000, // grams
    quantity: 1
  }],
  instructions: 'Ring doorbell, 2nd floor'
});

// Response
{
  pickupId: 'PU-123456',
  pickupDate: '2025-11-09',
  pickupTimeWindow: '09:00-17:00',
  status: 'scheduled',
  confirmationNumber: 'CONF-789'
}
```

**Bring Pickup API:**
```typescript
// Schedule pickup
const pickupResponse = await bringAPI.schedulePickup({
  customerNumber: process.env.BRING_CUSTOMER_NUMBER,
  pickupDate: '2025-11-09',
  pickupAddress: {
    name: 'Merchant Store',
    addressLine: 'Storgata 1',
    postalCode: '0155',
    city: 'Oslo',
    countryCode: 'NO'
  },
  contact: {
    name: 'Store Manager',
    phoneNumber: '+4712345678',
    email: 'store@merchant.com'
  },
  packages: [{
    consignmentId: 'SHIPMENTID123',
    weightInKg: 1.0,
    numberOfPackages: 1
  }],
  earliestPickupTime: '09:00',
  latestPickupTime: '17:00',
  additionalInformation: 'Ring doorbell'
});
```

---

## 🗄️ DATABASE SCHEMA

### **shipment_labels table:**
```sql
CREATE TABLE IF NOT EXISTS public.shipment_labels (
  label_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(courier_id),
  tracking_number VARCHAR(100) NOT NULL,
  
  -- Label Details
  label_url VARCHAR(500) NOT NULL, -- Public URL to download
  label_format VARCHAR(20) DEFAULT 'PDF', -- PDF, ZPL, PNG
  label_size VARCHAR(20) DEFAULT 'A4', -- A4, 4x6, 10x19cm
  label_type VARCHAR(50) DEFAULT 'shipping', -- shipping, return
  
  -- Storage
  storage_provider VARCHAR(50) DEFAULT 'supabase', -- supabase, s3, gcs
  storage_path VARCHAR(500), -- Path in storage
  file_size_bytes INTEGER,
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Some labels expire
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipment_labels_order_id ON public.shipment_labels(order_id);
CREATE INDEX idx_shipment_labels_tracking_number ON public.shipment_labels(tracking_number);
CREATE INDEX idx_shipment_labels_courier_id ON public.shipment_labels(courier_id);
```

### **scheduled_pickups table:**
```sql
CREATE TABLE IF NOT EXISTS public.scheduled_pickups (
  pickup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.users(user_id),
  store_id UUID NOT NULL REFERENCES public.stores(store_id),
  courier_id UUID NOT NULL REFERENCES public.couriers(courier_id),
  
  -- Pickup Details
  courier_pickup_id VARCHAR(100), -- Pickup ID from courier system
  pickup_date DATE NOT NULL,
  pickup_time_from TIME,
  pickup_time_to TIME,
  pickup_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, failed
  
  -- Pickup Address
  pickup_address_line_1 VARCHAR(255) NOT NULL,
  pickup_address_line_2 VARCHAR(255),
  pickup_postal_code VARCHAR(20) NOT NULL,
  pickup_city VARCHAR(100) NOT NULL,
  pickup_country VARCHAR(2) NOT NULL,
  
  -- Pickup Contact
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_email VARCHAR(255),
  
  -- Shipments in Pickup
  shipment_ids TEXT[], -- Array of tracking numbers
  total_parcels INTEGER DEFAULT 1,
  total_weight_kg NUMERIC(10, 2),
  
  -- Instructions
  pickup_instructions TEXT,
  access_code VARCHAR(50),
  
  -- Confirmation
  confirmation_number VARCHAR(100),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  driver_name VARCHAR(255),
  driver_phone VARCHAR(50),
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.users(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_pickups_merchant_id ON public.scheduled_pickups(merchant_id);
CREATE INDEX idx_scheduled_pickups_store_id ON public.scheduled_pickups(store_id);
CREATE INDEX idx_scheduled_pickups_courier_id ON public.scheduled_pickups(courier_id);
CREATE INDEX idx_scheduled_pickups_pickup_date ON public.scheduled_pickups(pickup_date);
CREATE INDEX idx_scheduled_pickups_pickup_status ON public.scheduled_pickups(pickup_status);
```

---

## 🎨 ENHANCED UI FLOW

### **BookShipmentModal - Step 4: Label & Pickup**

**After successful booking:**
```
┌──────────────────────────────────────────────────┐
│ ✅ Shipment Booked Successfully!                 │
│                                                  │
│ Tracking Number: 370123456789                   │
│ Estimated Delivery: Nov 12, 2025                │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ 🏷️ Shipping Label                            │ │
│ │                                              │ │
│ │ [Download Label] [Print Label]              │ │
│ │                                              │ │
│ │ Format: PDF (A4)                            │ │
│ │ Size: 245 KB                                │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ 📦 Pickup Scheduled                          │ │
│ │                                              │ │
│ │ Date: Tomorrow, Nov 9, 2025                 │ │
│ │ Time: 09:00 - 17:00                         │ │
│ │ Address: Storgata 1, 0155 Oslo              │ │
│ │ Confirmation: PU-123456                     │ │
│ │                                              │ │
│ │ [View Pickup Details] [Cancel Pickup]      │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [Close]                                          │
└──────────────────────────────────────────────────┘
```

### **Orders View - Enhanced Actions:**

**Row Actions Menu:**
```
┌────────────────────────────────┐
│ 👁️ View Details               │
│ 🔗 Track Shipment              │
│ ─────────────────────────────  │
│ 🏷️ Download Label             │ ← NEW
│ 🖨️ Print Label                │ ← NEW
│ 📧 Email Label                 │ ← NEW
│ ─────────────────────────────  │
│ 📦 Schedule Pickup             │ ← NEW
│ 📅 View Pickup Details         │ ← NEW
│ ❌ Cancel Pickup               │ ← NEW
│ ─────────────────────────────  │
│ ⚠️ File Claim                  │
│ ✏️ Edit Order                  │
│ 🗑️ Delete Order                │
└────────────────────────────────┘
```

### **Pickup Settings Page:**

**Settings → Pickup Arrangements**
```
┌──────────────────────────────────────────────────┐
│ Pickup Arrangements                              │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ PostNord                                     │ │
│ │                                              │ │
│ │ ○ No fixed pickup (schedule per shipment)   │ │
│ │ ● Fixed pickup arrangement                  │ │
│ │                                              │ │
│ │   Pickup Time: Daily at 15:00               │ │
│ │   Pickup Days: Monday - Friday              │ │
│ │                                              │ │
│ │   [Edit] [Save]                             │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Bring                                        │ │
│ │                                              │ │
│ │ ● No fixed pickup (schedule per shipment)   │ │
│ │ ○ Fixed pickup arrangement                  │ │
│ │                                              │ │
│ │   [Configure]                               │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Pickup Address (if different from store):       │
│ ┌──────────────────────────────────────────────┐ │
│ │ Street: Storgata 1                          │ │
│ │ Postal Code: 0155                           │ │
│ │ City: Oslo                                  │ │
│ │ Country: Norway                             │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Pickup Contact:                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Name: Store Manager                         │ │
│ │ Phone: +47 12345678                         │ │
│ │ Email: store@merchant.com                   │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [Save Settings]                                  │
└──────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE API FLOW

### **Enhanced POST /api/shipments/book**

**Request:**
```typescript
{
  order_id: string;
  courier_id: string;
  service_type: string;
  pickup_address: Address;
  delivery_address: Address;
  package_details: PackageDetails;
  
  // NEW: Pickup options
  schedule_pickup?: boolean; // Default: auto-detect
  pickup_date?: string; // Default: tomorrow
  pickup_time_from?: string; // Default: 09:00
  pickup_time_to?: string; // Default: 17:00
  pickup_instructions?: string;
}
```

**Response:**
```typescript
{
  success: true;
  tracking_number: string;
  shipment_id: string;
  estimated_delivery: string;
  
  // Label details
  label: {
    label_id: string;
    label_url: string; // Public download URL
    label_format: 'PDF';
    label_size: 'A4';
    file_size_bytes: 245000;
    expires_at: string;
  };
  
  // Pickup details (if scheduled)
  pickup?: {
    pickup_id: string;
    courier_pickup_id: string;
    pickup_date: string;
    pickup_time_from: string;
    pickup_time_to: string;
    pickup_status: 'scheduled';
    confirmation_number: string;
  };
  
  // Merchant settings
  has_fixed_pickup: boolean;
}
```

---

## 📧 NOTIFICATION TEMPLATES

### **Merchant Email: Shipment Booked with Pickup**
```
Subject: Shipment Booked - Label & Pickup Ready

Hi {{merchant_name}},

Your shipment has been booked successfully!

Shipment Details:
- Order: {{order_number}}
- Tracking Number: {{tracking_number}}
- Courier: {{courier_name}}
- Service: {{service_type}}
- Estimated Delivery: {{estimated_delivery}}

📄 Shipping Label:
Download your label here: {{label_url}}
[Download Label] [Print Label]

📦 Pickup Scheduled:
Date: {{pickup_date}}
Time: {{pickup_time_from}} - {{pickup_time_to}}
Address: {{pickup_address}}
Confirmation: {{confirmation_number}}

Please have your package ready for pickup.

[View Pickup Details] [Cancel Pickup]

Best regards,
Performile Team
```

### **Merchant Email: Shipment Booked (Fixed Pickup)**
```
Subject: Shipment Booked - Label Ready

Hi {{merchant_name}},

Your shipment has been booked successfully!

Shipment Details:
- Order: {{order_number}}
- Tracking Number: {{tracking_number}}
- Courier: {{courier_name}}
- Estimated Delivery: {{estimated_delivery}}

📄 Shipping Label:
Download your label here: {{label_url}}
[Download Label] [Print Label]

📦 Pickup:
Your courier will pick up this package during your regular pickup time:
{{fixed_pickup_time}} on {{fixed_pickup_days}}

Please have your package ready.

Best regards,
Performile Team
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Backend:**
- ⏳ Enhance /api/shipments/book
  - ✅ Generate/retrieve label
  - ⏳ Upload label to storage
  - ⏳ Check merchant pickup settings
  - ⏳ Schedule pickup if needed
  - ⏳ Store label and pickup records

- ⏳ Create /api/labels/download
  - Download label by label_id
  - Track download count
  - Support print-friendly format

- ⏳ Create /api/pickups/schedule
  - Schedule pickup with courier
  - Store pickup details
  - Send confirmation

- ⏳ Create /api/pickups/cancel
  - Cancel scheduled pickup
  - Update status
  - Notify merchant

### **Frontend:**
- ⏳ Enhance BookShipmentModal
  - Add Step 4: Label & Pickup
  - Show label download
  - Show pickup details
  - Add print button

- ⏳ Enhance Orders View
  - Add "Download Label" action
  - Add "Print Label" action
  - Add "Schedule Pickup" action
  - Add "View Pickup" action

- ⏳ Create Pickup Settings Page
  - Configure fixed pickups
  - Set pickup address
  - Set pickup contact
  - Per courier settings

### **Database:**
- ⏳ Create merchant_pickup_settings table
- ⏳ Create shipment_labels table
- ⏳ Create scheduled_pickups table
- ⏳ Add RLS policies

---

## 🎉 SUMMARY

**Complete Booking Flow:**
1. ✅ Book shipment with courier
2. ✅ Generate/retrieve shipping label
3. ✅ Upload label to storage
4. ✅ Check merchant pickup settings
5. ✅ Schedule pickup (if no fixed arrangement)
6. ✅ Store label and pickup records
7. ✅ Notify merchant with label + pickup details

**Merchant Experience:**
- One-click booking
- Automatic label generation
- Automatic pickup scheduling
- Download/print label
- View pickup details
- Configure fixed pickups

**Courier Support:**
- PostNord ✅
- Bring ✅
- DHL ✅
- Budbee ✅
- UPS ✅

**Status:** Ready to implement  
**Time Estimate:** 4 hours  
**Priority:** P1 - Critical for TA
