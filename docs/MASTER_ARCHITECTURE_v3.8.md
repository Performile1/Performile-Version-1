# 📘 PERFORMILE PLATFORM - MASTER ARCHITECTURE v3.8

**Version:** 3.8
**Date:** November 8-9, 2025
**Status:** Updated with C2C Shipping, Predictive Estimates, Review Tracking, TrustScore Logic
**Previous Version:** 3.7 (November 6, 2025)

---

## 📋 **VERSION HISTORY**

- **v3.8** (Nov 8-9, 2025) - Added C2C shipping, predictive estimates, review tracking, TrustScore in-transit logic, claims transition
- **v3.7** (Nov 6, 2025) - Courier architecture, unified dashboard, subscription tiers
- **v3.6** (Nov 5, 2025) - Initial feature roadmap
- **v3.5** (Oct 30, 2025) - Database schema updates
- **v3.0-3.4** (Oct 2025) - Foundation and core features

---

## 🎯 **WHAT'S NEW IN v3.8**

### **Major Additions:**

1. **C2C Shipping Architecture** - Prepaid model with Performile margin (20-30%)
2. **Consumer Checkout Weighted List** - Postal code-specific TrustScore and reviews
3. **Predictive Delivery Estimates** - Day-based and time-of-day predictions
4. **Review Tracking System** - Non-response scoring (75% satisfaction)
5. **Failed Deliveries Categorization** - Responsibility-based tracking
6. **TrustScore In-Transit Logic** - Fair calculation excluding in-progress orders
7. **Claims Transition Strategy** - Phased adoption with weight redistribution
8. **20 Working SQL Queries** - Complete courier metrics analysis

### **Critical Corrections:**

- ✅ **Consumer Choice:** Consumers DO see weighted list (not invisible)
- ✅ **TrustScore Calculation:** Excludes in-progress orders (100% vs 40%)
- ✅ **Review Scoring:** Non-responses count as 75% satisfaction
- ✅ **C2C Payment Model:** Performile intermediates payment, keeps margin

---

## 🏗️ **PLATFORM OVERVIEW**

### **Core Vision:**
White-label courier integration platform connecting Merchants, Couriers, and Consumers with data-driven insights and dynamic checkout.

### **Business Models:**

**B2C (Merchant Orders):**
- Merchant uses own courier accounts
- Merchant pays courier directly
- Performile integrates APIs (no payment intermediation)
- **Revenue:** Merchant subscriptions

**C2C (Consumer Shipments):** 🆕
- **Performile has courier accounts**
- Consumer pays Performile (prepaid)
- Performile pays courier
- **Performile keeps 20-30% margin**
- **Revenue:** Transaction-based margin

---

## 👥 **USER TYPES & FLOWS**

### **1. MERCHANTS** 👔

**Capabilities:**
- Select couriers and add API credentials
- View dynamic checkout with postal code-based selection
- Send leads to couriers (size, weight, price transparency)
- Handle claims and returns
- View courier performance analytics
- Make informed decisions on new markets

**Revenue Model:**
- Subscription tiers (Basic, Professional, Enterprise)
- Monthly/annual billing
- Feature gating by tier

---

### **2. COURIERS** 🚚

**Capabilities:**
- Unified dashboard (same for all, filtered by courier_id)
- View own analytics (subscription-gated)
- View anonymized competitor data (Professional+ tier)
- Receive leads from merchants
- Respond to reviews (visible to merchants)
- Track performance metrics

**Revenue Model:**
- Subscription tiers (Free, Professional, Enterprise)
- Monthly billing
- Feature gating by tier

---

### **3. CONSUMERS** 👤

**Capabilities:**
- **See weighted delivery options** at checkout 🆕
  - Courier name + service type
  - TrustScore (postal code-specific)
  - Latest reviews (from their postal code)
  - Price and estimated delivery
  - Sorted by weighted score
