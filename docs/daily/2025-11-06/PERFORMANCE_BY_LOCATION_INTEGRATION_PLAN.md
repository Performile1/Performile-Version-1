# PERFORMANCE BY LOCATION - INTEGRATION PLAN

**Date:** November 6, 2025  
**Time:** 7:56 PM  
**Status:** 📋 PLANNING  

---

## 🎯 OBJECTIVE

Integrate PerformanceByLocation component into Merchant and Courier analytics views with proper subscription limits.

---

## ✅ COMPLETED

### **Admin Analytics** ✅
- **File:** `apps/web/src/pages/Analytics.tsx`
- **Status:** Integrated and deployed
- **Access:** Full access (no limits)
- **Location:** Bottom of analytics dashboard

---

## 📊 SUBSCRIPTION LIMITS (from Database Function)

### **MERCHANT LIMITS:**

**Starter Plan (FREE):**
- Countries: Own country OR Nordic (NO, SE, DK, FI)
- Days: 30 days max
- Rows: 100 max
- Upgrade message: "Upgrade to Professional for multi-country access"

**Professional Plan ($29/month):**
- Countries: Nordic only (NO, SE, DK, FI)
- Days: 90 days max
- Rows: 1,000 max
- Upgrade message: "Upgrade to Enterprise for global access"

**Enterprise Plan ($99/month):**
- Countries: Unlimited (999)
- Days: Unlimited (999,999)
- Rows: Unlimited (999,999)
- Message: "Access granted"

### **COURIER LIMITS:**

**Basic Plan (FREE):**
- Countries: Own area only (1)
- Days: 30 days max
- Rows: 50 max
- Upgrade message: "Upgrade to Pro for 90-day history"

**Pro Plan ($19/month):**
- Countries: Nordic only (NO, SE, DK, FI)
- Days: 90 days max
- Rows: 500 max
- Upgrade message: "Upgrade to Premium for global access"

**Premium/Enterprise Plan ($59-99/month):**
- Countries: Unlimited (999)
- Days: Unlimited (999,999)
- Rows: Unlimited (999,999)
- Message: "Access granted"

---

## 🔧 WHERE TO ADD PERFORMANCEBYLOCATION

### **1. Merchant Analytics** ⏳

**File:** `apps/web/src/pages/analytics/MerchantAnalytics.tsx`

**Current Structure:**
```
┌─────────────────────────────────────────┐
│ Merchant Analytics                      │
├─────────────────────────────────────────┤
│ Metric Cards (Orders, Revenue, etc.)   │
├─────────────────────────────────────────┤
│ Trend Charts                            │
├─────────────────────────────────────────┤
│ Delivery Breakdown (Doughnut Chart)    │
└─────────────────────────────────────────┘
```

**Proposed Addition:**
```
┌─────────────────────────────────────────┐
│ Merchant Analytics                      │
├─────────────────────────────────────────┤
│ Metric Cards (Orders, Revenue, etc.)   │
├─────────────────────────────────────────┤
│ Trend Charts                            │
├─────────────────────────────────────────┤
│ Delivery Breakdown (Doughnut Chart)    │
├─────────────────────────────────────────┤
│ Performance by Location ← NEW!          │
│ [PerformanceByLocation Component]       │
│ - Subscription limits enforced          │
│ - Upgrade prompts for Starter users     │
└─────────────────────────────────────────┘
```

**Benefits for Merchants:**
- ✅ See which locations perform best
- ✅ Identify courier performance by postal code
- ✅ Optimize delivery strategy by geography
- ✅ Understand regional patterns

**Subscription Value:**
- Starter: Limited to own country/Nordic
- Professional: Nordic countries + 90 days
- Enterprise: Global access

---

### **2. Courier Analytics** ⏳

**File:** `apps/web/src/pages/analytics/CourierAnalytics.tsx`

**Current Structure:**
```
┌─────────────────────────────────────────┐
│ Courier Analytics                       │
├─────────────────────────────────────────┤
│ Metric Cards (Deliveries, Rating, etc.)│
├─────────────────────────────────────────┤
│ Performance Bars (Completion, On-time) │
├─────────────────────────────────────────┤
│ Trend Charts                            │
└─────────────────────────────────────────┘
```

**Proposed Addition:**
```
┌─────────────────────────────────────────┐
│ Courier Analytics                       │
├─────────────────────────────────────────┤
│ Metric Cards (Deliveries, Rating, etc.)│
├─────────────────────────────────────────┤
│ Performance Bars (Completion, On-time) │
├─────────────────────────────────────────┤
│ Trend Charts                            │
├─────────────────────────────────────────┤
│ Performance by Location ← NEW!          │
│ [PerformanceByLocation Component]       │
│ - Shows courier's own performance       │
│ - Subscription limits enforced          │
└─────────────────────────────────────────┘
```

**Benefits for Couriers:**
- ✅ See own performance by location
- ✅ Identify strong/weak areas
- ✅ Optimize routes and coverage
- ✅ Compare performance across regions

