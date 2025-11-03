# COURIER INVOICING & RECONCILIATION SYSTEM

**Date:** November 3, 2025, 5:40 PM  
**Purpose:** Track merchant's courier usage and reconcile with courier invoices  
**Business Model:** Direct billing - Performile provides tracking only

---

## 🎯 SYSTEM OVERVIEW

### **What This System Does:**
1. **Tracks** every shipment cost when merchant books
2. **Stores** courier invoice data when merchant receives invoice
3. **Matches** shipments to invoice line items
4. **Identifies** discrepancies between tracked and invoiced amounts
5. **Provides** monthly summaries for merchants

### **What This System Does NOT Do:**
- ❌ Process payments (courier bills merchant directly)
- ❌ Generate invoices (courier does this)
- ❌ Handle disputes (between merchant and courier)

---

## 📊 DATABASE TABLES

### **1. courier_shipment_costs**
**Purpose:** Track cost of each shipment for reconciliation

**Key Fields:**
- `shipment_booking_id` - Link to booking
- `merchant_id` - Who booked it
- `courier_id` - Which courier
- `customer_number` - Merchant's account number with courier
- `total_cost` - What we expect courier to charge
- `courier_invoice_number` - When matched to invoice
- `reconciled` - Has this been verified?
- `discrepancy_amount` - Difference if any

**Use Case:**
```sql
-- When merchant books shipment
INSERT INTO courier_shipment_costs (
  merchant_id, courier_id, customer_number,
  tracking_number, total_cost
) VALUES (...);
```

---

### **2. merchant_courier_invoices**
**Purpose:** Store courier invoices received by merchants

**Key Fields:**
- `merchant_id` - Who received invoice
- `courier_id` - From which courier
- `customer_number` - Merchant's account number
- `courier_invoice_number` - Invoice number from courier
- `invoice_date` - When invoice was issued
- `total_amount` - Total amount on invoice
- `shipment_count` - How many shipments on invoice
- `reconciliation_status` - pending/completed/discrepancy

**Use Case:**
```sql
-- When merchant uploads invoice
INSERT INTO merchant_courier_invoices (
  merchant_id, courier_id, customer_number,
  courier_invoice_number, total_amount
) VALUES (...);
```

---

### **3. invoice_shipment_mapping**
**Purpose:** Map shipments to invoice line items

**Key Fields:**
- `invoice_id` - Which invoice
- `cost_id` - Which shipment cost
- `matched_automatically` - Auto-matched by system?
- `invoice_line_amount` - Amount on invoice
- `tracked_amount` - Amount we tracked
- `difference` - Discrepancy

**Use Case:**
```sql
-- Auto-match shipments to invoice
SELECT auto_match_invoice_shipments('invoice-uuid');
```

---

### **4. courier_billing_summary**
**Purpose:** Monthly summary per merchant per courier

**Key Fields:**
- `merchant_id`, `courier_id`, `year`, `month`
- `total_shipments` - How many shipments
- `total_cost` - Total tracked cost
- `invoices_received` - How many invoices
- `total_invoiced_amount` - Total invoiced
- `total_discrepancy` - Difference

**Use Case:**
```sql
-- Generate monthly summary
SELECT calculate_monthly_courier_summary(
  merchant_id, courier_id, 2025, 11
);
```

---

## 🔄 WORKFLOW

### **Step 1: Merchant Books Shipment**
```
1. Merchant books shipment via Performile
2. Performile uses merchant's PostNord credentials
3. PostNord returns cost: 45 SEK
4. Performile stores in courier_shipment_costs:
   - merchant_id: merchant-uuid
   - courier_id: postnord-uuid
   - customer_number: merchant's PostNord account
   - tracking_number: JJSE123456
   - total_cost: 45.00 SEK
   - cost_status: 'pending'
```

### **Step 2: Courier Bills Merchant (Outside Performile)**
```
PostNord → Sends invoice to merchant
- Invoice #: PN-2025-11-001
- Period: Nov 1-30, 2025
- 50 shipments
- Total: 2,250 SEK
```

### **Step 3: Merchant Uploads Invoice to Performile**
```
1. Merchant goes to: Settings → Billing → Upload Invoice
2. Uploads PDF or enters data manually
3. Performile stores in merchant_courier_invoices:
   - courier_invoice_number: PN-2025-11-001
   - invoice_date: 2025-11-30
   - period_start: 2025-11-01
   - period_end: 2025-11-30
   - total_amount: 2,250 SEK
   - shipment_count: 50
```

### **Step 4: Auto-Match Shipments**
```
1. System runs: auto_match_invoice_shipments(invoice_id)
2. Finds all shipments in date range
3. Creates mappings in invoice_shipment_mapping
4. Calculates differences
5. Updates reconciliation_status
```

### **Step 5: Review Discrepancies**
```
Merchant Dashboard shows:
✅ 48 shipments matched (2,160 SEK)
⚠️ 2 shipments with discrepancy (90 SEK difference)
❌ 2 shipments not found in tracking

Merchant can:
- Review discrepancies
- Mark as resolved
- Contact courier if needed
```

---

## 🎨 FRONTEND FEATURES NEEDED

### **1. Billing Dashboard**
```
Billing → Overview
├── Current Month
│   ├── PostNord: 45 shipments, 2,025 SEK
│   ├── Bring: 12 shipments, 540 SEK
│   └── DHL: 3 shipments, 450 SEK
├── Pending Invoices (2)
└── Discrepancies (3)
```