- Track shipments
- Create claims and returns
- **Create C2C shipments** (prepaid) 🆕
- Leave reviews
- White-label experience (B2C)

**Revenue Model:**
- Free for B2C tracking
- Pay per C2C shipment (with Performile margin)

---

### **4. ADMINS** 👨‍💼

**Capabilities:**
- Platform management
- User management
- Dispute resolution
- View all data across platform
- Monitor courier performance
- Handle escalations

---

## 🛒 **CONSUMER CHECKOUT EXPERIENCE** 🆕

### **Weighted List (NOT Invisible!):**

**When consumer enters postal code, they see:**

```
Choose Delivery Method for Postal Code 12345:

1. PostNord - Home Delivery [Recommended]
   ⭐ TrustScore: 92/100
   ⭐⭐⭐⭐⭐ 4.5 (1,234 reviews)
   "Fast and reliable! Package arrived on time."
   49 SEK | Usually delivered 14:00-17:00 tomorrow
   
2. PostNord - Parcel Locker
   ⭐ TrustScore: 92/100
   ⭐⭐⭐⭐⭐ 4.6 (856 reviews)
   "Convenient locker near my home!"
   39 SEK | Pick up 24/7 | Nearest locker: 200m
   
3. Bring - Parcel Shop
   ⭐ TrustScore: 88/100
   ⭐⭐⭐⭐ 4.3 (542 reviews)
   35 SEK | Pick up during store hours
```

### **Weighted Score Formula:**

```
Score = 
  (TrustScore × 40%) +
  (Rating × 25%) +
  (Price × 20%) +          // Inverse: lower is better
  (Delivery Time × 15%)    // Inverse: faster is better
```

### **Postal Code-Specific Data:**

**Critical:** Same courier performs differently in different postal codes!

**Example:**
- PostNord in 12345: 98% on-time, 4.5 rating
- PostNord in 11122: 85% on-time, 3.8 rating

**Consumer sees data specific to THEIR postal code**

### **Merchant Controls:**

Merchant can configure:
- Show TrustScore? (Yes/No)
- Show reviews? (Yes/No)
- Show prices? (Yes/No)
- Let consumer choose? (Yes/No)

**If merchant disables choice:**
- Auto-select best option
- Consumer sees: "Shipping: 49 SEK (1-2 days)"
- Performile IS invisible

**If merchant enables choice:**
- Show weighted list
- Consumer makes informed decision
- Performile IS visible

---

## 💰 **C2C SHIPPING ARCHITECTURE** 🆕

### **Business Model:**

**Payment Flow:**
```
Consumer creates C2C shipment
  ↓
Performile calculates price:
  - Courier base: 100 SEK
  - Performile margin: 20 SEK (20%)
  - Total: 120 SEK
  ↓
Consumer pays Performile (Stripe/Klarna) - PREPAID
  ↓
Performile creates shipment with courier (using Performile's account)
  ↓
Performile generates label with QR code
  ↓
Consumer downloads/prints label
  ↓
Package delivered
  ↓
Performile pays courier: 100 SEK
Performile keeps: 20 SEK profit
```

### **Features:**

**Label Generation:**
- PDF labels with barcodes (all couriers)
- QR codes for supported couriers:
  - PostNord ✅
  - Bring ✅
  - Budbee ✅
- Consumer can download PDF or show QR at drop-off

**Pricing:**
- Real-time quotes from multiple couriers
- Transparent pricing breakdown
- Different margins by route/courier (20-30%)

### **Database Tables:**