**Subscription Value:**
- Basic: Own area only, 30 days
- Pro: Nordic countries, 90 days
- Premium: Global access

---

## 🚀 IMPLEMENTATION STEPS

### **Step 1: Merchant Analytics Integration**

**Changes Needed:**
1. Import PerformanceByLocation component
2. Add to bottom of page (after delivery breakdown)
3. Wrap in Grid item (xs={12})
4. Test with Starter merchant user
5. Verify upgrade prompts work

**Code:**
```typescript
// Add import
import { PerformanceByLocation } from '@/components/analytics/PerformanceByLocation';

// Add to render (after delivery breakdown)
<Grid item xs={12}>
  <PerformanceByLocation />
</Grid>
```

**Testing:**
- [ ] Starter merchant + Nordic country → Should work
- [ ] Starter merchant + US country → Should show upgrade prompt
- [ ] Starter merchant + 90 days → Should show upgrade prompt
- [ ] Professional merchant + Nordic + 90 days → Should work
- [ ] Enterprise merchant + Any country → Should work

---

### **Step 2: Courier Analytics Integration**

**Changes Needed:**
1. Import PerformanceByLocation component
2. Add to bottom of page (after trend charts)
3. Wrap in Grid item (xs={12})
4. Test with Basic courier user
5. Verify upgrade prompts work

**Code:**
```typescript
// Add import
import { PerformanceByLocation } from '@/components/analytics/PerformanceByLocation';

// Add to render (after trend charts)
<Grid item xs={12}>
  <PerformanceByLocation />
</Grid>
```

**Testing:**
- [ ] Basic courier + 30 days → Should work
- [ ] Basic courier + 90 days → Should show upgrade prompt
- [ ] Pro courier + Nordic + 90 days → Should work
- [ ] Premium courier + Any country → Should work

---

## 💰 BUSINESS VALUE

### **Revenue Impact:**

**Merchant Upgrades:**
- Starter → Professional ($29/month): Multi-country access
- Professional → Enterprise ($99/month): Global access
- Expected conversion: 10-15% of Starter users

**Courier Upgrades:**
- Basic → Pro ($19/month): Nordic + 90 days
- Pro → Premium ($59/month): Global access
- Expected conversion: 15-20% of Basic users

**Estimated Monthly Revenue:**
- 50 merchants × 10% conversion × $29 = $145/month
- 100 couriers × 15% conversion × $19 = $285/month
- **Total: $430/month** from this feature alone

---

## 📋 INTEGRATION CHECKLIST

### **Merchant Analytics:**
- [ ] Import PerformanceByLocation
- [ ] Add component to page
- [ ] Test Starter plan limits
- [ ] Test Professional plan limits
- [ ] Test Enterprise plan limits
- [ ] Verify upgrade prompts
- [ ] Test responsive design
- [ ] Commit and push

### **Courier Analytics:**
- [ ] Import PerformanceByLocation
- [ ] Add component to page
- [ ] Test Basic plan limits
- [ ] Test Pro plan limits
- [ ] Test Premium plan limits
- [ ] Verify upgrade prompts
- [ ] Test responsive design
- [ ] Commit and push

---

## 🎯 SUCCESS CRITERIA

### **Technical:**
- ✅ Component renders correctly in both views
- ✅ Subscription limits enforced properly
- ✅ Upgrade prompts display correctly
- ✅ Data loads without errors
- ✅ Responsive on all screen sizes

### **Business:**
- ✅ Clear value proposition for upgrades
- ✅ Upgrade button works (links to /subscription-plans)
- ✅ Users understand their limits
- ✅ Premium features clearly differentiated

### **User Experience:**
- ✅ Loading states work
- ✅ Error handling graceful
- ✅ Filters work correctly
- ✅ Data displays clearly
- ✅ Upgrade prompts not annoying

---

## ⏱️ ESTIMATED TIME

**Merchant Analytics Integration:** 20 minutes
- Import + Add component: 5 min
- Testing: 10 min
- Commit: 5 min

**Courier Analytics Integration:** 20 minutes
- Import + Add component: 5 min
- Testing: 10 min
- Commit: 5 min

**Total:** 40 minutes

---

## 🚨 IMPORTANT NOTES

### **Subscription Enforcement:**
The PerformanceByLocation component already has built-in subscription enforcement via the `check_performance_view_access()` database function. No additional code needed!

### **User Role Detection:**
The component automatically detects user role from auth context and applies appropriate limits.

### **Upgrade Flow:**
When users hit limits, they see:
1. Warning alert with reason
2. Current plan name
3. "Upgrade Now" button → /subscription-plans
4. Clear explanation of what they get

### **Data Privacy:**
- Merchants see all courier performance in their area
- Couriers see only their own performance
- Admin sees everything

---

## ✅ READY TO IMPLEMENT

**Status:** Specification complete  
**Blocker:** None  
**Dependencies:** PerformanceByLocation component (already built)  
**Risk:** Low - Simple integration

**GO/NO-GO:** ✅ GO - Ready to implement!

---

**Next Step:** Integrate into Merchant Analytics first, then Courier Analytics.
