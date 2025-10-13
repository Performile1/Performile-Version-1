# 🔐 Role-Based Access & Subscription Limits Status

**Last Updated:** October 13, 2025, 7:25 AM  
**Status:** Partially Complete - Dashboard Done, Analytics Pending

---

## ✅ **Completed: Dashboard**

### **Unified Endpoint:** `/api/trustscore/dashboard`

| Role | Access | Data Shown | Subscription Limits |
|------|--------|------------|---------------------|
| **Admin** | ✅ Full | ALL couriers, ALL orders | ✅ Unlimited |
| **Merchant** | ✅ Filtered | THEIR linked couriers & orders | ✅ Tier-based (5/15/unlimited couriers) |
| **Courier** | ✅ Filtered | ONLY their own data | ✅ Tier-based |
| **Consumer** | ✅ Filtered | Couriers from THEIR orders | ✅ Tier-based |

**Implementation:**
- ✅ Role detection from `req.user`
- ✅ Dynamic WHERE clauses
- ✅ Subscription plan query
- ✅ Results limited by `max_couriers`
- ✅ Subscription info in response

---

## ⏳ **Pending: TrustScores Page**

### **Current Status:** ❌ Shows ALL couriers to everyone

### **Required Changes:**

| Role | Should See | Current Status |
|------|------------|----------------|
| **Admin** | All couriers | ✅ Works |
| **Merchant** | Their linked couriers only | ❌ Shows all |
| **Courier** | **NO ACCESS** (see own score in dashboard) | ❌ Has access |
| **Consumer** | All couriers (for selection) | ✅ Works |

**Action Items:**
- [ ] Hide TrustScores menu item for couriers ✅ DONE
- [ ] Add role-based filtering to `/api/trustscore` endpoint
- [ ] Apply subscription limits to results
- [ ] Add "Upgrade to see more" message when at limit

---

## ⏳ **Pending: Analytics**

### **Current Status:** ❌ Has endpoints but NO subscription limits

### **Existing Endpoints:**
- `/api/merchant/analytics` - Exists, no limits
- `/api/courier/analytics` - Exists, no limits
- `/api/admin/analytics` - Exists, no limits

### **Required Changes:**

| Role | Access | Data Shown | Subscription Limits Needed |
|------|--------|------------|---------------------------|
| **Admin** | ✅ Full | System-wide analytics | ✅ Unlimited |
| **Merchant** | ✅ Partial | Their stores & orders | ❌ Need tier limits |
| **Courier** | ✅ Partial | **Anonymized market data** | ❌ Need tier limits + purchase |
| **Consumer** | ❌ None | N/A | N/A |

**Action Items:**
- [ ] Add subscription plan check to analytics endpoints
- [ ] Limit data range based on tier (7/30/90 days)
- [ ] Limit export features based on tier
- [ ] Add "Upgrade for historical data" prompts
- [ ] **Courier Analytics:** Create anonymized data marketplace
  - [ ] Tier 1: Last 7 days, basic metrics
  - [ ] Tier 2: Last 30 days, advanced metrics
  - [ ] Tier 3: Unlimited, full market insights
  - [ ] Premium: Purchase specific market segments

---

## 📊 **Subscription Tiers**

### **Current Limits:**

| Feature | Tier 1 (Starter) | Tier 2 (Professional) | Tier 3 (Enterprise) |
|---------|------------------|----------------------|---------------------|
| **Max Couriers** | 5 | 15 | Unlimited |
| **Max Orders/Month** | 100 | 500 | Unlimited |
| **Dashboard** | ✅ Basic | ✅ Advanced | ✅ Full |
| **Analytics** | ❌ 7 days | ⏳ 30 days | ⏳ 90 days |
| **TrustScores** | ⏳ Limited | ⏳ Full | ⏳ Full |
| **Data Export** | ❌ No | ⏳ CSV | ⏳ CSV + API |
| **Market Data (Courier)** | ❌ No | ⏳ Basic | ⏳ Advanced |

**Legend:**
- ✅ Implemented
- ⏳ Partially implemented
- ❌ Not implemented

---

## 🎯 **Courier-Specific Recommendations**

### **Current Issue:**
Couriers can see TrustScores page showing ALL couriers (including competitors)

### **Proposed Solution:**

**1. Remove TrustScores Access** ✅ DONE
- Couriers should NOT see the TrustScores page
- They see their own score in Dashboard

**2. Add Courier Analytics with Market Data**
Create new section: **Market Insights** (Courier only)

**Features:**
- **Anonymized competitor data:**
  - Average trust scores in their service area
  - Market pricing trends
  - Peak delivery times
  - Popular routes
- **Benchmarking:**
  - How they compare to market average
  - Percentile ranking (without revealing competitors)
