# 🎨 Courier Logo Integration Plan
**Date:** October 18, 2025  
**Objective:** Add courier logos throughout the platform + merchant logo feature  
**Framework:** Spec-Driven v1.18 (Rules 15-18)

---

## 🎯 THREE-PART STRATEGY

### **PART 1: Add Courier Logos Everywhere** 🎨
Replace text-only courier names with beautiful logos

### **PART 2: Merchant Logo Upload** 🏪
Allow merchants to upload their shop logo (visible to couriers & admins)

### **PART 3: Courier Integration Settings** ⚙️
API credential management (original plan)

---

## 📋 PART 1: COURIER LOGO INTEGRATION

### **Priority Files to Update (High Impact):**

#### **1. TrustScores Page** ⭐⭐⭐
**File:** `apps/web/src/pages/TrustScores.tsx`
**Current:** Text-only courier names
**Update:** Add `CourierLogo` component
**Impact:** Main public-facing page
**Estimated Time:** 30 minutes

#### **2. Dashboard (All Roles)** ⭐⭐⭐
**File:** `apps/web/src/pages/Dashboard.tsx`
**Current:** Text-only courier references
**Update:** Add `CourierLogo` in stats/charts
**Impact:** First page users see
**Estimated Time:** 45 minutes

#### **3. Admin - Manage Couriers** ⭐⭐⭐
**File:** `apps/web/src/pages/admin/ManageCouriers.tsx`
**Current:** Text-only courier list
**Update:** Add `CourierLogo` in table rows
**Impact:** Admin courier management
**Estimated Time:** 30 minutes

#### **4. Merchant Checkout Analytics** ⭐⭐⭐
**File:** `apps/web/src/pages/merchant/MerchantCheckoutAnalytics.tsx`
**Current:** Text-only courier performance
**Update:** Add `CourierLogo` in charts/tables
**Impact:** Key merchant analytics
**Estimated Time:** 45 minutes

#### **5. Courier Analytics** ⭐⭐
**File:** `apps/web/src/pages/analytics/CourierAnalytics.tsx`
**Current:** Text-only
**Update:** Add `CourierLogo` everywhere
**Impact:** Courier performance page
**Estimated Time:** 30 minutes

#### **6. Orders Page** ⭐⭐
**File:** `apps/web/src/pages/Orders.tsx`
**Current:** Text-only courier column
**Update:** Add `CourierLogo` in order rows
**Impact:** Order management
**Estimated Time:** 30 minutes

#### **7. Courier Selector (Checkout)** ⭐⭐
**File:** `apps/web/src/components/checkout/CourierSelector.tsx`
**Current:** Text-only options
**Update:** Add `CourierLogo` in selection cards
**Impact:** Checkout experience
**Estimated Time:** 45 minutes

#### **8. Courier Marketplace** ⭐
**File:** `apps/web/src/components/marketplace/CourierMarketplace.tsx`
**Current:** Text-only
**Update:** Add `CourierLogo` in marketplace cards
**Impact:** Lead marketplace
**Estimated Time:** 30 minutes

#### **9. Courier Directory** ⭐
**File:** `apps/web/src/pages/courier/CourierDirectory.tsx`
**Current:** Text-only
**Update:** Add `CourierLogo` in directory listing
**Impact:** Public courier directory
**Estimated Time:** 30 minutes

#### **10. Merchant Courier Settings** ⭐
**File:** `apps/web/src/pages/settings/MerchantCourierSettings.tsx`
**Current:** Text-only
**Update:** Add `CourierLogo` in preferences
**Impact:** Merchant settings
**Estimated Time:** 30 minutes

### **Total Part 1 Time:** ~5-6 hours

---

## 🏪 PART 2: MERCHANT LOGO UPLOAD FEATURE

### **Objective:**
Allow merchants to upload their shop logo that:
- ✅ Couriers see when buying leads
- ✅ Admins see in merchant management
- ✅ Displays in marketplace
- ✅ Shows in analytics

### **Database Changes Needed:**

```sql
-- Add logo fields to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS logo_file_size INTEGER,
ADD COLUMN IF NOT EXISTS logo_mime_type VARCHAR(100);

-- Add to merchantshops if needed
ALTER TABLE merchantshops
ADD COLUMN IF NOT EXISTS shop_logo_url VARCHAR(500);

-- Create index
CREATE INDEX IF NOT EXISTS idx_stores_logo 
ON stores(logo_url) 
WHERE logo_url IS NOT NULL;
```

### **Components to Create:**

#### **1. MerchantLogoUpload Component**
**File:** `apps/web/src/components/merchant/MerchantLogoUpload.tsx`
**Features:**
- File upload (drag & drop)
- Image preview
- Crop/resize tool
- Format validation (PNG, JPG, SVG)
- Size limit (2MB)
- Delete/replace option

**Estimated Time:** 2-3 hours

#### **2. MerchantLogo Component** (Similar to CourierLogo)
**File:** `apps/web/src/components/merchant/MerchantLogo.tsx`
**Features:**
- Display merchant logo
- Fallback to shop name initial
- Multiple sizes
- Tooltip with shop name

**Estimated Time:** 1 hour

### **API Endpoints Needed:**

#### **1. Upload Logo**
**Endpoint:** `POST /api/merchant/logo/upload`
**Features:**
- Multipart form data
- Image validation
- Resize/optimize
- Store in Supabase Storage
- Update database

**Estimated Time:** 2 hours

#### **2. Delete Logo**
**Endpoint:** `DELETE /api/merchant/logo`
**Features:**
- Remove from storage
- Update database

**Estimated Time:** 30 minutes

### **Storage Setup:**

