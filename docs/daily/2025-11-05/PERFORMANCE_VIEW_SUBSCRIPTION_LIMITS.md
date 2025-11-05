# PERFORMANCE VIEW - SUBSCRIPTION LIMITS

**Date:** November 5, 2025, 6:41 PM  
**Status:** ⚠️ PARTIALLY BUILT - NEEDS SUBSCRIPTION LIMITS  
**Priority:** CRITICAL - Core Feature

---

## 🎯 CURRENT STATUS

### **✅ WHAT EXISTS:**

1. **Database Table:** `checkout_courier_analytics`
   - Tracks courier displays in checkout
   - Stores postal code, city, country
   - Records trust scores, prices, delivery times
   - Has geographic indexes

2. **Frontend Component:** `GeographicHeatmap.tsx`
   - Displays performance by postal code/city
   - Filter by location
   - Sort by trust score/deliveries/on-time rate
   - Table and heatmap views

3. **Analytics Pages:**
   - `MerchantCheckoutAnalytics.tsx`
   - `CourierCheckoutAnalytics.tsx`
   - `ServiceAnalytics.tsx`

### **❌ WHAT'S MISSING:**

1. **Subscription Limits** - NOT IMPLEMENTED
2. **Country-Level View** - Exists but not limited
3. **Postal Code Filtering** - Exists but not limited
4. **Data Access Control** - No subscription checks

---

## 🚨 CRITICAL ISSUE

**Problem:** Performance data is available to ALL users regardless of subscription plan!

**Risk:**
- Free users can see unlimited data
- No incentive to upgrade
- Competitive intelligence leak
- Revenue loss

---

## 📊 SUBSCRIPTION-BASED ACCESS CONTROL

### **MERCHANT PLANS:**

#### **Starter (FREE):**
```
Performance View Access:
├── Countries: Current country only
├── Postal Codes: Last 30 days only
├── Data Points: 100 rows max
├── Export: ❌ Not available
├── Historical: ❌ Last 30 days only
└── Real-time: ✅ Yes
```

#### **Professional ($29/month):**
```
Performance View Access:
├── Countries: All Nordic countries (NO, SE, DK, FI)
├── Postal Codes: Last 90 days
├── Data Points: 1,000 rows max
├── Export: ✅ CSV export
├── Historical: ✅ Last 90 days
└── Real-time: ✅ Yes
```

#### **Enterprise ($99/month):**
```
Performance View Access:
├── Countries: ✅ All countries
├── Postal Codes: ✅ Unlimited history
├── Data Points: ✅ Unlimited
├── Export: ✅ CSV + Excel + API
├── Historical: ✅ Unlimited
└── Real-time: ✅ Yes + Advanced analytics
```

---

### **COURIER PLANS:**

#### **Basic (FREE):**
```
Performance View Access:
├── Countries: Own service area only
├── Postal Codes: Last 30 days
├── Data Points: 50 rows max
├── Export: ❌ Not available
├── Competitor Data: ❌ Not available
└── Real-time: ✅ Yes
```

#### **Pro ($19/month):**
```
Performance View Access:
├── Countries: All Nordic countries
├── Postal Codes: Last 90 days
├── Data Points: 500 rows max
├── Export: ✅ CSV export
├── Competitor Data: ✅ Aggregated only
└── Real-time: ✅ Yes
```

#### **Premium ($59/month):**
```
Performance View Access:
├── Countries: ✅ All countries
├── Postal Codes: ✅ Unlimited history
├── Data Points: ✅ Unlimited
├── Export: ✅ CSV + Excel
├── Competitor Data: ✅ Detailed
└── Real-time: ✅ Yes + Benchmarking
```

---

## 🔧 IMPLEMENTATION REQUIRED

### **1. Database Function - Check Subscription Limits**

