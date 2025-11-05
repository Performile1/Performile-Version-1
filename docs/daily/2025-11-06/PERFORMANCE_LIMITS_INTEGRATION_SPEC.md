# PERFORMANCE LIMITS INTEGRATION SPECIFICATION

**Date:** November 6, 2025  
**Priority:** P0 - CRITICAL (Revenue Protection)  
**Estimated Time:** 2 hours  
**Status:** Ready for Implementation

---

## 🎯 OBJECTIVE

Integrate subscription-based performance limits into the analytics API and frontend to protect premium features and drive subscription upgrades.

---

## 📋 DATABASE VALIDATION (COMPLETED)

**Validated Components:**
- ✅ `check_performance_view_access()` function exists
- ✅ Function tested and working correctly
- ✅ `checkout_courier_analytics` table has data
- ✅ `users` table has `country` column
- ✅ `subscription_plans` table validated
- ✅ `user_subscriptions` table validated

**Test Result:**
```json
{
  "has_access": true,
  "reason": "Access granted",
  "max_countries": 4,
  "max_days": 30,
  "max_rows": 100
}
```

---

## 🏗️ ARCHITECTURE

### **Current State:**
```
Frontend → API → Database → Returns ALL data (no limits)
```

### **Target State:**
```
Frontend → API → check_performance_view_access() → Apply limits → Return filtered data
                     ↓
              Show upgrade prompt if denied
```

---

## 🔧 IMPLEMENTATION PLAN

### **Part 1: Backend API Integration (1 hour)**

**File:** `api/analytics/performance-by-location.ts` (NEW FILE)