- **Purchase Options:**
  - Detailed market segments
  - Historical trends
  - Predictive analytics

**Implementation:**
```typescript
// New endpoint: /api/courier/market-insights
// Filters:
// - Service area (postal codes)
// - Time range (based on subscription)
// - Anonymized (no courier names/IDs)
```

---

## 🔒 **Security & Privacy**

### **Data Isolation:**

**Merchant:**
- ✅ Can only see their own stores
- ✅ Can only see their linked couriers
- ✅ Can only see orders from their stores
- ⏳ Cannot see other merchants' data

**Courier:**
- ✅ Can only see their own profile
- ✅ Can only see their own orders
- ✅ Can only see their own reviews
- ⏳ Can see anonymized market data (purchase)

**Consumer:**
- ✅ Can only see their own orders
- ✅ Can see all couriers (for selection)
- ✅ Can see public trust scores
- ❌ Cannot see merchant data

**Admin:**
- ✅ Can see everything
- ✅ No restrictions

---

## 📋 **Implementation Checklist**

### **Phase 1: Dashboard** ✅ COMPLETE
- [x] Unified endpoint `/trustscore/dashboard`
- [x] Role-based filtering
- [x] Subscription limits enforced
- [x] Subscription info in response
- [x] Hide TrustScores from couriers

### **Phase 2: TrustScores Page** ⏳ IN PROGRESS
- [x] Hide menu item from couriers
- [ ] Add role filtering to backend endpoint
- [ ] Apply subscription limits
- [ ] Add upgrade prompts

### **Phase 3: Analytics** ⏳ PENDING
- [ ] Add subscription checks to endpoints
- [ ] Limit data range by tier
- [ ] Add upgrade prompts
- [ ] Create courier market insights

### **Phase 4: Courier Market Data** ⏳ PENDING
- [ ] Design anonymization strategy
- [ ] Create `/courier/market-insights` endpoint
- [ ] Add purchase flow for premium data
- [ ] Build frontend UI

---

## 🚀 **Next Steps (Priority Order)**

### **High Priority:**
1. ✅ **Dashboard subscription limits** - DONE
2. ⏳ **TrustScores role filtering** - IN PROGRESS
3. ⏳ **Analytics subscription limits** - NEXT

### **Medium Priority:**
4. ⏳ **Courier market insights** - Design phase
5. ⏳ **Data export limits** - Not started
6. ⏳ **Remove old endpoints** - Cleanup

### **Low Priority:**
7. ⏳ **Advanced analytics** - Future
8. ⏳ **Predictive insights** - Future
9. ⏳ **API access** - Future

---

## 💡 **Key Insights**

### **Why Couriers Shouldn't See TrustScores:**
1. **Privacy:** Competitors shouldn't see each other's detailed scores
2. **Focus:** Couriers should focus on their own performance
3. **Monetization:** Market data should be anonymized and purchasable
4. **User Experience:** Reduces confusion and information overload

### **Why Unified Dashboard Works:**
1. **Consistency:** Same data structure for all roles
2. **Maintainability:** One endpoint to update
3. **Security:** Role filtering in one place
4. **Scalability:** Easy to add new roles

### **Why Subscription Limits Matter:**
1. **Revenue:** Encourages upgrades
2. **Fairness:** Prevents abuse
3. **Performance:** Limits database load
4. **Value:** Clear tier differentiation

---

## 📊 **Current Implementation Status**

```
Overall Progress: 60%

✅ Dashboard: 100% (Role filtering + Subscription limits)
⏳ TrustScores: 30% (Route hidden, backend pending)
⏳ Analytics: 20% (Endpoints exist, limits pending)
❌ Market Insights: 0% (Not started)
```

---

## 🔗 **Related Files**

**Backend:**
- `backend/src/controllers/trustScoreController.ts` - ✅ Updated with role filtering
- `backend/src/routes/trustscore.ts` - ⏳ Needs role filtering
- `backend/src/routes/analytics.ts` - ⏳ Needs subscription limits
- `backend/src/routes/merchant-dashboard.ts` - ⏳ To be removed

**Frontend:**
- `frontend/src/pages/Dashboard.tsx` - ✅ Updated to unified endpoint
- `frontend/src/pages/TrustScores.tsx` - ⏳ Needs role filtering
- `frontend/src/pages/Analytics.tsx` - ⏳ Needs subscription UI
- `frontend/src/App.tsx` - ✅ TrustScores route restricted

**Database:**
- `user_subscriptions` table - ✅ Exists
- `merchant_courier_selections` table - ✅ Exists
- Subscription limits function - ⏳ Needs creation

---

**Status:** Dashboard complete, TrustScores and Analytics pending! 🚀