```sql
CREATE OR REPLACE FUNCTION check_performance_view_access(
    p_user_id UUID,
    p_country_code VARCHAR(2),
    p_days_back INTEGER
)
RETURNS TABLE (
    has_access BOOLEAN,
    reason TEXT,
    max_countries INTEGER,
    max_days INTEGER,
    max_rows INTEGER
) AS $$
DECLARE
    v_plan_name VARCHAR(50);
    v_user_role VARCHAR(50);
    v_user_country VARCHAR(2);
BEGIN
    -- Get user's subscription plan and role
    SELECT 
        sp.plan_name,
        u.user_role,
        u.country
    INTO 
        v_plan_name,
        v_user_role,
        v_user_country
    FROM users u
    LEFT JOIN user_subscriptions us ON u.user_id = us.user_id
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.plan_id
    WHERE u.user_id = p_user_id;

    -- MERCHANT LIMITS
    IF v_user_role = 'merchant' THEN
        CASE v_plan_name
            WHEN 'Starter' THEN
                -- Starter: Own country only, 30 days, 100 rows
                RETURN QUERY SELECT 
                    (p_country_code = v_user_country AND p_days_back <= 30)::BOOLEAN,
                    CASE 
                        WHEN p_country_code != v_user_country THEN 'Upgrade to Professional for multi-country access'
                        WHEN p_days_back > 30 THEN 'Upgrade to Professional for 90-day history'
                        ELSE 'Access granted'
                    END,
                    1, -- max countries
                    30, -- max days
                    100; -- max rows
                    
            WHEN 'Professional' THEN
                -- Professional: Nordic countries, 90 days, 1000 rows
                RETURN QUERY SELECT 
                    (p_country_code IN ('NO', 'SE', 'DK', 'FI') AND p_days_back <= 90)::BOOLEAN,
                    CASE 
                        WHEN p_country_code NOT IN ('NO', 'SE', 'DK', 'FI') THEN 'Upgrade to Enterprise for global access'
                        WHEN p_days_back > 90 THEN 'Upgrade to Enterprise for unlimited history'
                        ELSE 'Access granted'
                    END,
                    4, -- Nordic countries
                    90, -- max days
                    1000; -- max rows
                    
            WHEN 'Enterprise' THEN
                -- Enterprise: All countries, unlimited
                RETURN QUERY SELECT 
                    TRUE,
                    'Access granted',
                    999, -- unlimited countries
                    999999, -- unlimited days
                    999999; -- unlimited rows
                    
            ELSE
                -- Default to Starter limits
                RETURN QUERY SELECT 
                    (p_country_code = v_user_country AND p_days_back <= 30)::BOOLEAN,
                    'Free plan - limited access',
                    1, 30, 100;
        END CASE;
        
    -- COURIER LIMITS
    ELSIF v_user_role = 'courier' THEN
        CASE v_plan_name
            WHEN 'Basic' THEN
                -- Basic: Own area only, 30 days, 50 rows
                RETURN QUERY SELECT 
                    (p_days_back <= 30)::BOOLEAN,
                    CASE 
                        WHEN p_days_back > 30 THEN 'Upgrade to Pro for 90-day history'
                        ELSE 'Access granted'
                    END,
                    1, 30, 50;
                    
            WHEN 'Pro' THEN
                -- Pro: Nordic countries, 90 days, 500 rows
                RETURN QUERY SELECT 
                    (p_country_code IN ('NO', 'SE', 'DK', 'FI') AND p_days_back <= 90)::BOOLEAN,
                    CASE 
                        WHEN p_country_code NOT IN ('NO', 'SE', 'DK', 'FI') THEN 'Upgrade to Premium for global access'
                        WHEN p_days_back > 90 THEN 'Upgrade to Premium for unlimited history'
                        ELSE 'Access granted'
                    END,
                    4, 90, 500;
                    
            WHEN 'Premium', 'Enterprise' THEN
                -- Premium/Enterprise: All countries, unlimited
                RETURN QUERY SELECT 
                    TRUE,
                    'Access granted',
                    999, 999999, 999999;
                    
            ELSE
                -- Default to Basic limits
                RETURN QUERY SELECT 
                    (p_days_back <= 30)::BOOLEAN,
                    'Free plan - limited access',
                    1, 30, 50;
        END CASE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **2. API Endpoint - Get Performance Data**

```typescript
// api/analytics/performance-by-location.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { country, postalCode, daysBack = 30 } = req.query;
  const userId = req.user?.id; // From JWT middleware

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check subscription limits
    const { data: accessCheck, error: accessError } = await supabase
      .rpc('check_performance_view_access', {
        p_user_id: userId,
        p_country_code: country,
        p_days_back: parseInt(daysBack as string)
      });

    if (accessError) throw accessError;

    const access = accessCheck[0];
    
    if (!access.has_access) {
      return res.status(403).json({
        error: 'Subscription limit reached',
        reason: access.reason,
        limits: {
          maxCountries: access.max_countries,
          maxDays: access.max_days,
          maxRows: access.max_rows
        },
        upgradeUrl: '/subscription-plans'
      });
    }

    // Fetch performance data with limits
    let query = supabase
      .from('checkout_courier_analytics')
      .select('*')
      .eq('merchant_id', userId)
      .gte('event_timestamp', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .limit(access.max_rows);

    if (country) {
      query = query.eq('delivery_country', country);
    }

    if (postalCode) {
      query = query.eq('delivery_postal_code', postalCode);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      data,
      limits: {
        maxCountries: access.max_countries,
        maxDays: access.max_days,
        maxRows: access.max_rows,
        currentRows: data.length
      },
      subscription: {
        hasAccess: true,
        reason: access.reason
      }
    });

  } catch (error) {
    console.error('Performance data error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

### **3. Frontend Component - With Subscription Limits**

```typescript
// apps/web/src/components/analytics/PerformanceViewWithLimits.tsx

import React, { useState, useEffect } from 'react';
import { Alert, Button, Chip } from '@mui/material';
import { Lock, Upgrade } from '@mui/icons-material';
import { GeographicHeatmap } from '../service-performance/GeographicHeatmap';
import { useAuth } from '../../hooks/useAuth';

export const PerformanceViewWithLimits: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [limits, setLimits] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const fetchPerformanceData = async (country: string, daysBack: number) => {
    try {
      const response = await fetch(
        `/api/analytics/performance-by-location?country=${country}&daysBack=${daysBack}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (response.status === 403) {
        const error = await response.json();
        setAccessDenied(true);
        setUpgradeMessage(error.reason);
        setLimits(error.limits);
        return;
      }

      const result = await response.json();
      setData(result.data);
      setLimits(result.limits);
      setAccessDenied(false);

    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    }
  };

  return (
    <Box>
      {/* Subscription Limits Display */}
      {limits && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">
              Your plan limits:
            </Typography>
            <Chip 
              label={`${limits.maxCountries} ${limits.maxCountries === 1 ? 'country' : 'countries'}`} 
              size="small" 
            />
            <Chip 
              label={`${limits.maxDays} days history`} 
              size="small" 
            />
            <Chip 
              label={`${limits.maxRows} rows max`} 
              size="small" 
            />
          </Box>
        </Alert>
      )}

      {/* Access Denied Message */}
      {accessDenied && (
        <Alert 
          severity="warning" 
          action={
            <Button 
              color="inherit" 
              size="small"
              startIcon={<Upgrade />}
              href="/subscription-plans"
            >
              Upgrade
            </Button>
          }
        >
          <Lock sx={{ mr: 1 }} />
          {upgradeMessage}
        </Alert>
      )}

      {/* Performance Data */}
      {!accessDenied && data.length > 0 && (
        <GeographicHeatmap 
          data={data}
          courierName={user.courierName}
        />
      )}

      {/* Upgrade Prompt */}
      {limits && limits.currentRows >= limits.maxRows && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Showing {limits.currentRows} of {limits.maxRows} rows. 
          <Button href="/subscription-plans" size="small">
            Upgrade for more data
          </Button>
        </Alert>
      )}
    </Box>
  );
};
```

---

## 📊 SUBSCRIPTION LIMITS SUMMARY

| Feature | Starter/Basic | Professional/Pro | Enterprise/Premium |
|---------|---------------|------------------|-------------------|
| **Countries** | 1 (own) | 4 (Nordic) | Unlimited |
| **History** | 30 days | 90 days | Unlimited |
| **Data Rows** | 100/50 | 1,000/500 | Unlimited |
| **Export** | ❌ | CSV | CSV + Excel + API |
| **Competitor Data** | ❌ | Aggregated | Detailed |
| **Real-time** | ✅ | ✅ | ✅ + Advanced |

---

## 🎯 IMPLEMENTATION CHECKLIST

### **Week 2 Day 4-5 (CRITICAL):**
- [ ] Create `check_performance_view_access()` function
- [ ] Update API endpoint with subscription checks
- [ ] Add subscription limits to frontend
- [ ] Add upgrade prompts
- [ ] Test all subscription tiers
- [ ] Document limits in user guide

**Time Estimate:** 3 hours

---

## 💰 REVENUE IMPACT

### **Current (No Limits):**
- Free users: Unlimited data
- Upgrade incentive: Low
- Revenue: $0 from this feature

### **With Limits:**
- Free users: Limited to 30 days, 1 country
- Upgrade incentive: High
- Expected conversions: 20-30%
- Additional revenue: $500-1,000/month

**Example:**
- 100 free merchants
- 25% upgrade to Professional ($29/month)
- Revenue: 25 × $29 = $725/month

---

## 🚨 PRIORITY RECOMMENDATION

**Status:** 🔴 **CRITICAL - IMPLEMENT IMMEDIATELY**

**Why Critical:**
1. **Revenue Loss:** Free users getting premium features
2. **Competitive Risk:** Unlimited data access
3. **No Upgrade Path:** No incentive to pay
4. **Business Model:** Core monetization feature

**When:** Week 2 Day 4 (Tomorrow)  
**Time:** 3 hours  
**Impact:** HIGH - Enables subscription revenue

---

## ✅ SUMMARY

### **Current Status:**
- ✅ Database table exists
- ✅ Frontend component exists
- ❌ Subscription limits NOT implemented
- ❌ Access control missing

### **Required Work:**
1. Database function (1 hour)
2. API endpoint update (1 hour)
3. Frontend limits UI (1 hour)
4. Testing (30 min)

**Total:** 3.5 hours

### **Priority:**
🔴 **CRITICAL** - Add to Week 2 Day 4 tomorrow!

---

**Status:** ⚠️ PARTIALLY BUILT - NEEDS LIMITS  
**Next:** Implement subscription limits tomorrow  
**Impact:** Enables subscription revenue from analytics feature