**Create new endpoint:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  try {
    // Validate request
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user from JWT
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get query parameters
    const { country, daysBack = '30' } = req.query;
    
    if (!country) {
      return res.status(400).json({ error: 'Country parameter required' });
    }

    // Check subscription limits
    const { data: accessCheck, error: accessError } = await supabase
      .rpc('check_performance_view_access', {
        p_user_id: user.id,
        p_country_code: country as string,
        p_days_back: parseInt(daysBack as string)
      });

    if (accessError) {
      console.error('Access check error:', accessError);
      return res.status(500).json({ error: 'Failed to check access' });
    }

    const access = accessCheck[0];

    // If access denied, return 403 with upgrade info
    if (!access.has_access) {
      return res.status(403).json({
        error: 'Subscription limit reached',
        reason: access.reason,
        limits: {
          maxCountries: access.max_countries,
          maxDays: access.max_days,
          maxRows: access.max_rows
        },
        upgradeUrl: '/subscription-plans',
        currentPlan: 'Starter' // TODO: Get from user's subscription
      });
    }

    // Fetch performance data with limits
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(daysBack as string));

    const { data: performanceData, error: dataError } = await supabase
      .from('checkout_courier_analytics')
      .select(`
        courier_code,
        courier_name,
        delivery_postal_code,
        delivery_city,
        delivery_country,
        displayed_at,
        was_selected
      `)
      .eq('delivery_country', country)
      .gte('displayed_at', startDate.toISOString())
      .order('displayed_at', { ascending: false })
      .limit(access.max_rows);

    if (dataError) {
      console.error('Data fetch error:', dataError);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Aggregate by postal code
    const aggregated = aggregateByPostalCode(performanceData);

    // Return data with limits info
    return res.status(200).json({
      data: aggregated,
      limits: {
        maxCountries: access.max_countries,
        maxDays: access.max_days,
        maxRows: access.max_rows,
        appliedLimits: {
          country: country,
          daysBack: parseInt(daysBack as string),
          rowsReturned: aggregated.length
        }
      },
      subscription: {
        hasAccess: true,
        reason: access.reason
      }
    });

  } catch (error) {
    console.error('Performance API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to aggregate data
function aggregateByPostalCode(data: any[]) {
  const grouped = data.reduce((acc, row) => {
    const key = `${row.delivery_postal_code}-${row.courier_code}`;
    if (!acc[key]) {
      acc[key] = {
        courierCode: row.courier_code,
        courierName: row.courier_name,
        postalCode: row.delivery_postal_code,
        city: row.delivery_city,
        country: row.delivery_country,
        displayCount: 0,
        selectionCount: 0
      };
    }
    acc[key].displayCount++;
    if (row.was_selected) {
      acc[key].selectionCount++;
    }
    return acc;
  }, {});

  return Object.values(grouped).map((item: any) => ({
    ...item,
    selectionRate: item.displayCount > 0 
      ? (item.selectionCount / item.displayCount * 100).toFixed(1) 
      : '0.0'
  }));
}
```

**API Route:** `/api/analytics/performance-by-location`

**Query Parameters:**
- `country` (required): ISO country code (e.g., 'NO', 'SE')
- `daysBack` (optional): Number of days (default: 30)

**Response (Success):**
```json
{
  "data": [
    {
      "courierCode": "postnord",
      "courierName": "PostNord",
      "postalCode": "0150",
      "city": "Oslo",
      "country": "NO",
      "displayCount": 45,
      "selectionCount": 32,
      "selectionRate": "71.1"
    }
  ],
  "limits": {
    "maxCountries": 4,
    "maxDays": 30,
    "maxRows": 100,
    "appliedLimits": {
      "country": "NO",
      "daysBack": 30,
      "rowsReturned": 25
    }
  },
  "subscription": {
    "hasAccess": true,
    "reason": "Access granted"
  }
}
```

**Response (Access Denied):**
```json
{
  "error": "Subscription limit reached",
  "reason": "Upgrade to Professional for multi-country access",
  "limits": {
    "maxCountries": 4,
    "maxDays": 30,
    "maxRows": 100
  },
  "upgradeUrl": "/subscription-plans",
  "currentPlan": "Starter"
}
```

---

### **Part 2: Frontend Integration (1 hour)**

**File:** `apps/web/src/components/service-performance/PerformanceByLocation.tsx` (NEW FILE)

**Create new component:**
```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { GeographicHeatmap } from './GeographicHeatmap';

interface PerformanceData {
  courierCode: string;
  courierName: string;
  postalCode: string;
  city: string;
  country: string;
  displayCount: number;
  selectionCount: number;
  selectionRate: string;
}

interface Limits {
  maxCountries: number;
  maxDays: number;
  maxRows: number;
  appliedLimits?: {
    country: string;
    daysBack: number;
    rowsReturned: number;
  };
}

export const PerformanceByLocation: React.FC = () => {
  const { user } = useAuth();
  const [country, setCountry] = useState('NO');
  const [daysBack, setDaysBack] = useState(30);
  const [data, setData] = useState<PerformanceData[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const countries = [
    { code: 'NO', name: 'Norway' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      const response = await fetch(
        `/api/analytics/performance-by-location?country=${country}&daysBack=${daysBack}`,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        }
      );

      if (response.status === 403) {
        // Access denied - show upgrade prompt
        const errorData = await response.json();
        setAccessDenied(true);
        setUpgradeMessage(errorData.reason);
        setLimits(errorData.limits);
        setData([]);
      } else if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setLimits(result.limits);
        setAccessDenied(false);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to load performance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [country, daysBack]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Performance by Location
          </Typography>

          {/* Filters */}
          <Box display="flex" gap={2} mb={3}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Country</InputLabel>
              <Select
                value={country}
                label="Country"
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={daysBack}
                label="Time Range"
                onChange={(e) => setDaysBack(Number(e.target.value))}
              >
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={90}>Last 90 days</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Subscription Limits Info */}
          {limits && !accessDenied && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  label={`${limits.maxCountries} countries`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${limits.maxDays} days history`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${limits.maxRows} rows max`} 
                  size="small" 
                  color="primary" 
                />
                {limits.appliedLimits && (
                  <Chip 
                    label={`Showing ${limits.appliedLimits.rowsReturned} results`} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </Alert>
          )}

          {/* Access Denied - Upgrade Prompt */}
          {accessDenied && (
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  href="/subscription-plans"
                >
                  Upgrade
                </Button>
              }
            >
              <Typography variant="subtitle2" gutterBottom>
                Subscription Limit Reached
              </Typography>
              <Typography variant="body2">
                {upgradeMessage}
              </Typography>
              {limits && (
                <Box mt={1}>
                  <Typography variant="caption">
                    Your plan includes: {limits.maxCountries} countries, {limits.maxDays} days history
                  </Typography>
                </Box>
              )}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Data Display */}
          {!loading && !error && !accessDenied && data.length > 0 && (
            <GeographicHeatmap data={data} />
          )}

          {/* No Data */}
          {!loading && !error && !accessDenied && data.length === 0 && (
            <Alert severity="info">
              No performance data available for the selected filters.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
```

**Integration Point:**
- Add to merchant dashboard
- Route: `/dashboard/performance/location`
- Menu item: "Performance by Location"

---

## 📊 USER FLOWS

### **Flow 1: Starter User - Nordic Country (Success)**
```
1. User selects Norway (NO)
2. User selects 30 days
3. API checks: ✅ Access granted (Nordic country, 30 days)
4. Display: Performance data with limits info
5. Show: "Your plan includes: 4 countries, 30 days history"
```

### **Flow 2: Starter User - US Country (Denied)**
```
1. User selects United States (US)
2. User selects 30 days
3. API checks: ❌ Access denied (not Nordic)
4. Display: Upgrade prompt
5. Message: "Upgrade to Professional for multi-country access"
6. Button: "Upgrade" → /subscription-plans
```

### **Flow 3: Starter User - 90 Days (Denied)**
```
1. User selects Norway (NO)
2. User selects 90 days
3. API checks: ❌ Access denied (exceeds 30 days)
4. Display: Upgrade prompt
5. Message: "Upgrade to Professional for 90-day history"
6. Button: "Upgrade" → /subscription-plans
```

### **Flow 4: Professional User (Success)**
```
1. User selects Sweden (SE)
2. User selects 90 days
3. API checks: ✅ Access granted (Nordic, 90 days)
4. Display: Performance data
5. Show: "Your plan includes: 4 countries, 90 days history"
```

---

## 🧪 TESTING

### **Test Case 1: Starter - Nordic Country**
```bash
GET /api/analytics/performance-by-location?country=NO&daysBack=30
Authorization: Bearer <starter-user-token>

Expected: 200 OK with data
```

### **Test Case 2: Starter - Non-Nordic Country**
```bash
GET /api/analytics/performance-by-location?country=US&daysBack=30
Authorization: Bearer <starter-user-token>

Expected: 403 Forbidden with upgrade message
```

### **Test Case 3: Starter - Exceeds Days**
```bash
GET /api/analytics/performance-by-location?country=NO&daysBack=90
Authorization: Bearer <starter-user-token>

Expected: 403 Forbidden with upgrade message
```

### **Test Case 4: Professional - Nordic Country**
```bash
GET /api/analytics/performance-by-location?country=SE&daysBack=90
Authorization: Bearer <professional-user-token>

Expected: 200 OK with data
```

---

## ✅ SUCCESS CRITERIA

**Backend:**
- ✅ API endpoint created
- ✅ Subscription limits enforced
- ✅ Returns 403 for denied access
- ✅ Returns data with limits info
- ✅ Proper error handling

**Frontend:**
- ✅ Component displays data
- ✅ Shows subscription limits
- ✅ Shows upgrade prompt when denied
- ✅ Upgrade button works
- ✅ Loading and error states

**Business:**
- ✅ Free users limited to Nordic + 30 days
- ✅ Clear upgrade path
- ✅ Revenue protection active

---

## 📋 CHECKLIST

**Backend:**
- [ ] Create API endpoint file
- [ ] Implement access check
- [ ] Implement data fetching with limits
- [ ] Add error handling
- [ ] Test with Postman/curl

**Frontend:**
- [ ] Create component file
- [ ] Implement country selector
- [ ] Implement time range selector
- [ ] Add upgrade prompt
- [ ] Add limits display
- [ ] Test in browser

**Integration:**
- [ ] Add route to dashboard
- [ ] Add menu item
- [ ] Test complete flow
- [ ] Verify upgrade button works

**Deployment:**
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Verify Vercel deployment
- [ ] Test production

---

## 🎯 ESTIMATED TIME

**Total: 2 hours**
- Backend API: 1 hour
- Frontend component: 1 hour
- Testing: Included

---

## ✅ READY TO IMPLEMENT

**Status:** All prerequisites met  
**Blocker:** None  
**Dependencies:** Database function working  
**Risk:** Low - Clear implementation path

**GO/NO-GO:** ✅ GO - Ready to implement!
