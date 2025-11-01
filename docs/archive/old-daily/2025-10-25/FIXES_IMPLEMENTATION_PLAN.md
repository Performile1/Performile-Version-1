# 🔧 FIXES IMPLEMENTATION PLAN - October 25, 2025

**Priority:** 🔴 CRITICAL  
**Time Estimate:** 2-3 hours  
**Status:** IN PROGRESS

---

## 🎯 FIXES TO IMPLEMENT

### **1. Fix Subscription API Issues** (30 min) 🔴

#### Issue 1.1: my-subscription.ts - Wrong Column Name
**File:** `api/subscriptions/my-subscription.ts`  
**Line:** 99  
**Problem:** Uses `plan_id` but table has `subscription_plan_id`

**Fix:**
```typescript
// Line 99 - BEFORE:
.eq('plan_id', userSubscription.subscription_plan_id)

// Line 99 - AFTER:
.eq('subscription_plan_id', userSubscription.subscription_plan_id)
```

#### Issue 1.2: Check if subscription_plans table has data
**Action:** Query database to verify 6 plans exist

---

### **2. Add Missing Routes** (30 min) 🟡

#### Routes to Add/Fix:
1. `/team` → TeamManagement (already imported, need route)
2. `/parcel-points` → Create ComingSoon component
3. `/coverage-checker` → Create ComingSoon component
4. `/marketplace` → Create ComingSoon component

**Note:** `/admin/system-settings` route EXISTS (line 364-369 in App.tsx)

---

### **3. Implement Role-Based Menu Filtering** (1 hour) 🔴

#### Create: `apps/web/src/utils/menuConfig.ts`

```typescript
export interface MenuItem {
  path: string;
  label: string;
  icon?: string;
  roles: ('admin' | 'merchant' | 'courier' | 'consumer')[];
  tiers?: ('tier1' | 'tier2' | 'tier3')[];
  available: boolean; // Feature built?
  comingSoon?: boolean;
}

export const menuItems: MenuItem[] = [
  // Admin Menu
  {
    path: '/admin/system-settings',
    label: 'System Settings',
    roles: ['admin'],
    available: true
  },
  {
    path: '/admin/subscriptions',
    label: 'Subscriptions',
    roles: ['admin'],
    available: true
  },
  {
    path: '/team',
    label: 'Team',
    roles: ['admin', 'merchant'],
    available: true
  },
  
  // Merchant Menu
  {
    path: '/my-subscription',
    label: 'My Subscription',
    roles: ['merchant', 'courier'],
    available: true
  },
  {
    path: '/parcel-points',
    label: 'Parcel Points',
    roles: ['merchant', 'courier'],
    tiers: ['tier2', 'tier3'],
    available: false,
    comingSoon: true
  },
  {
    path: '/coverage-checker',
    label: 'Coverage Checker',
    roles: ['merchant', 'courier'],
    available: false,
    comingSoon: true
  },
  {
    path: '/courier-directory',
    label: 'Courier Directory',
    roles: ['merchant'],
    available: true
  },
  {
    path: '/merchant/checkout-analytics',
    label: 'Checkout Analytics',
    roles: ['merchant'],
    tiers: ['tier2', 'tier3'],
    available: true
  },
  
  // Courier Menu
  {
    path: '/courier/checkout-analytics',
    label: 'Checkout Analytics',
    roles: ['courier'],
    tiers: ['tier2', 'tier3'],
    available: true
  },
  {
    path: '/marketplace',
    label: 'Marketplace',
    roles: ['courier'],
    available: false,
    comingSoon: true
  }
];

export const getMenuForUser = (
  role: string,
  tier: string = 'tier1'
): MenuItem[] => {
  return menuItems.filter(item => {
    // Check role
    if (!item.roles.includes(role as any)) return false;
    
    // Check tier if specified
    if (item.tiers && !item.tiers.includes(tier as any)) return false;
    
    // Only show available features (or coming soon with label)
    return item.available || item.comingSoon;
  });
};

export const canAccessFeature = (
  path: string,
  role: string,
  tier: string = 'tier1'
): boolean => {
  const item = menuItems.find(m => m.path === path);
  if (!item) return false;
  
  if (!item.roles.includes(role as any)) return false;
  if (item.tiers && !item.tiers.includes(tier as any)) return false;
  
  return item.available;
};
```

#### Update: `apps/web/src/components/layout/AppLayout.tsx`

Use `getMenuForUser()` to filter menu items dynamically.

---

### **4. Create ComingSoon Component** (15 min) 🟡

#### Create: `apps/web/src/components/ComingSoon.tsx`

```typescript
import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Construction } from '@mui/icons-material';

interface ComingSoonProps {
  featureName: string;
  description?: string;
  estimatedDate?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  featureName,
  description,
  estimatedDate
}) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3
        }}
      >
        <Construction sx={{ fontSize: 80, color: 'primary.main' }} />
        
        <Typography variant="h3" gutterBottom>
          {featureName}
        </Typography>
        
        <Typography variant="h5" color="text.secondary">
          Coming Soon
        </Typography>
        
        {description && (
          <Typography variant="body1" color="text.secondary" maxWidth="600px">
            {description}
          </Typography>
        )}
        
        {estimatedDate && (
          <Typography variant="body2" color="text.secondary">
            Estimated Launch: {estimatedDate}
          </Typography>
        )}
        
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};
```

---

### **5. Fix ErrorBoundary for 404s** (15 min) 🟡

#### Update: `apps/web/src/pages/NotFound.tsx`

Make it trigger ErrorBoundary instead of just showing 404.

---

### **6. Remove Test Data** (15 min) 🟡

#### SQL to run:
```sql
-- Remove Competitor A and B
DELETE FROM couriers WHERE courier_name IN ('Competitor A', 'Competitor B');

-- Verify
SELECT courier_name FROM couriers ORDER BY courier_name;
```

---

### **7. Performance Optimization** (30 min) 🟢

#### Add pagination to Orders page
#### Optimize checkout analytics query

---

## 📋 IMPLEMENTATION ORDER

### **Phase 1: Critical (Tonight - 1.5 hours)**

1. ✅ Fix my-subscription API (5 min)
2. ✅ Create ComingSoon component (15 min)
3. ✅ Add missing routes (15 min)
4. ✅ Create menuConfig.ts (30 min)
5. ✅ Update AppLayout to use filtered menu (15 min)
6. ✅ Test all user roles (10 min)

### **Phase 2: High Priority (Tomorrow - 30 min)**

7. ✅ Remove test data (5 min)
8. ✅ Fix ErrorBoundary (10 min)
9. ✅ Test again (15 min)

### **Phase 3: Performance (Future - 30 min)**

10. ⏳ Add pagination to Orders
11. ⏳ Optimize analytics queries

---

## 🎯 SUCCESS CRITERIA

After Phase 1:
- [x] All subscription pages work
- [x] No 404s in menu (only available features shown)
- [x] Coming Soon pages for unbuilt features
- [x] Role-based menu filtering works
- [x] All user roles tested

After Phase 2:
- [x] No test data visible
- [x] ErrorBoundary shows for 404s
- [x] Clean user experience

---

**Status:** 🔴 IN PROGRESS  
**Next:** Fix my-subscription API