```sql
CREATE TABLE c2c_shipments (
  shipment_id UUID PRIMARY KEY,
  consumer_id UUID NOT NULL,
  courier_id UUID NOT NULL,
  sender_* -- address, name, etc.
  recipient_* -- address, name, etc.
  package_* -- weight, dimensions
  courier_base_price DECIMAL(10,2),
  performile_margin DECIMAL(10,2),
  total_price DECIMAL(10,2),
  payment_status VARCHAR(20),
  tracking_number VARCHAR(255),
  label_url TEXT,
  qr_code_data TEXT
);

CREATE TABLE c2c_courier_accounts (
  -- Performile's accounts with couriers
  courier_id UUID,
  customer_number VARCHAR(255),
  api_key TEXT,
  api_secret TEXT
);

CREATE TABLE c2c_pricing_rules (
  courier_id UUID,
  weight_min/max DECIMAL,
  from_country/to_country VARCHAR(2),
  base_price DECIMAL,
  performile_margin_percent DECIMAL(5,2)
);

CREATE TABLE c2c_labels (
  label_id UUID,
  shipment_id UUID,
  label_url TEXT,
  has_qr_code BOOLEAN,
  qr_code_data TEXT
);

CREATE TABLE c2c_payments (
  payment_id UUID,
  shipment_id UUID,
  amount DECIMAL,
  provider VARCHAR(50), -- stripe, klarna
  status VARCHAR(20)
);
```

### **Revenue Potential:**

```
Example:
- 1,000 C2C shipments/month
- Average margin: 20 SEK
- Monthly revenue: 20,000 SEK
- Annual revenue: 240,000 SEK

Scale:
- 10,000 shipments/month = 2.4M SEK/year
- 100,000 shipments/month = 24M SEK/year
```

---

## 📊 **TRUSTSCORE CALCULATION** 🆕 Updated

### **Components:**

```typescript
TrustScore = 
  (Review Score × 30%) +           // With non-responses at 75%
  (Completion Rate × 25%) +        // Excludes in-progress orders
  (On-Time Delivery × 20%) +       // Only delivered orders
  (First-Attempt Success × 15%) +  // Delivered first try
  (Low Claim Rate × 10%)           // Customer complaints
```

### **Critical Updates:**

**1. In-Transit Orders Logic:** 🆕

**Rules:**
- ✅ `delivered` → Count as success
- ❌ `failed`, `returned` → Count as failure
- ⏸️ `in_transit` (within ETA + 1 day grace) → Don't count yet
- ❌ `in_transit` (overdue by 2+ days) → Count as failure
- ⏸️ `pending`, `processing` → Don't count

**Example:**
```
Your data:
- 14 delivered ✅
- 8 in_transit (within ETA) ⏸️
- 5 processing ⏸️
- 8 pending ⏸️

Finalized orders: 14
Successful: 14
Failed: 0
Completion Rate: 100% ✅

NOT 40% (which wrongly includes in-progress)!
```

**Database:**
```sql
ALTER TABLE orders
ADD COLUMN is_overdue BOOLEAN DEFAULT FALSE,
ADD COLUMN days_overdue DECIMAL(4,2);

-- Daily cron job checks overdue status
```

**2. Review Score with Non-Responses:** 🆕

**Key Insight:** Non-response = 70-80% satisfaction

**Calculation:**
```
100 review requests sent:
- 5 reviews: [1★, 1★, 2★, 5★, 5★] = avg 2.8/5 = 56%
- 95 non-responses = 75% each

TrustScore: (5 × 56% + 95 × 75%) / 100 = 74%

Without non-responses: 56% (biased!)
With non-responses: 74% (realistic!)
```

**Database:**
```sql
CREATE TABLE review_requests (
  request_id UUID PRIMARY KEY,
  order_id UUID,
  courier_id UUID,
  status VARCHAR(50), -- sent, opened, clicked, responded, expired
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP, -- 7 days after delivery
  review_id UUID -- NULL if no response
);
```

**3. Claims Transition Strategy:** 🆕

**Problem:** Couriers won't use claim system immediately

**Solution:** Phased approach

**Phase 1 (Month 1-3): Redistribute Weight**
```
TrustScore without claims:
- Reviews: 35% (was 30%, +5%)
- Completion: 30% (was 25%, +5%)
- On-Time: 20%
- First-Attempt: 15%
- Claims: 0% (no data)
```

