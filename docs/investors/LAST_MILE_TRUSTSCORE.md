# PERFORMILE LAST-MILE TRUSTSCORE™ & DYNAMIC RANKING SYSTEM

**Document Version:** 1.0  
**Date:** November 5, 2025  
**Status:** Production Ready  
**Patent Status:** Patent-Pending

---

## 📋 EXECUTIVE SUMMARY

Performile's **TrustScore™** and **Dynamic Ranking** system represents a breakthrough in last-mile delivery optimization. By combining real-time performance data, customer feedback, and geographic-specific analytics, we create a self-optimizing marketplace that automatically surfaces the best courier for each delivery scenario.

**Key Innovation:** The only platform that uses data-driven courier ratings combined with checkout behavior analytics to create a self-improving delivery ecosystem.

---

## 🎯 TRUSTSCORE™ SYSTEM

### **What is TrustScore?**

TrustScore is a proprietary 0-100 rating system that quantifies courier reliability and performance. Unlike simple star ratings, TrustScore combines multiple weighted factors to provide an objective, data-driven assessment of courier quality.

### **TrustScore Formula**

```
TrustScore = (Rating × 20) × 0.40 + (Completion Rate) × 0.30 + (On-Time Rate) × 0.30
```

**Component Breakdown:**

1. **Customer Rating (40% weight)**
   - Source: Verified customer reviews
   - Scale: 1-5 stars → converted to 0-100 (rating × 20)
   - Minimum reviews required: 5 (statistical significance)
   - Recency weighting: Last 90 days weighted 2x

2. **Completion Rate (30% weight)**
   - Formula: (Delivered Orders / Total Orders) × 100
   - Excludes customer-initiated cancellations
   - Includes: Successful deliveries only
   - Minimum orders required: 10

3. **On-Time Rate (30% weight)**
   - Formula: (On-Time Deliveries / Delivered Orders) × 100
   - On-time definition: Within estimated delivery window
   - Accounts for courier's own ETA updates
   - Weather/force majeure exceptions applied

### **TrustScore Tiers**

| Score Range | Tier | Badge | Description |
|-------------|------|-------|-------------|
| 90-100 | Elite | 🏆 Gold | Exceptional performance, top 5% |
| 80-89 | Excellent | 🥇 Silver | Consistently reliable, top 20% |
| 70-79 | Good | 🥉 Bronze | Solid performance, above average |
| 60-69 | Average | ⭐ Standard | Meets basic expectations |
| 50-59 | Below Average | ⚠️ Caution | Inconsistent performance |
| 0-49 | Poor | ❌ Warning | Significant issues, avoid |

### **Real-World Example**

**PostNord Norway:**
- Customer Rating: 4.2/5 → 84/100 (40% weight = 33.6)
- Completion Rate: 94% (30% weight = 28.2)
- On-Time Rate: 87% (30% weight = 26.1)
- **Final TrustScore: 87.9/100** → Excellent Tier 🥇

### **TrustScore Updates**

- **Real-time:** Updates immediately after each review
- **Recalculation:** Triggered by new orders, reviews, or delivery confirmations
- **Geographic:** Separate scores per postal code area (optional)
- **Historical:** 30-day, 90-day, and all-time scores tracked

---

## 🚀 DYNAMIC RANKING SYSTEM

### **What is Dynamic Ranking?**

Dynamic Ranking is a self-optimizing algorithm that automatically adjusts courier positioning in checkout based on three key factors: **Performance**, **Conversion**, and **Activity**. The best-performing couriers automatically rise to the top, creating a meritocratic marketplace.

### **Ranking Formula**

```
Ranking Score = (Performance × 0.50) + (Conversion × 0.30) + (Activity × 0.20)
```

**Component Breakdown:**

#### **1. Performance Score (50% weight)**

Combines multiple performance metrics:

```
Performance = (TrustScore × 0.40) + (On-Time Rate × 0.30) + 
              (Completion Rate × 0.20) + (Delivery Speed × 0.10)
```

- **TrustScore (40%):** Overall quality rating (0-100)
- **On-Time Rate (30%):** Percentage of on-time deliveries
- **Completion Rate (20%):** Percentage of successful deliveries
- **Delivery Speed (10%):** Average days vs. promised (inverted)

**Example Calculation:**
- TrustScore: 87.9 × 0.40 = 35.16
- On-Time: 87% × 0.30 = 26.10
- Completion: 94% × 0.20 = 18.80
- Speed: 2.1 days (vs 3 promised) → 90 × 0.10 = 9.00
- **Performance Score: 89.06/100**

