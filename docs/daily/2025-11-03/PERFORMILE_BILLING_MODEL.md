# PERFORMILE BILLING MODEL

**Date:** November 3, 2025, 6:05 PM  
**Status:** ✅ **COMPLETE BUSINESS MODEL**  
**Priority:** **HIGH**

---

## 🎯 BUSINESS MODEL OVERVIEW

### **Three-Party System:**

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Merchant  │◄────────┤  Performile │────────►│   Courier   │
│             │         │  (Platform) │         │ (PostNord)  │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                        │
      │                       │                        │
   Pays for:              Charges:              Bills directly:
   - Subscription         - Label fees          - Shipping costs
   - Label fees           - Platform fee        - Fuel surcharge
                                                 - Insurance
```

---

## 💰 REVENUE STREAMS

### **1. Subscription Fees (Monthly)**
| Plan | Price | Included Labels | Invoice Rows | Reconciliation |
|------|-------|----------------|--------------|----------------|
| **Free** | $0 | 10 | 10 | ❌ No |
| **Starter** | $29 | 50 | 100 | ✅ Yes |
| **Professional** | $99 | 200 | 500 | ✅ Yes |
| **Enterprise** | $299 | 1,000 | Unlimited | ✅ Yes |

### **2. Per-Label Fees (After Free Quota)**
| Plan | Cost per Additional Label |
|------|--------------------------|
| **Free** | $2.00 |
| **Starter** | $1.50 |
| **Professional** | $1.00 |
| **Enterprise** | $0.50 |

### **3. Invoice Reconciliation (Feature Limit)**
- Free: No access
- Paid plans: Limited by invoice rows/month
- Helps merchants verify courier charges

---

## 🔄 COMPLETE WORKFLOW

### **Step 1: Merchant Books Shipment**

```typescript
// 1. Check label limit
const limit = await checkMerchantLabelLimit(merchant_id);
// Returns: { can_create: true, will_be_charged: true, charge: 1.50 }

// 2. Get cost from courier API
const courierCost = await postNordAPI.getShippingCost({
  from: pickup_address,
  to: delivery_address,
  weight: package_weight
});
// Returns: { cost: 45.00 SEK }

// 3. Create booking
const booking = await createShipmentBooking({
  ...shipment_data,
  courier_api_cost: 45.00  // From courier
});

// 4. Track Performile's label fee
await createLabelCharge({
  merchant_id,
  shipment_booking_id: booking.id,
  label_fee: 1.50,  // Performile's fee
  included_in_subscription: false
});

// 5. Track courier cost for reconciliation
await createShipmentCost({
  merchant_id,
  courier_id,
  customer_number: merchant.postnord_account,
  courier_api_cost: 45.00,  // What courier will charge
  performile_label_fee: 1.50  // What Performile charges
});
```

**Result:**
- Merchant pays courier: **45.00 SEK** (direct billing)
- Merchant pays Performile: **1.50 SEK** (label fee)
- Total merchant cost: **46.50 SEK**

---

### **Step 2: End of Month**

```typescript
// 1. Calculate merchant's usage
const summary = await calculateMonthlyUsage(merchant_id, 2025, 11);

// Returns:
{
  total_labels: 75,
  included_labels: 50,
  additional_labels: 25,
  subscription_fee: 29.00,
  additional_label_charges: 37.50,  // 25 × $1.50
  total_performile_charges: 66.50
}

// 2. Generate Performile invoice
await generatePerformileInvoice(merchant_id, summary);

// 3. Charge merchant
await chargePaymentMethod(merchant_id, 66.50);
```

---

### **Step 3: Courier Invoices Merchant**

```typescript
// Courier sends invoice to merchant (outside Performile)
// Merchant uploads to Performile for reconciliation

// 1. Check invoice limit
const limit = await checkInvoiceReconciliationLimit(merchant_id);
// Returns: { can_add: true, rows_used: 45, rows_limit: 100 }

// 2. Upload invoice
await uploadCourierInvoice({
  courier_invoice_number: 'PN-2025-11-001',
  total_amount: 2250.00,  // From courier
  shipment_count: 50
});

// 3. Auto-match shipments
const matched = await autoMatchInvoiceShipments(invoice_id);
// Returns: { matched: 48, discrepancies: 2 }