**Phase 2 (Month 4-6): Partial Adoption**
```typescript
if (courier has 20+ orders with claim tracking) {
  Use full formula (claims = 10%)
} else {
  Continue with redistributed weight
}
```

**Phase 3 (Month 7+): Full Adoption**
```
All couriers use full formula:
- Reviews: 30%
- Completion: 25%
- On-Time: 20%
- First-Attempt: 15%
- Claims: 10% ✅
```

---

## 📈 **PREDICTIVE DELIVERY ESTIMATES** 🆕

### **Day-Based Predictions:**

**Algorithm:**
1. Collect last 30 days of deliveries for postal code + courier
2. Remove statistical outliers (IQR method)
3. Apply recency weighting (recent orders matter more)
4. Calculate confidence interval (90%)
5. Display range

**Example:**
```
Data: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.8, 4.2]
After outlier removal: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.8, 4.2]
Weighted average: 2.0 days
Confidence: 1.3 - 2.7 days
Display: "1-3 days"
```

**Confidence Levels:**
- **High:** 5+ samples, low variance → "1-2 days" ✅
- **Medium:** 5+ samples, high variance → "2-4 days" ⚠️
- **Low:** <5 samples → Fall back to courier estimate

### **Time-of-Day Predictions:** 🆕

**For Home Delivery Only:**

**Algorithm:**
1. Collect delivery hour data for postal code + courier
2. Remove outliers
3. Calculate time window based on variance
4. Apply day-of-week patterns

**Example:**
```
PostNord in postal code 12345:
- 10 deliveries, all 14:00-15:00
- Display: "Usually delivered around 14:00-15:00"
- Confidence: High (10 samples, low variance)
```

**Display:**
```
Tomorrow (Nov 9)
⏰ Usually delivered between 14:00-17:00
✅ Based on 12 recent deliveries to your postal code
```

**Database:**
```sql
ALTER TABLE orders
ADD COLUMN delivery_days DECIMAL(4,2),
ADD COLUMN delivered_hour INTEGER;

CREATE TABLE delivery_estimates_cache (
  courier_id UUID,
  postal_code VARCHAR(20),
  estimate_min INTEGER,
  estimate_max INTEGER,
  sample_size INTEGER,
  confidence_level VARCHAR(20)
);

CREATE TABLE delivery_time_predictions (
  courier_id UUID,
  postal_code VARCHAR(20),
  service_type VARCHAR(50),
  day_of_week INTEGER,
  start_hour INTEGER,
  end_hour INTEGER,
  confidence_level VARCHAR(20)
);
```

---

## 🚨 **FAILED DELIVERIES CATEGORIZATION** 🆕

### **Responsibility Categories:**

**Courier Fault** (Affects TrustScore ❌):
- Lost in transit
- Damaged/destroyed
- Cancelled by courier

**Customer Fault** (Does NOT affect TrustScore ⚠️):
- Refused by customer
- Customer not home (after max attempts)
- Wrong address (customer error)

**Merchant Fault** (Does NOT affect TrustScore ℹ️):
- Cancelled by merchant
- Wrong address (merchant error)

**External Factors** (Does NOT affect TrustScore ℹ️):
- Customs hold
- Force majeure (natural disasters, strikes)

### **Database:**

```sql
ALTER TABLE orders
ADD COLUMN failure_reason VARCHAR(100),
ADD COLUMN failure_category VARCHAR(50),
ADD COLUMN responsible_party VARCHAR(50);

-- Example values:
-- failure_reason: 'lost_in_transit', 'damaged_package', 'customer_refused'
-- failure_category: 'courier_fault', 'customer_fault', 'merchant_fault', 'external_factor'
-- responsible_party: 'courier', 'customer', 'merchant', 'external'
```

### **TrustScore Impact:**

**Only courier-fault failures reduce TrustScore:**