#### **2. Conversion Score (30% weight)**

Measures checkout behavior and customer preference:

```
Conversion = (Selection Rate × 0.50) + (Position Performance × 0.30) + 
             (Conversion Trend × 0.20)
```

- **Selection Rate (50%):** % of times selected when displayed
- **Position Performance (30%):** Conversion rate by display position
- **Conversion Trend (20%):** 7-day vs 30-day trend (improving/declining)

**Example Calculation:**
- Selection Rate: 35% (selected 350 times out of 1000 displays)
- Position Performance: 45% (converts well even in position 2-3)
- Conversion Trend: +12% (improving) → 112/100 = 112 (capped at 100)
- **Conversion Score: 56.5/100**

#### **3. Activity Score (20% weight)**

Rewards recent activity and consistent availability:

```
Activity = (Recent Performance × 0.60) + (Activity Level × 0.40)
```

- **Recent Performance (60%):** Last 7 days vs last 30 days
- **Activity Level (40%):** Orders processed in last 30 days (normalized)

**Example Calculation:**
- Recent Performance: 89/100 (last 7 days) vs 87/100 (last 30 days) → 102% → 100
- Activity Level: 250 orders/month → 100/100 (high activity)
- **Activity Score: 100/100**

#### **Final Ranking Score**

```
Ranking = (89.06 × 0.50) + (56.5 × 0.30) + (100 × 0.20)
        = 44.53 + 16.95 + 20.00
        = 81.48/100
```

### **Geographic Specificity**

Rankings are calculated **per postal code area** to account for regional performance variations:

- **Oslo (0150):** PostNord ranks #1 (TrustScore 89, fast delivery)
- **Bergen (5003):** Bring ranks #1 (TrustScore 91, better local coverage)
- **Trondheim (7030):** Porterbuddy ranks #1 (TrustScore 87, same-day delivery)

### **Self-Optimization**

The system creates a **feedback loop**:

1. **Display:** Couriers shown in ranked order
2. **Selection:** Customers choose preferred courier
3. **Performance:** Delivery completed and reviewed
4. **Update:** Rankings adjust based on performance + selection data
5. **Repeat:** Better couriers rise, poor couriers fall

**Result:** The marketplace automatically optimizes for customer satisfaction and delivery success.

---

## 📊 CURRENT TREND ANALYTICS

### **✅ Trends We HAVE**

Based on database analysis, we currently track:

#### **1. Order Trends (Platform-Wide)**
- **Table:** `platform_analytics`
- **Metrics:** Total orders, delivered, in-transit, pending, cancelled
- **Granularity:** Daily snapshots
- **Geographic:** No (platform-wide only)
- **Status:** ✅ Active

#### **2. Courier Performance Trends**
- **Table:** `courier_analytics`
- **Metrics:** TrustScore, completion rate, on-time rate, avg delivery days
- **Granularity:** Per courier, updated real-time
- **Geographic:** No (courier-wide only)
- **Status:** ✅ Active

#### **3. Shop Analytics Snapshots**
- **Table:** `shopanalyticssnapshots`
- **Metrics:** Total orders, completed, cancelled, pending, revenue, AOV
- **Granularity:** Daily/weekly/monthly snapshots per shop
- **Geographic:** No (shop-wide only)
- **Status:** ✅ Active

#### **4. Checkout Analytics**
- **Table:** `checkout_courier_analytics`
- **Metrics:** Display count, selection count, position, conversion rate
- **Granularity:** Per event, per courier, per merchant
- **Geographic:** ✅ Yes (postal_code tracked)
- **Status:** ✅ Active

#### **5. Claims Trends**
- **Function:** `get_claims_trends()`
- **Metrics:** Claims by status, resolution time, claim rate
- **Granularity:** Per merchant or courier, date range
- **Geographic:** No
- **Status:** ✅ Active

---

## ❌ MISSING TRENDS (High Value)

### **1. Merchant Logistics Cost Trends**

**What's Missing:**
- Cost per delivery by postal code
- Cost per delivery by courier
- Cost trends over time (daily/weekly/monthly)
- Cost comparison: actual vs. estimated
- Cost breakdown: base fee + fuel surcharge + extras

**Why It Matters:**
- Merchants need to optimize delivery costs (30-50% of logistics spend)
- Identify which couriers are most cost-effective per region
- Spot cost increases early (fuel surcharges, seasonal pricing)
- Negotiate better rates with data

