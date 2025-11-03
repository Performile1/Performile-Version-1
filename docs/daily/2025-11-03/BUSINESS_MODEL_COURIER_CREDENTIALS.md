# BUSINESS MODEL: PER-MERCHANT COURIER CREDENTIALS

**Date:** November 3, 2025, 5:35 PM  
**Decision:** Each merchant manages their own courier API credentials  
**Impact:** Major architecture change - better business model

---

## 🎯 BUSINESS MODEL

### **Direct Billing (Correct)**
```
Merchant ←→ Courier (Direct billing)
    ↓
Performile (Integration platform only)
```

**Benefits:**
- ✅ No financial liability for Performile
- ✅ Merchants negotiate their own rates
- ✅ Direct relationship with couriers
- ✅ Simpler accounting
- ✅ Use existing courier accounts

### **Platform as Middleman (Wrong)**
```
Merchant → Performile → Courier
         (markup)    (wholesale)
```

**Problems:**
- ❌ Performile liable for all courier costs
- ❌ Complex invoicing
- ❌ Financial risk
- ❌ Worse rates for merchants

---

## 📊 DATABASE CHANGES

### **OLD Structure:**
```sql
courier_api_credentials (
  credential_id UUID PRIMARY KEY,
  courier_name VARCHAR UNIQUE,  -- ❌ Only ONE credential per courier
  api_key TEXT,
  ...
)
```

### **NEW Structure:**
```sql
courier_api_credentials (
  credential_id UUID PRIMARY KEY,
  courier_id UUID,              -- Which courier
  store_id UUID,                -- ✅ Per store
  merchant_id UUID,             -- ✅ Per merchant
  customer_number VARCHAR,      -- ✅ Merchant's account number
  api_key TEXT,
  ...
  UNIQUE (courier_id, store_id, merchant_id)  -- ✅ Multiple credentials per courier
)
```

---

## 🔄 MERCHANT ONBOARDING FLOW

### **Step 1: Merchant Signs Up**
- Creates Performile account
- Sets up store(s)

### **Step 2: Merchant Has Courier Account**
- Already has PostNord account, OR
- Creates new PostNord account
- Gets API credentials from PostNord

### **Step 3: Merchant Adds Credentials**
- Goes to Performile Settings → Couriers
- Clicks "Add PostNord Credentials"
- Enters:
  - API Key
  - Customer Number
  - Account Name

### **Step 4: Performile Uses Merchant's Credentials**
- When merchant books shipment
- Performile uses THEIR credentials
- PostNord bills THEM directly

---

## 🛠️ TECHNICAL IMPLEMENTATION

### **Migration Script:**
`database/MIGRATE_COURIER_CREDENTIALS_PER_MERCHANT.sql`

**Changes:**
1. Add `store_id` column
2. Add `merchant_id` column
3. Add `customer_number` column
4. Remove UNIQUE constraint on `courier_name`
5. Add composite UNIQUE on `(courier_id, store_id, merchant_id)`
6. Update RLS policies (merchants see only their own)
7. Add helper function `get_merchant_courier_credentials()`

### **API Updates Needed:**

**1. Credential Management API:**
```typescript
POST /api/merchant/courier-credentials
GET /api/merchant/courier-credentials
PUT /api/merchant/courier-credentials/:id
DELETE /api/merchant/courier-credentials/:id
```

**2. Booking API Update:**
```typescript
// OLD: Use platform credentials
const credentials = await getCredentials('PostNord');

// NEW: Use merchant's credentials
const credentials = await getMerchantCredentials(
  'PostNord',
  merchant_id,
  store_id
);
```

**3. Validation Endpoint:**
```typescript
POST /api/merchant/courier-credentials/validate
// Test if credentials work
```

---

## 🎨 FRONTEND CHANGES NEEDED

### **1. Courier Settings Page**
```
Settings → Couriers
├── PostNord
│   ├── Status: ✅ Connected
│   ├── Customer Number: 12345
│   ├── Last Used: 2 hours ago
│   └── [Edit] [Test] [Remove]
├── Bring
│   └── [Add Credentials]
└── DHL
    └── [Add Credentials]
```

### **2. Add Credentials Modal**
```
Add PostNord Credentials
─────────────────────────
API Key: [________________]
Customer Number: [________]
Account Name: [___________]

[Test Connection] [Save]
```

### **3. Booking Flow**
```
Book Shipment
─────────────
Courier: PostNord
Using: Your PostNord account (12345)
Cost: 45 SEK (billed by PostNord)

[Book Shipment]
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Database (30 min)**
- [ ] Run migration script
- [ ] Verify new columns
- [ ] Test RLS policies
- [ ] Test helper function

### **Phase 2: Backend API (2 hours)**
- [ ] Create credential management endpoints
- [ ] Update booking API to use merchant credentials
- [ ] Add validation endpoint
- [ ] Add encryption for credentials
- [ ] Update error handling

### **Phase 3: Frontend (3 hours)**
- [ ] Create courier settings page
- [ ] Add credentials form
- [ ] Test connection button
- [ ] Update booking flow
- [ ] Show which account is used

### **Phase 4: Documentation (1 hour)**
- [ ] Merchant guide: "How to add courier credentials"
- [ ] API documentation
- [ ] Security best practices
- [ ] Troubleshooting guide

---

## 🔐 SECURITY CONSIDERATIONS

### **Encryption:**
- Store API keys encrypted at rest
- Use pgcrypto or application-level encryption
- Never log decrypted credentials

### **Access Control:**
- RLS policies: Merchants see only their credentials
- API endpoints require authentication
- Audit log all credential access

### **Validation:**
- Test credentials before saving
- Validate format (API key structure)
- Check rate limits

---

## 📈 BENEFITS SUMMARY

| Aspect | Old Model | New Model |
|--------|-----------|-----------|
| **Financial Risk** | High (Performile liable) | None (direct billing) |
| **Merchant Rates** | Worse (markup) | Better (direct) |
| **Accounting** | Complex | Simple |
| **Onboarding** | Easy (use ours) | Medium (add own) |
| **Flexibility** | Low (one account) | High (own accounts) |
| **Scalability** | Limited | Unlimited |

---

## 🚀 NEXT STEPS

### **Immediate:**
1. Run migration script
2. Update booking API
3. Test with one merchant

### **Short Term:**
4. Build frontend UI
5. Add validation
6. Documentation

### **Long Term:**
7. Support multiple couriers
8. Credential health monitoring
9. Usage analytics per merchant

---

## ✅ DECISION SUMMARY

**Status:** ✅ **APPROVED**  
**Priority:** **HIGH**  
**Impact:** **Major architecture change**

**This is the correct business model for a marketplace platform.**

---

*Created: November 3, 2025, 5:35 PM*  
*Framework: SPEC_DRIVEN_FRAMEWORK*  
*Compliance: Rule #1 (Database validation before changes)*