### **2. Invoice Upload**
```
Billing → Upload Invoice
─────────────────────────
Courier: [PostNord ▼]
Invoice Number: [____________]
Invoice Date: [2025-11-30]
Total Amount: [2,250] SEK
Period: [2025-11-01] to [2025-11-30]
Upload PDF: [Choose File]

[Upload & Auto-Match]
```

### **3. Reconciliation View**
```
Invoice: PN-2025-11-001 (2,250 SEK)
────────────────────────────────────
Status: ⚠️ 2 Discrepancies

✅ Matched (48 shipments)
Tracking #          Date        Tracked    Invoiced   Diff
JJSE123456         Nov 1       45.00      45.00      0.00
JJSE123457         Nov 2       52.00      52.00      0.00
...

⚠️ Discrepancies (2 shipments)
JJSE123500         Nov 15      45.00      50.00      +5.00
JJSE123501         Nov 16      38.00      42.00      +4.00

[Mark as Resolved] [Contact Courier]
```

### **4. Monthly Summary**
```
November 2025 - PostNord
────────────────────────
Shipments: 50
Tracked Cost: 2,205 SEK
Invoiced: 2,250 SEK
Difference: +45 SEK (+2%)

[View Details] [Download Report]
```

---

## 🔧 API ENDPOINTS NEEDED

### **1. Track Shipment Cost**
```typescript
POST /api/billing/shipment-cost
// Called automatically after booking
{
  shipment_booking_id: "uuid",
  total_cost: 45.00,
  cost_breakdown: { base: 40, fuel: 5 }
}
```

### **2. Upload Invoice**
```typescript
POST /api/billing/invoice
{
  courier_id: "uuid",
  courier_invoice_number: "PN-2025-11-001",
  invoice_date: "2025-11-30",
  total_amount: 2250.00,
  period_start: "2025-11-01",
  period_end: "2025-11-30"
}
```

### **3. Auto-Match**
```typescript
POST /api/billing/invoice/:id/match
// Runs auto_match_invoice_shipments()
// Returns matched count and discrepancies
```

### **4. Get Summary**
```typescript
GET /api/billing/summary?year=2025&month=11
// Returns courier_billing_summary data
```

### **5. Get Discrepancies**
```typescript
GET /api/billing/discrepancies
// Returns unreconciled shipments
```

---

## 📈 BENEFITS

### **For Merchants:**
- ✅ Track all courier costs in one place
- ✅ Verify courier invoices automatically
- ✅ Identify overcharges
- ✅ Monthly summaries for accounting
- ✅ Export data for bookkeeping

### **For Performile:**
- ✅ No financial liability
- ✅ Provide value-added service
- ✅ Help merchants save money
- ✅ Build trust and loyalty
- ✅ Differentiate from competitors

---

## 🔐 SECURITY

### **RLS Policies:**
- Merchants see only their own data
- No cross-merchant data access
- Admin can view for support

### **Data Privacy:**
- Customer numbers encrypted at rest
- Invoice PDFs stored securely
- Audit log for all access

---

## 📊 ANALYTICS OPPORTUNITIES

### **For Merchants:**
- Cost per shipment trends
- Courier cost comparison
- Service type cost analysis
- Geographic cost patterns

### **For Performile:**
- Platform-wide courier cost trends
- Identify expensive couriers
- Negotiate better rates
- Market insights

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 1: Database (NOW)**
- [ ] Run CREATE_COURIER_INVOICING_TABLES.sql
- [ ] Verify tables created
- [ ] Test helper functions

### **Phase 2: Backend API (2-3 hours)**
- [ ] Track shipment costs endpoint
- [ ] Upload invoice endpoint
- [ ] Auto-match endpoint
- [ ] Summary endpoints
- [ ] Discrepancy endpoints

### **Phase 3: Frontend UI (4-5 hours)**
- [ ] Billing dashboard
- [ ] Invoice upload form
- [ ] Reconciliation view
- [ ] Monthly summary view
- [ ] Export functionality

### **Phase 4: Integration (1-2 hours)**
- [ ] Auto-track costs on booking
- [ ] Email notifications for discrepancies
- [ ] Monthly summary emails
- [ ] Export to accounting software

---

## ✅ SUCCESS METRICS

**Merchant Satisfaction:**
- 90%+ of invoices auto-matched
- < 5% discrepancy rate
- Merchants save 2-3 hours/month on reconciliation

**Platform Value:**
- Merchants identify $X in overcharges
- Increase merchant retention
- Competitive advantage

---

## 📝 NEXT STEPS

1. **Run migration:**
   ```sql
   \i database/CREATE_COURIER_INVOICING_TABLES.sql
   ```

2. **Update booking API:**
   - Auto-create courier_shipment_costs entry

3. **Build invoice upload UI:**
   - Simple form to start
   - PDF parsing later

4. **Test with real data:**
   - Use your PostNord account
   - Upload real invoice
   - Verify matching works

---

**Status:** ✅ **READY TO IMPLEMENT**  
**Priority:** **MEDIUM** (After core booking works)  
**Value:** **HIGH** (Competitive advantage)

---

*Created: November 3, 2025, 5:40 PM*  
*Framework: SPEC_DRIVEN_FRAMEWORK*  
*Compliance: Rule #1 (Database validation before changes)*