**Implementation Required:**
```sql
CREATE TABLE merchant_logistics_cost_trends (
  trend_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Cost metrics
  total_cost DECIMAL(10,2),
  base_cost DECIMAL(10,2),
  fuel_surcharge DECIMAL(10,2),
  extra_fees DECIMAL(10,2),
  
  -- Volume metrics
  order_count INTEGER,
  avg_cost_per_order DECIMAL(10,2),
  
  -- Time period
  period_start DATE,
  period_end DATE,
  period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Value Add:**
- **For Merchants:** Reduce logistics costs by 15-25%
- **For Platform:** Upsell analytics features
- **For Couriers:** Transparent pricing insights

---

### **2. Merchant Income vs. Logistics Cost Ratio**

**What's Missing:**
- Revenue per order vs. delivery cost
- Profit margin after logistics
- Break-even analysis per postal code
- ROI on delivery options (standard vs. express)

**Why It Matters:**
- Merchants need to know if delivery costs are eating profits
- Identify unprofitable delivery zones
- Optimize pricing strategy per region
- Make data-driven decisions on free shipping thresholds

**Implementation Required:**
```sql
CREATE TABLE merchant_profitability_trends (
  trend_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id),
  postal_code VARCHAR(20),
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2),
  order_count INTEGER,
  avg_order_value DECIMAL(10,2),
  
  -- Cost metrics
  total_logistics_cost DECIMAL(10,2),
  avg_cost_per_order DECIMAL(10,2),
  
  -- Profitability metrics
  gross_profit DECIMAL(12,2),
  profit_margin_pct DECIMAL(5,2),
  logistics_cost_pct DECIMAL(5,2), -- % of revenue
  
  -- Period
  period_start DATE,
  period_end DATE,
  period_type VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Value Add:**
- **For Merchants:** Increase profit margins by 10-20%
- **For Platform:** Premium analytics feature ($49/month)
- **For Investors:** Clear ROI demonstration

---

### **3. Courier Logistics Cost Trends**

**What's Missing:**
- Courier's cost per delivery by postal code
- Fuel costs, labor costs, vehicle costs
- Cost efficiency trends over time
- Profitability per route/region

**Why It Matters:**
- Couriers need to optimize routes and pricing
- Identify unprofitable delivery zones
- Justify price increases with data
- Improve operational efficiency

**Implementation Required:**
```sql
CREATE TABLE courier_cost_trends (
  trend_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  postal_code VARCHAR(20),
  
  -- Cost breakdown
  fuel_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  vehicle_cost DECIMAL(10,2),
  overhead_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  -- Volume metrics
  delivery_count INTEGER,
  avg_cost_per_delivery DECIMAL(10,2),
  
  -- Efficiency metrics
  deliveries_per_hour DECIMAL(5,2),
  km_per_delivery DECIMAL(5,2),
  
  -- Period
  period_start DATE,
  period_end DATE,
  period_type VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Value Add:**
- **For Couriers:** Reduce operational costs by 20-30%
- **For Platform:** Attract more couriers with insights
- **For Merchants:** Understand courier pricing better

---

### **4. Courier Income vs. Logistics Cost**

**What's Missing:**
- Revenue per delivery vs. cost per delivery
- Profit margin per route
- Break-even analysis per postal code
- ROI on different service levels

**Implementation Required:**
```sql
CREATE TABLE courier_profitability_trends (
  trend_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  postal_code VARCHAR(20),
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2),
  delivery_count INTEGER,
  avg_revenue_per_delivery DECIMAL(10,2),
  
  -- Cost metrics
  total_cost DECIMAL(12,2),
  avg_cost_per_delivery DECIMAL(10,2),
  
  -- Profitability
  gross_profit DECIMAL(12,2),
  profit_margin_pct DECIMAL(5,2),
  
  -- Period
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Value Add:**
- **For Couriers:** Optimize pricing and routes
- **For Platform:** Premium courier analytics
- **For Merchants:** Understand courier economics

---

### **5. Order Sales Trends by Postal Code & Market**

**What's Missing:**
- Order volume by postal code over time
- Order value by postal code over time
- Market share by postal code (which merchants dominate)
- Seasonal trends per region
- Growth rates per postal code

