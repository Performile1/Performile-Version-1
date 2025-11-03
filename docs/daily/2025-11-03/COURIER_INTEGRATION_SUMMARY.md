# COURIER INTEGRATION - COMPLETE SUMMARY

**Date:** November 3, 2025, 9:35 PM  
**Status:** ✅ Database Ready, UI Implementation Needed

---

## ✅ COMPLETED: DATABASE STRUCTURE

### **Tables:**
1. **`merchant_courier_selections`** - Which couriers merchant uses
   - `credentials_configured` - Boolean flag
   - `added_during` - 'registration' or 'settings'
   - `store_id` - Link to specific store
   - `auto_select` - Auto-select in booking flow

2. **`stores`** - Onboarding tracking
   - `courier_setup_completed` - Has at least one courier
   - `onboarding_step` - Current step in registration

3. **`courier_api_credentials`** - Merchant's API keys
   - Already has `merchant_id`, `store_id`, `customer_number`

### **Functions:**
```sql
-- Get merchant's couriers with credential status
SELECT * FROM get_merchant_couriers_with_status('merchant-uuid');

-- Add courier to merchant's list
SELECT add_merchant_courier_selection(
  'merchant-uuid',
  'courier-uuid',
  'store-uuid',
  'registration', -- or 'settings'
  false -- auto_select
);

-- Remove courier
SELECT remove_merchant_courier_selection('merchant-uuid', 'courier-uuid');
```

### **Views:**
```sql
-- Enhanced view with credentials
SELECT * FROM vw_merchant_courier_credentials
WHERE merchant_id = 'merchant-uuid';
```

---

## 🎨 UI IMPLEMENTATION NEEDED

### **Path 1: During Registration**

**Step 1: Basic Info**
- Email, password, company name
- Standard registration fields

**Step 2: Store Setup**
- Store name, address, phone
- Business details

**Step 3: Courier Selection (NEW!)**
```typescript
// Component: CourierSelectionStep.tsx
// API Call:
GET /api/couriers/available
// Returns: List of all active couriers

// User selects couriers (checkboxes)
// On submit:
POST /api/merchant/couriers/bulk-add
Body: {
  courier_ids: ['uuid1', 'uuid2'],
  added_during: 'registration'
}
```

**Step 4: Add Credentials (For each selected courier)**
```typescript
// Component: CourierCredentialsForm.tsx
// Shows form for PostNord, Bring, etc.

// Fields:
- Customer Number
- API Key
- Account Name (optional)

// Test connection:
POST /api/courier-credentials/test
Body: {
  courier_id: 'uuid',
  customer_number: '12345',
  api_key: 'key'
}

// Save:
POST /api/courier-credentials
Body: {
  courier_id: 'uuid',
  merchant_id: 'uuid',
  store_id: 'uuid',
  customer_number: '12345',
  api_key: 'encrypted-key',
  base_url: 'https://api2.postnord.com'
}
```

---

### **Path 2: After Registration (Settings)**

**Location:** Dashboard → Settings → Couriers

**UI Layout:**
```
┌─────────────────────────────────────────┐
│  Courier Settings                        │
├─────────────────────────────────────────┤
│                                          │
│  My Configured Couriers                  │
│  ┌────────────────────────────────────┐ │
│  │ [PostNord Logo] PostNord           │ │
│  │ Customer: 12345                    │ │
│  │ Status: ✅ Active                   │ │
│  │ [Edit] [Remove]                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Available Couriers                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ [Bring]  │ │  [DHL]   │ │  [UPS]   │ │
│  │ [+ Add]  │ │ [+ Add]  │ │ [+ Add]  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

**API Endpoints:**

```typescript
// 1. Get available couriers
GET /api/couriers/available?merchant_id={id}
Response: [
  {
    courier_id: 'uuid',
    courier_name: 'PostNord',
    logo_url: '...',
    is_configured: false, // Not yet added by merchant
    trust_score: 4.5
  }
]

// 2. Get merchant's configured couriers
GET /api/merchant/couriers
Response: [
  {
    selection_id: 'uuid',
    courier_id: 'uuid',
    courier_name: 'PostNord',
    credentials_configured: true,
    has_credentials: true,
    customer_number: '12345',
    is_active: true
  }
]