```typescript
// Supabase Storage Bucket
// Bucket name: merchant-logos
// Public access: Yes (read-only)
// File size limit: 2MB
// Allowed types: image/png, image/jpeg, image/svg+xml

// File naming: {merchant_id}_{timestamp}.{ext}
// Example: 123e4567-e89b-12d3-a456-426614174000_1697654400.png
```

### **Where to Display Merchant Logos:**

1. **Courier Lead Marketplace** ⭐⭐⭐
   - Show merchant logo in lead cards
   - Helps couriers identify brands

2. **Admin - Manage Merchants** ⭐⭐⭐
   - Show logo in merchant list
   - Quick visual identification

3. **Analytics Pages** ⭐⭐
   - Show logo in merchant performance charts
   - Better visual context

4. **Order Details** ⭐
   - Show merchant logo in order info
   - Professional appearance

### **Total Part 2 Time:** ~6-7 hours

---

## ⚙️ PART 3: COURIER INTEGRATION SETTINGS

### **Original Plan:**
**File:** `apps/web/src/components/integrations/CourierIntegrationSettings.tsx`

**Features:**
- View all couriers (with logos ✅)
- Add/edit API credentials
- Test connections
- View integration status
- API usage stats

**Estimated Time:** 4-6 hours

---

## 📊 COMPLETE IMPLEMENTATION PLAN

### **Recommended Order:**

#### **Phase A: Quick Wins (Day 1 - 6 hours)**
1. ✅ Add CourierLogo to TrustScores (30 min)
2. ✅ Add CourierLogo to Dashboard (45 min)
3. ✅ Add CourierLogo to Admin ManageCouriers (30 min)
4. ✅ Add CourierLogo to Checkout Analytics (45 min)
5. ✅ Add CourierLogo to Orders page (30 min)
6. ✅ Add CourierLogo to Courier Selector (45 min)
7. ✅ Add CourierLogo to Analytics pages (30 min)
8. ✅ Add CourierLogo to Marketplace (30 min)
9. ✅ Add CourierLogo to Directory (30 min)
10. ✅ Add CourierLogo to Settings (30 min)

**Result:** Platform looks professional with courier branding everywhere!

#### **Phase B: Merchant Logo Feature (Day 2 - 7 hours)**
1. ✅ Database schema update (30 min)
2. ✅ Supabase Storage setup (30 min)
3. ✅ MerchantLogoUpload component (2-3 hours)
4. ✅ MerchantLogo component (1 hour)
5. ✅ Upload API endpoint (2 hours)
6. ✅ Delete API endpoint (30 min)
7. ✅ Integrate in merchant settings (30 min)

**Result:** Merchants can upload logos, visible to couriers & admins!

#### **Phase C: Integration Settings (Day 3 - 6 hours)**
1. ✅ CourierIntegrationSettings component (4-6 hours)
2. ✅ Testing & polish (1 hour)

**Result:** Complete courier integration management!

### **Total Time:** 19-20 hours (2.5-3 days)

---

## 🎨 VISUAL IMPROVEMENTS

### **Before:**
```
Courier: DHL Express
Status: Active
```

### **After:**
```
[DHL Logo] DHL Express
[Green Badge] Active
```

### **Impact:**
- ✅ More professional appearance
- ✅ Better brand recognition
- ✅ Easier visual scanning
- ✅ Modern UI/UX
- ✅ Consistent branding

---

## 📋 IMPLEMENTATION CHECKLIST

### **Part 1: Courier Logos (10 files)**
- [ ] TrustScores.tsx
- [ ] Dashboard.tsx
- [ ] ManageCouriers.tsx
- [ ] MerchantCheckoutAnalytics.tsx
- [ ] CourierAnalytics.tsx
- [ ] Orders.tsx
- [ ] CourierSelector.tsx
- [ ] CourierMarketplace.tsx
- [ ] CourierDirectory.tsx
- [ ] MerchantCourierSettings.tsx

### **Part 2: Merchant Logo Feature**
- [ ] Database schema update
- [ ] Supabase Storage bucket
- [ ] MerchantLogoUpload component
- [ ] MerchantLogo component
- [ ] Upload API endpoint
- [ ] Delete API endpoint
- [ ] Integrate in settings
- [ ] Display in marketplace
- [ ] Display in admin pages
- [ ] Display in analytics

### **Part 3: Integration Settings**
- [ ] CourierIntegrationSettings component
- [ ] Connect to week3-integrations APIs
- [ ] Test functionality
- [ ] Documentation

---

## 🚀 RECOMMENDATION

**Start with Phase A (Courier Logos)** because:
1. ✅ Quick wins (6 hours)
2. ✅ High visual impact
3. ✅ Uses existing CourierLogo component
4. ✅ No new APIs needed
5. ✅ Immediate improvement

Then move to Phase B (Merchant Logos) and Phase C (Integration Settings).

---

## 📝 NOTES

### **Framework Compliance:**
- ✅ Rule #15: Audit files before modifying ✅
- ✅ Rule #16: Check existing APIs (CourierLogo exists) ✅
- ✅ Rule #17: Check existing tables (stores table exists) ✅
- ✅ Rule #18: Conflict detection (no conflicts) ✅

### **Design Consistency:**
- Use `CourierLogo` component everywhere
- Consistent sizing (medium by default)
- Show name on hover (tooltip)
- Use `IntegrationStatusBadge` where applicable

### **Performance:**
- Logos are static files (fast)
- No API calls needed
- Cached by browser
- Small file sizes (~10-50KB each)

---

**Ready to proceed with Phase A?** 🎯

Let's make the platform look amazing with courier logos everywhere!