**Implementation Required:**
```sql
CREATE TABLE order_sales_trends (
  trend_id UUID PRIMARY KEY,
  postal_code VARCHAR(20),
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Volume metrics
  order_count INTEGER,
  unique_customers INTEGER,
  unique_merchants INTEGER,
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2),
  avg_order_value DECIMAL(10,2),
  
  -- Growth metrics
  order_count_prev_period INTEGER,
  growth_rate_pct DECIMAL(5,2),
  
  -- Market metrics
  top_merchant_id UUID,
  top_merchant_share_pct DECIMAL(5,2),
  
  -- Period
  period_start DATE,
  period_end DATE,
  period_type VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Value Add:**
- **For Merchants:** Identify growth opportunities
- **For Couriers:** Expand to high-volume areas
- **For Platform:** Market intelligence for expansion

---

### **6. Return Trends for Merchants & Couriers**

**What's Missing:**
- Return rate by merchant
- Return rate by courier
- Return rate by postal code
- Return reasons (damaged, wrong item, customer changed mind)
- Return cost analysis
- Return processing time

**Why It Matters:**
- Returns cost 15-30% of order value
- High return rates indicate quality or delivery issues
- Couriers with high damage rates need improvement
- Merchants need to optimize packaging/descriptions

**Implementation Required:**
```sql
CREATE TABLE return_trends (
  trend_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id),
  courier_id UUID REFERENCES couriers(courier_id),
  postal_code VARCHAR(20),
  
  -- Return metrics
  total_orders INTEGER,
  returned_orders INTEGER,
  return_rate_pct DECIMAL(5,2),
  
  -- Return reasons
  damaged_count INTEGER,
  wrong_item_count INTEGER,
  customer_regret_count INTEGER,
  other_count INTEGER,
  
  -- Cost metrics
  total_return_cost DECIMAL(10,2),
  avg_return_cost DECIMAL(10,2),
  
  -- Processing metrics
  avg_processing_days DECIMAL(5,2),
  
  -- Period
  period_start DATE,
  period_end DATE,
  period_type VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Value Add:**
- **For Merchants:** Reduce return rates by 20-40%
- **For Couriers:** Improve handling to reduce damage
- **For Platform:** Premium feature ($29/month add-on)

---

## 💡 ADDITIONAL VALUE-ADD SUGGESTIONS

### **7. Delivery Time Accuracy Trends**

**What:** Track how accurate courier ETA predictions are

**Why:** Customers hate uncertainty. Accurate ETAs = higher satisfaction.

**Metrics:**
- Promised delivery time vs. actual delivery time
- ETA accuracy percentage
- Early deliveries vs. late deliveries
- Average deviation (hours/days)

**Value:**
- Merchants can set realistic customer expectations
- Couriers can improve ETA algorithms
- Platform can penalize inaccurate couriers

---

### **8. Customer Satisfaction Trends**

**What:** Track customer satisfaction beyond just ratings

**Why:** Ratings lag; real-time satisfaction predicts churn.

**Metrics:**
- NPS (Net Promoter Score) by courier
- Customer complaints per 100 deliveries
- Repeat customer rate per courier
- Customer lifetime value by courier choice

**Value:**
- Identify at-risk customers early
- Reward couriers who create loyal customers
- Optimize for long-term value, not just ratings

---

### **9. Peak Hour/Day Performance**

**What:** Track courier performance during high-demand periods

**Why:** Some couriers excel during rush, others fail.

**Metrics:**
- Performance during peak hours (12-2pm, 5-7pm)
- Performance during peak days (Black Friday, holidays)
- Capacity utilization during peaks
- Price surge vs. performance correlation

**Value:**
- Merchants can choose reliable couriers for peak times
- Couriers can optimize staffing
- Platform can manage capacity better

---

### **10. Environmental Impact Trends**

**What:** Track carbon footprint per delivery

**Why:** Sustainability is increasingly important to customers.

**Metrics:**
- CO2 emissions per delivery
- Electric vehicle usage percentage
- Route optimization efficiency
- Carbon offset purchases

**Value:**
- Merchants can market "green delivery"
- Couriers can differentiate on sustainability
- Platform can charge premium for eco-friendly options

---

### **11. Delivery Attempt Trends**

**What:** Track how many attempts needed per delivery

**Why:** Multiple attempts = higher costs and delays.

**Metrics:**
- First-attempt success rate
- Average attempts per delivery
- Failed delivery reasons (not home, wrong address, etc.)
- Re-delivery costs

**Value:**
- Identify problematic addresses/customers
- Optimize delivery windows
- Reduce costs for merchants and couriers

---

### **12. Packaging Quality Trends**

**What:** Track damage rates by merchant packaging

**Why:** Poor packaging = damaged goods = returns.

**Metrics:**
- Damage rate by merchant
- Damage rate by package type
- Damage cost per merchant
- Packaging improvement recommendations

