# 🛒 Courier Checkout Position Analytics

**Feature:** Show couriers their ranking/position in merchant checkout flows  
**Status:** Design Phase  
**Priority:** High (Revenue-generating feature)

---

## 💡 **Concept**

When merchants integrate Performile into their e-commerce checkout, couriers are displayed in a ranked order. This feature lets couriers:
1. See their **position** in each merchant's checkout
2. Understand **why** they're ranked where they are
3. Purchase **detailed insights** to improve their position
4. Track **position changes** over time

---

## 📊 **Data Structure**

### **Database Schema:**

```sql
-- Track courier positions in merchant checkouts
CREATE TABLE courier_checkout_positions (
  position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES users(user_id),
  courier_id UUID REFERENCES couriers(courier_id),
  checkout_session_id VARCHAR(255), -- From e-commerce plugin
  position_shown INTEGER, -- 1st, 2nd, 3rd, etc.
  total_couriers_shown INTEGER,
  was_selected BOOLEAN DEFAULT FALSE,
  
  -- Ranking factors (for analytics)
  trust_score_at_time DECIMAL(5,2),
  price_at_time DECIMAL(10,2),
  delivery_time_estimate INTEGER, -- in hours
  distance_km DECIMAL(10,2),
  
  -- Context
  customer_postal_code VARCHAR(20),
  order_value DECIMAL(10,2),
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_courier_positions (courier_id, timestamp),
  INDEX idx_merchant_positions (merchant_id, timestamp),
  INDEX idx_session (checkout_session_id)
);

-- Track position changes over time
CREATE TABLE courier_position_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  merchant_id UUID REFERENCES users(user_id),
  date DATE,
  avg_position DECIMAL(5,2),
  total_appearances INTEGER,
  times_selected INTEGER,
  selection_rate DECIMAL(5,2),
  avg_trust_score DECIMAL(5,2),
  avg_price DECIMAL(10,2),
  
  -- Aggregated daily
  UNIQUE(courier_id, merchant_id, date)
);
```

---

## 🎨 **UI Design**

### **Courier Dashboard - New Section: "Checkout Performance"**

```
┌─────────────────────────────────────────────────────────┐
│ 🛒 Your Checkout Performance                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Average Position: #2.3 (↑ 0.5 from last week)      │
│  👁️  Total Appearances: 1,247                           │
│  ✅ Selection Rate: 34.2% (↑ 2.1%)                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Position Distribution (Last 30 Days)             │  │
│  │                                                   │  │
│  │  #1: ████████████████ 45%                        │  │
│  │  #2: ██████████ 30%                              │  │
│  │  #3: ████ 15%                                    │  │
│  │  #4+: ██ 10%                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  🏪 Top Merchants (by appearances)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Store Name          | Avg Pos | Appearances      │  │
│  │ Tech Haven          | #1.2    | 234 🔓          │  │
│  │ Fashion Forward     | #2.8    | 189 🔓          │  │
│  │ Home Essentials    | #3.1    | 156 🔒 Upgrade  │  │
│  │ Book Nook          | #4.2    | 98  🔒 Upgrade  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [📈 View Detailed Analytics] [💎 Upgrade Plan]         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 **Access Control & Subscription Limits**

### **Role-Based Access:**

| Role | Access Level |
|------|-------------|
| **Courier** | ✅ See own position data (limited by tier) |
| **Merchant** | ❌ Cannot see (privacy) |
| **Consumer** | ❌ Cannot see (privacy) |
| **Admin** | ✅ See all data (analytics) |

### **Subscription Tiers:**

| Feature | Tier 1 (Starter) | Tier 2 (Professional) | Tier 3 (Enterprise) |
|---------|------------------|----------------------|---------------------|
| **Data Range** | Last 7 days | Last 30 days | Last 90 days |
| **Merchants Shown** | Top 3 | Top 10 | Unlimited |
| **Position Tracking** | Daily summary | Hourly | Real-time |
| **Detailed Factors** | ❌ No | ✅ Basic | ✅ Advanced |
| **Competitor Insights** | ❌ No | ❌ No | ✅ Anonymized |
| **Export Data** | ❌ No | ✅ CSV | ✅ CSV + API |
| **Alerts** | ❌ No | ✅ Weekly | ✅ Real-time |

### **Premium Add-ons (Purchase):**

**💎 Detailed Merchant Insights** ($49/month per merchant)
- See exact ranking factors
- Understand why you're positioned where you are
- Get recommendations to improve position
- Track competitor movements (anonymized)

**📊 Historical Data** ($99 one-time)
- Access data older than subscription limit
- Download full historical reports
- Trend analysis

**🎯 Position Optimization** ($199/month)
- AI-powered recommendations
- A/B testing suggestions
- Price optimization
- Service area expansion advice

---

## 🔧 **Backend Implementation**

### **New Endpoint: `/api/courier/checkout-analytics`**

```typescript
// backend/src/routes/courier-checkout-analytics.ts

import { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /courier/checkout-analytics
 * Get courier's checkout position analytics
 */
router.get('/', 
  authenticateToken, 
  requireRole(['courier', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;
      const { timeRange = '30d', merchantId } = req.query;

      // Get courier_id from user_id
      const courierResult = await database.query(
        'SELECT courier_id FROM couriers WHERE user_id = $1',
        [userId]
      );

      if (courierResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Courier profile not found'
        });
      }

      const courierId = courierResult.rows[0].courier_id;

      // Get subscription limits
      const subscription = await database.query(
        `SELECT tier, max_merchants_analytics, data_retention_days
         FROM user_subscriptions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      const tier = subscription.rows[0]?.tier || 1;
      const maxMerchants = subscription.rows[0]?.max_merchants_analytics || 3;
      const maxDays = subscription.rows[0]?.data_retention_days || 7;

      // Calculate date range based on subscription
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const requestedDays = daysMap[timeRange as string] || 30;
      const allowedDays = Math.min(requestedDays, maxDays);

      // Get overall statistics
      const statsResult = await database.query(
        `SELECT 
           AVG(position_shown) as avg_position,
           COUNT(*) as total_appearances,
           COUNT(CASE WHEN was_selected THEN 1 END) as times_selected,
           ROUND(
             COUNT(CASE WHEN was_selected THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100, 
             1
           ) as selection_rate
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND timestamp >= NOW() - INTERVAL '${allowedDays} days'`,
        [courierId]
      );

      // Get position distribution
      const distributionResult = await database.query(
        `SELECT 
           position_shown,
           COUNT(*) as count,
           ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER() * 100, 1) as percentage
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND timestamp >= NOW() - INTERVAL '${allowedDays} days'
         GROUP BY position_shown
         ORDER BY position_shown`,
        [courierId]
      );

      // Get top merchants (limited by subscription)
      const merchantsResult = await database.query(
        `SELECT 
           m.user_id as merchant_id,
           u.first_name || ' ' || u.last_name as merchant_name,
           s.store_name,
           AVG(ccp.position_shown) as avg_position,
           COUNT(*) as appearances,
           COUNT(CASE WHEN ccp.was_selected THEN 1 END) as selections,
           ROUND(
             COUNT(CASE WHEN ccp.was_selected THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100, 
             1
           ) as selection_rate
         FROM courier_checkout_positions ccp
         JOIN users u ON ccp.merchant_id = u.user_id
         LEFT JOIN stores s ON s.owner_user_id = u.user_id
         WHERE ccp.courier_id = $1
         AND ccp.timestamp >= NOW() - INTERVAL '${allowedDays} days'
         GROUP BY m.user_id, u.first_name, u.last_name, s.store_name
         ORDER BY appearances DESC
         LIMIT $2`,
        [courierId, maxMerchants]
      );

      // Get trend data (last 7 days)
      const trendResult = await database.query(
        `SELECT 
           DATE(timestamp) as date,
           AVG(position_shown) as avg_position,
           COUNT(*) as appearances,
           COUNT(CASE WHEN was_selected THEN 1 END) as selections
         FROM courier_checkout_positions
         WHERE courier_id = $1
         AND timestamp >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(timestamp)
         ORDER BY date`,
        [courierId]
      );

      res.json({
        success: true,
        data: {
          summary: statsResult.rows[0],
          distribution: distributionResult.rows,
          topMerchants: merchantsResult.rows,
          trend: trendResult.rows,
          subscription: {
            tier,
            maxMerchants,
            maxDays: allowedDays,
            isLimited: merchantsResult.rows.length >= maxMerchants
          }
        }
      });

    } catch (error) {
      console.error('[Checkout Analytics] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch checkout analytics'
      });
    }
  }
);

/**
 * GET /courier/checkout-analytics/merchant/:merchantId
 * Get detailed analytics for a specific merchant (premium feature)
 */
router.get('/merchant/:merchantId',
  authenticateToken,
  requireRole(['courier', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const { merchantId } = req.params;

      // Check if user has purchased this merchant's insights
      const accessResult = await database.query(
        `SELECT * FROM courier_premium_access
         WHERE courier_user_id = $1
         AND merchant_id = $2
         AND access_type = 'merchant_insights'
         AND expires_at > NOW()`,
        [userId, merchantId]
      );

      if (accessResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Premium access required',
          message: 'Purchase detailed insights for this merchant',
          price: 49.00
        });
      }

      // Return detailed insights...
      // (Implementation details)

    } catch (error) {
      console.error('[Merchant Insights] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch merchant insights'
      });
    }
  }
);

export default router;
```

---

## 📱 **E-commerce Plugin Integration**

### **When Plugin Displays Couriers:**

```javascript
// Shopify/WooCommerce Plugin
async function displayCourierOptions(checkoutData) {
  const couriers = await fetchAvailableCouriers({
    postalCode: checkoutData.shipping.postalCode,
    orderValue: checkoutData.total,
    merchantId: merchantConfig.id
  });

  // Rank couriers by algorithm
  const rankedCouriers = rankCouriers(couriers, {
    trustScore: 0.4,
    price: 0.3,
    deliveryTime: 0.2,
    distance: 0.1
  });

  // Track positions for analytics
  await trackCourierPositions({
    merchantId: merchantConfig.id,
    sessionId: checkoutData.sessionId,
    couriers: rankedCouriers.map((c, index) => ({
      courierId: c.id,
      position: index + 1,
      trustScore: c.trustScore,
      price: c.price,
      deliveryTime: c.estimatedHours,
      distance: c.distanceKm
    })),
    context: {
      postalCode: checkoutData.shipping.postalCode,
      orderValue: checkoutData.total
    }
  });

  return rankedCouriers;
}
```

---

## 💰 **Monetization Strategy**

### **Subscription Tiers:**
- **Tier 1:** Basic position tracking (last 7 days, top 3 merchants)
- **Tier 2:** Advanced tracking (last 30 days, top 10 merchants)
- **Tier 3:** Full analytics (90 days, unlimited merchants, real-time)

### **Premium Add-ons:**
- **Merchant Insights:** $49/month per merchant
- **Historical Data:** $99 one-time
- **Position Optimization:** $199/month

### **Revenue Potential:**
- 1,000 couriers × $49/month (avg 2 merchants) = **$98,000/month**
- Position optimization: 100 couriers × $199/month = **$19,900/month**
- **Total potential: ~$118,000/month**

---

## 🎯 **Value Proposition for Couriers**

### **Why Couriers Will Pay:**

1. **Competitive Intelligence**
   - Know where you stand vs competitors
   - Understand ranking factors
   - Track improvements over time

2. **Revenue Optimization**
   - Improve position = more selections
   - Data-driven pricing decisions
   - Service area optimization

3. **Strategic Planning**
   - Identify high-value merchants
   - Focus on improving where it matters
   - Allocate resources effectively

4. **Performance Tracking**
   - Monitor trust score impact
   - See results of improvements
   - Justify investments

---

## 🔐 **Privacy & Security**

### **Data Protection:**
- ✅ Couriers only see their own data
- ✅ Merchant identities protected (unless purchased)
- ✅ Competitor data anonymized
- ✅ No PII exposed
- ✅ GDPR compliant

### **Access Control:**
```typescript
// Middleware to check premium access
async function checkPremiumAccess(req, res, next) {
  const { merchantId } = req.params;
  const userId = req.user.user_id;
  
  const access = await database.query(
    `SELECT * FROM courier_premium_access
     WHERE courier_user_id = $1
     AND merchant_id = $2
     AND expires_at > NOW()`,
    [userId, merchantId]
  );
  
  if (access.rows.length === 0) {
    return res.status(403).json({
      error: 'Premium access required',
      upgrade_url: `/premium/merchant/${merchantId}`
    });
  }
  
  next();
}
```

---

## 📊 **Success Metrics**

### **KPIs to Track:**
- % of couriers viewing analytics
- Avg time spent on analytics page
- Premium feature conversion rate
- Revenue per courier
- Position improvement correlation with upgrades

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation** (2 weeks)
- [ ] Create database schema
- [ ] Build tracking in e-commerce plugins
- [ ] Create basic analytics endpoint
- [ ] Build courier dashboard UI

### **Phase 2: Analytics** (2 weeks)
- [ ] Implement subscription limits
- [ ] Add trend analysis
- [ ] Create merchant comparison
- [ ] Build export functionality

### **Phase 3: Premium Features** (3 weeks)
- [ ] Merchant insights purchase flow
- [ ] Detailed ranking factors
- [ ] Position optimization AI
- [ ] Real-time alerts

### **Phase 4: Optimization** (2 weeks)
- [ ] Performance tuning
- [ ] Caching strategy
- [ ] Mobile optimization
- [ ] A/B testing

---

## ✅ **Next Steps**

1. **Validate with couriers** - Survey interest and pricing
2. **Design database schema** - Finalize structure
3. **Build MVP** - Basic position tracking
4. **Integrate with plugins** - Add tracking to checkout
5. **Launch beta** - Test with select couriers
6. **Iterate and scale** - Based on feedback

---

**This feature could be a major revenue driver and competitive advantage! 🚀**