```
Example:
- 1,000 orders
- 8 lost in transit (courier fault) ❌
- 5 customer refused (customer fault) ✅
- 2 merchant cancelled (merchant fault) ✅

Completion Rate = (1000 - 8) / 1000 = 99.2%
TrustScore Impact = -0.8 points

Customer/merchant failures don't count!
```

---

## 🗄️ **DATABASE SCHEMA UPDATES**

### **New Columns:**

```sql
-- Delivery tracking
ALTER TABLE orders
ADD COLUMN delivery_days DECIMAL(4,2),
ADD COLUMN delivered_hour INTEGER,
ADD COLUMN delivery_attempts INTEGER DEFAULT 1;

-- Failure tracking
ALTER TABLE orders
ADD COLUMN failure_reason VARCHAR(100),
ADD COLUMN failure_category VARCHAR(50),
ADD COLUMN responsible_party VARCHAR(50);

-- Overdue tracking
ALTER TABLE orders
ADD COLUMN is_overdue BOOLEAN DEFAULT FALSE,
ADD COLUMN days_overdue DECIMAL(4,2),
ADD COLUMN overdue_checked_at TIMESTAMP WITH TIME ZONE;
```

### **New Tables:**

```sql
-- Review tracking
CREATE TABLE review_requests (...);

-- C2C shipping
CREATE TABLE c2c_shipments (...);
CREATE TABLE c2c_courier_accounts (...);
CREATE TABLE c2c_pricing_rules (...);
CREATE TABLE c2c_labels (...);
CREATE TABLE c2c_payments (...);

-- Delivery predictions
CREATE TABLE delivery_estimates_cache (...);
CREATE TABLE delivery_time_predictions (...);

-- Claims adoption
CREATE TABLE claim_system_adoption (...);
```

---

## 📋 **COMPLETE FEATURE ROADMAP**

### **Phase 1 (4-6 weeks): Critical Foundations**
- Dynamic Checkout Integration
- Claims & Returns System
- Lead Generation System
- Merchant courier selection

### **Phase 2 (3-4 weeks): Engagement Features**
- Review Response System
- Advanced Analytics (product type, weight, postal code)
- Consumer Portal
- Review tracking with non-responses

### **Phase 3 (4-6 weeks): Optimization**
- Smart Recommendations (AI/ML)
- SLA Tracking
- **Predictive Delivery Estimates** 🆕
- **Time-of-day predictions** 🆕

### **Phase 4 (6-8 weeks): Advanced Features**
- **C2C Shipping** (prepaid, labels, QR codes) 🆕
- Automated Claims Detection
- Courier Capacity Management
- Multi-parcel optimization

### **Phase 5 (8-12 weeks): Ecosystem & Scale**
- API Marketplace
- Fraud Detection
- Smart Pricing Engine
- Carbon footprint tracking

**Total Timeline: 6-8 months to full platform**

---

## 🎯 **DEVELOPMENT GAPS**

### **Critical (Not Implemented):**
1. ❌ Dynamic Checkout Integration
2. ❌ Claims & Returns System
3. ❌ Lead Generation System
4. ❌ Review Response System
5. ❌ Advanced Analytics
6. ❌ C2C Shipping 🆕
7. ❌ Consumer Portal
8. ❌ Predictive Estimates 🆕
9. ❌ Review Tracking 🆕
10. ❌ Label Generation 🆕

**Platform Completion: ~25%**

---

## 📊 **CURRENT PLATFORM STATUS**

### **From Real Data (Nov 8, 2025):**

```
Total Orders: 35
- Delivered: 14 (40%)
- In Transit: 8 (23%)
- Processing: 5 (14%)
- Pending: 8 (23%)
- Failed: 0 (0%) ✅

Active Couriers: 4
- Demo Courier Service
- DHL Express
- Test Courier Service
- (1 more)

Performance:
- True Completion Rate: 100% (0 failures!)
- Average Delivery: 2.58 days
- Average Delivery Hour: 7.9 (8 AM)
- Postal Codes Served: 21

Date Range: Sept 25 - Oct 30, 2025 (~5 weeks)
```