// 4. Show merchant discrepancies
// Merchant can verify charges and contact courier if needed
```

---

## 📊 DATABASE TABLES

### **New Tables (2):**

**1. `performile_label_charges`**
- Tracks Performile's label fees
- Links to shipment bookings
- Billing period tracking
- Payment status

**2. `merchant_usage_summary`**
- Monthly usage summary
- Label usage vs limits
- Invoice reconciliation usage
- Total Performile charges

### **Updated Tables:**

**1. `subscription_plans`**
- Added: `included_labels_per_month`
- Added: `cost_per_additional_label`
- Added: `invoice_rows_limit`
- Added: `invoice_reconciliation_enabled`

**2. `courier_shipment_costs`**
- Added: `courier_api_cost` (from API)
- Added: `performile_label_fee` (Performile's fee)
- Added: `performile_charge_id` (link to charge)

---

## 🔧 API ENDPOINTS NEEDED

### **1. Label Limit Check**
```typescript
GET /api/billing/label-limit
// Returns: can_create, labels_used, will_be_charged, charge_amount
```

### **2. Invoice Limit Check**
```typescript
GET /api/billing/invoice-limit
// Returns: can_add_invoice, rows_used, rows_remaining
```

### **3. Get Courier Cost**
```typescript
POST /api/couriers/:courier_code/get-cost
{
  from_address: {...},
  to_address: {...},
  package: {...}
}
// Returns: { cost: 45.00, currency: 'SEK' }
```

### **4. Create Label Charge**
```typescript
POST /api/billing/label-charge
// Called automatically after booking
{
  shipment_booking_id: "uuid",
  label_fee: 1.50
}
```

### **5. Monthly Usage**
```typescript
GET /api/billing/usage?year=2025&month=11
// Returns: usage summary
```

---

## 🎨 FRONTEND UPDATES NEEDED

### **1. Booking Flow - Show Costs**
```
Book Shipment
─────────────────────────
Courier: PostNord
Service: Home Delivery

Costs:
  Shipping (PostNord):     45.00 SEK
  Label Fee (Performile):   1.50 SEK
  ─────────────────────────────────
  Total:                   46.50 SEK

⚠️ This will use 1 additional label ($1.50)
   You have 25 labels remaining this month.

[Book Shipment]
```

### **2. Billing Dashboard**
```
Billing → Current Month
────────────────────────
Labels Used: 75 / 50 included
Additional: 25 labels × $1.50 = $37.50

Invoice Reconciliation: 45 / 100 rows

Current Charges:
  Subscription (Starter):  $29.00
  Additional Labels:       $37.50
  ─────────────────────────────────
  Total Due:               $66.50

[View Details] [Upgrade Plan]
```

### **3. Usage Alerts**
```
⚠️ You've used 48/50 included labels this month.
   Additional labels will cost $1.50 each.
   
   [Upgrade to Professional] (200 labels, $1.00 each)
```

---

## 💡 PRICING STRATEGY

### **Why This Model Works:**

**1. Predictable for Merchants:**
- Know subscription cost upfront
- See per-label cost before booking
- No surprises

**2. Scalable for Performile:**
- Revenue grows with usage
- High-volume merchants pay more
- Low-volume merchants pay less

**3. Competitive Advantage:**
- Invoice reconciliation (unique feature)
- Transparent pricing
- No markup on shipping

### **Example Revenue:**

**Merchant Profile:**
- Starter plan: $29/month
- 75 labels/month
- 50 included, 25 additional

**Monthly Revenue:**
```
Subscription:        $29.00
Additional labels:   $37.50  (25 × $1.50)
─────────────────────────────
Total:               $66.50/month
Annual:              $798/year
```

**With 100 merchants:**
- Monthly: $6,650
- Annual: $79,800

**With 500 merchants:**
- Monthly: $33,250
- Annual: $399,000

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 1: Database (NOW - 30 min)**
- [ ] Run ADD_PERFORMILE_BILLING_SYSTEM.sql
- [ ] Verify tables created
- [ ] Test helper functions

### **Phase 2: Courier API Integration (2 hours)**
- [ ] Add get_shipping_cost() to courier APIs
- [ ] Update booking flow to fetch cost
- [ ] Store courier_api_cost

### **Phase 3: Label Charging (2 hours)**
- [ ] Check label limit before booking
- [ ] Create label charge after booking
- [ ] Show cost to merchant

### **Phase 4: Usage Tracking (2 hours)**
- [ ] Calculate monthly summaries
- [ ] Generate Performile invoices
- [ ] Payment integration

### **Phase 5: Frontend (4 hours)**
- [ ] Show costs in booking flow
- [ ] Billing dashboard
- [ ] Usage alerts
- [ ] Upgrade prompts

---

## ✅ SUCCESS METRICS

**Merchant Satisfaction:**
- Clear pricing (no hidden fees)
- See costs before booking
- Invoice reconciliation saves time

**Performile Revenue:**
- Predictable subscription income
- Usage-based revenue scales
- High-value feature (reconciliation)

**Competitive Position:**
- Transparent pricing
- No shipping markup
- Unique reconciliation feature

---

## 📝 NEXT STEPS

1. **Run migration:**
   ```sql
   \i database/ADD_PERFORMILE_BILLING_SYSTEM.sql
   ```

2. **Update booking API:**
   - Fetch cost from courier API
   - Check label limit
   - Create label charge

3. **Build billing dashboard:**
   - Show usage
   - Show costs
   - Upgrade prompts

---

**Status:** ✅ **READY TO IMPLEMENT**  
**Priority:** **HIGH**  
**Value:** **CORE REVENUE MODEL**

---

*Created: November 3, 2025, 6:05 PM*  
*Framework: SPEC_DRIVEN_FRAMEWORK*  
*Compliance: Rule #1 (Database validation before changes)*