**Value:**
- Merchants reduce damage by 50-70%
- Couriers have fewer complaints
- Platform can offer packaging consulting

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1 (MVP - Week 3-4)** - Essential for Launch
1. ✅ TrustScore System (DONE)
2. ✅ Dynamic Ranking (DONE)
3. ✅ Checkout Analytics (DONE)
4. ✅ Basic Order Trends (DONE)

### **Phase 2 (Month 1-3)** - High ROI Features
1. ❌ Merchant Logistics Cost Trends
2. ❌ Merchant Income vs. Cost Ratio
3. ❌ Order Sales Trends by Postal Code
4. ❌ Return Trends

**Investment:** $8,000  
**Timeline:** 6 weeks  
**ROI:** 300% (premium feature revenue)

### **Phase 3 (Month 4-6)** - Competitive Differentiation
1. ❌ Courier Cost Trends
2. ❌ Courier Profitability Analysis
3. ❌ Delivery Time Accuracy
4. ❌ Customer Satisfaction Trends

**Investment:** $12,000  
**Timeline:** 8 weeks  
**ROI:** 250% (platform differentiation)

### **Phase 4 (Month 7-12)** - Advanced Analytics
1. ❌ Peak Hour Performance
2. ❌ Environmental Impact
3. ❌ Delivery Attempt Trends
4. ❌ Packaging Quality

**Investment:** $15,000  
**Timeline:** 10 weeks  
**ROI:** 200% (premium tier upsells)

---

## 💰 MONETIZATION STRATEGY

### **Free Tier**
- Basic TrustScore display
- Simple courier rankings
- Last 30 days order trends

### **Pro Tier ($29/month)**
- Advanced TrustScore breakdown
- Geographic-specific rankings
- Logistics cost trends
- 90-day historical data

### **Enterprise Tier ($99/month)**
- Full profitability analysis
- Custom trend reports
- API access to all analytics
- Unlimited historical data
- White-label reports

### **Add-Ons**
- Return Analytics: $19/month
- Environmental Dashboard: $15/month
- Predictive Analytics: $39/month

**Revenue Potential:**
- 50 merchants × $29 = $1,450/month (Pro)
- 10 merchants × $99 = $990/month (Enterprise)
- 20 merchants × $19 = $380/month (Add-ons)
- **Total: $2,820/month = $33,840/year**

---

## 📈 COMPETITIVE ADVANTAGE

### **vs. ShipStation**
- ❌ No TrustScore system
- ❌ No dynamic ranking
- ❌ No profitability analytics
- ✅ We have all of these

### **vs. Shippo**
- ❌ No courier ratings
- ❌ No geographic analytics
- ❌ No cost trend analysis
- ✅ We have all of these

### **vs. Easyship**
- ❌ No self-optimizing marketplace
- ❌ No checkout behavior analytics
- ❌ No return trend analysis
- ✅ We have all of these

**Result:** Performile is the **only platform** with comprehensive, data-driven delivery optimization.

---

## 🏆 SUCCESS METRICS

### **TrustScore Adoption**
- **Target:** 90% of couriers have TrustScore by Month 3
- **Current:** 100% (12/12 couriers have scores)
- **Status:** ✅ Exceeded

### **Dynamic Ranking Impact**
- **Target:** 20% improvement in on-time delivery rate
- **Current:** Testing in progress
- **Expected:** 25-30% improvement

### **Merchant Cost Savings**
- **Target:** 15% reduction in logistics costs
- **Method:** Optimize courier selection by postal code
- **Timeline:** Month 6

### **Courier Performance Improvement**
- **Target:** 10% increase in average TrustScore
- **Method:** Feedback loop drives quality improvements
- **Timeline:** Month 12

---

## 📞 CONTACT & NEXT STEPS

**For Investors:**
- This document demonstrates our unique technology moat
- TrustScore + Dynamic Ranking = sustainable competitive advantage
- Clear monetization path with premium analytics

**For Merchants:**
- Request demo: [demo@performile.com]
- See TrustScore in action
- Get free cost analysis report

**For Couriers:**
- Improve your TrustScore: [courier@performile.com]
- Access performance dashboard
- Optimize your routes with our data

---

**Document Status:** Complete  
**Last Updated:** November 5, 2025  
**Next Review:** December 9, 2025 (post-launch)  
**Patent Application:** In progress (TrustScore algorithm + Dynamic Ranking)

---

*Performile: Delivering happiness, not headaches.* 🚀