// 3. Add courier
POST /api/merchant/couriers
Body: {
  courier_id: 'uuid',
  store_id: 'uuid',
  added_during: 'settings'
}

// 4. Add credentials
POST /api/courier-credentials
Body: {
  courier_id: 'uuid',
  merchant_id: 'uuid',
  store_id: 'uuid',
  customer_number: '12345',
  api_key: 'key',
  base_url: 'https://api2.postnord.com'
}

// 5. Test credentials
POST /api/courier-credentials/test
Body: {
  credential_id: 'uuid'
}

// 6. Remove courier
DELETE /api/merchant/couriers/{courier_id}
// Also deletes associated credentials
```

---

## 📁 FILES TO CREATE

### **Backend APIs:**
```
api/
├── merchant/
│   └── couriers.ts          # Merchant courier management
└── courier-credentials.ts    # Already exists (Week 3)
```

### **Frontend Components:**
```
apps/web/src/
├── components/
│   ├── onboarding/
│   │   ├── CourierSelectionStep.tsx
│   │   └── CourierCredentialsForm.tsx
│   └── settings/
│       ├── CourierSettings.tsx
│       ├── ConfiguredCourierCard.tsx
│       └── AvailableCourierCard.tsx
└── pages/
    └── settings/
        └── couriers.tsx
```

---

## 🔄 USER FLOW EXAMPLES

### **Example 1: New Merchant Registration**
1. Signs up → Basic info
2. Creates store
3. **Selects PostNord + Bring**
4. Adds PostNord credentials → ✅ Test successful
5. Adds Bring credentials → ✅ Test successful
6. Completes registration
7. **Can immediately book shipments with both couriers**

### **Example 2: Existing Merchant Adds Courier**
1. Goes to Settings → Couriers
2. Sees: "My Configured Couriers" (PostNord already there)
3. Clicks "+ Add" on DHL
4. Modal opens: "Add DHL Credentials"
5. Enters customer number + API key
6. Tests connection → ✅ Success
7. Saves
8. **DHL now available in booking flow**

---

## 🎯 CURRENT STATUS

### ✅ **Completed:**
- Database schema
- Functions and triggers
- Views
- PostNord platform credentials

### ⏳ **Next Steps:**
1. Create backend API endpoints
2. Create frontend components
3. Add to registration flow
4. Add to settings page
5. Test end-to-end

---

## 💡 KEY FEATURES

1. **Flexible Integration**
   - Add during registration OR later
   - Multiple couriers per merchant
   - Per-store credentials

2. **Automatic Status Tracking**
   - Trigger updates `credentials_configured` automatically
   - Onboarding progress tracked
   - Can check if merchant is ready to book

3. **Security**
   - API keys encrypted (Week 3 implementation)
   - RLS policies protect merchant data
   - Test connection before saving

4. **User Experience**
   - Visual courier cards
   - Test connection button
   - Clear status indicators
   - Easy add/remove

---

## 📊 DATABASE QUERIES FOR UI

### **Check if merchant can book:**
```sql
SELECT 
  COUNT(*) > 0 as can_book
FROM vw_merchant_courier_credentials
WHERE merchant_id = 'uuid'
  AND credentials_configured = TRUE
  AND is_active = TRUE;
```

### **Get couriers for booking dropdown:**
```sql
SELECT 
  courier_id,
  courier_name,
  logo_url,
  customer_number
FROM vw_merchant_courier_credentials
WHERE merchant_id = 'uuid'
  AND credentials_configured = TRUE
  AND is_active = TRUE
ORDER BY display_order, courier_name;
```

### **Check onboarding status:**
```sql
SELECT 
  onboarding_step,
  courier_setup_completed
FROM stores
WHERE owner_user_id = 'merchant-uuid';
```

---

## 🚀 READY TO IMPLEMENT!

The database is ready. Now you need to:
1. Create the API endpoints
2. Build the UI components
3. Integrate into registration flow
4. Add settings page

**Would you like me to create the API endpoints or frontend components next?**