**Platform Health: EXCELLENT** ✅
- Zero failures
- Fast delivery (2.58 days)
- Good coverage (21 postal codes)
- Active pipeline (21 in-progress orders)

---

## 💡 **KEY INSIGHTS**

### **1. Consumer Choice is Important** 🆕
**Previous assumption:** Consumers don't choose
**Reality:** Consumers see weighted list and make informed decisions
**Impact:** Better UX, more trust, higher conversion

### **2. Non-Response = Satisfaction** 🆕
**Insight:** Silent customers are satisfied customers
**Impact:** More accurate TrustScore (74% vs 56%)
**Implementation:** Track all review requests, count non-responses as 75%

### **3. In-Transit Orders Shouldn't Penalize** 🆕
**Insight:** Don't count orders still within ETA
**Impact:** Fair TrustScore (100% vs 40%)
**Implementation:** Grace period of 1 day, only count significantly overdue

### **4. Claims Need Transition Strategy** 🆕
**Challenge:** Couriers won't adopt immediately
**Solution:** Redistribute weight until 20+ orders tracked
**Impact:** Fair scoring during transition

### **5. C2C is a Revenue Opportunity** 🆕
**Model:** Performile intermediates payment, keeps margin
**Potential:** 10,000 shipments/month = 2.4M SEK/year
**Implementation:** Phase 4 (6-8 weeks from now)

---

## 📁 **DOCUMENTATION STRUCTURE**

```
docs/
├── MASTER_ARCHITECTURE_v3.8.md (this file)
├── daily/2025-11-08/
│   ├── COMPLETE_FEATURE_ROADMAP.md
│   ├── C2C_SHIPPING_ARCHITECTURE.md 🆕
│   ├── CONSUMER_CHECKOUT_EXPERIENCE.md 🆕
│   ├── PREDICTIVE_DELIVERY_ESTIMATES.md 🆕
│   ├── TIME_OF_DAY_DELIVERY_PREDICTIONS.md 🆕
│   ├── REVIEW_TRACKING_AND_TRUSTSCORE.md 🆕
│   ├── FAILED_DELIVERIES_VISIBILITY.md 🆕
│   ├── TRUSTSCORE_IN_TRANSIT_LOGIC.md 🆕
│   ├── CLAIMS_TRANSITION_STRATEGY.md 🆕
│   ├── COURIER_ARCHITECTURE_COMPLETE.md
│   ├── COURIER_DASHBOARD_UNIFIED_ARCHITECTURE.md
│   ├── COMPLETE_ARCHITECTURE_SYNTHESIS.md
│   └── COMPLETE_END_OF_DAY_PACKAGE_FINAL.md 🆕
└── database/
    ├── ADD_DELIVERY_TRACKING_COLUMNS.sql 🆕
    ├── COMPLETE_WORKING_QUERIES.sql 🆕
    └── ... (other SQL files)
```

---

## 🎯 **NEXT STEPS**

### **Tomorrow (Create v3.9):**
1. Review and refine v3.8
2. Add any missing details
3. Plan Phase 1 implementation
4. Design API endpoints
5. Create frontend mockups

### **This Week:**
1. Start Phase 1 planning
2. Dynamic checkout design
3. Claims system design
4. Database migration scripts

### **This Month:**
1. Implement Phase 1 features
2. Test with real merchants
3. Gather feedback
4. Iterate

---

## ✅ **VERSION 3.8 COMPLETE**

**Status:** ✅ COMPLETE - Ready for implementation planning

**Next Version:** v3.9 (November 9, 2025)

**All work from November 8-9, 2025 session documented and integrated.**

---

**End of Master Architecture v3.8** 🚀
