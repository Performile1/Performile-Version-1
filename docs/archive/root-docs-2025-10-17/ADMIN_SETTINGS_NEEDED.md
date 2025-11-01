# Admin Settings - Missing Features

**Date:** October 17, 2025  
**Status:** Identified gaps in admin control  
**Priority:** Medium

---

## 📋 **CURRENT STATE:**

### **✅ EXISTING Admin Pages:**
1. **SubscriptionManagement.tsx** - Manage subscription plans
2. **SystemSettings.tsx** - System-wide settings
3. **ManageCouriers.tsx** - Courier management
4. **ManageMerchants.tsx** - Merchant management
5. **ManageStores.tsx** - Store management
6. **ManageCarriers.tsx** - Carrier management
7. **ReviewBuilder.tsx** - Review management

---

## ❌ **MISSING Admin Features:**

### **1. Role Management Page**
**File:** `apps/web/src/pages/admin/RoleManagement.tsx`

**Purpose:** Manage user roles and permissions

**Features Needed:**
- View all users with their roles
- Change user roles (admin/merchant/courier/user)
- Bulk role assignment
- Role history/audit log
- Search and filter users

**Database:**
- Uses existing `users` table
- Column: `user_role` VARCHAR

**API Endpoints Needed:**
- `GET /api/admin/users` - List users with roles
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/users/:id/role-history` - Role change history

---

### **2. Feature Flags Settings Page**
**File:** `apps/web/src/pages/admin/FeatureFlagsSettings.tsx`

**Purpose:** Control which features are available in each subscription plan

**Features Needed:**
- Edit `features` JSONB in subscription_plans
- Toggle features per plan (checkboxes)
- Preview what each plan includes
- Save changes to database

**Current Features (from code):**
```json
{
  "proximity_matching": boolean,
  "advanced_analytics": boolean,
  "priority_support": boolean,
  "api_access": boolean,
  "white_label": boolean,
  "custom_integrations": boolean
}
```

**Database:**
- Table: `subscription_plans`
- Column: `features` JSONB

**API Endpoints Needed:**
- `GET /api/admin/subscription-plans/:id` - Get plan details
- `PUT /api/admin/subscription-plans/:id/features` - Update features

---

### **3. Subscription Limits Configuration**
**File:** Update `SubscriptionManagement.tsx`

**Purpose:** Add missing limit: `max_reports_per_month`

**Database Change Needed:**
```sql
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_reports_per_month INTEGER DEFAULT 10;
```

**Current Limits:**
- ✅ max_shops
- ✅ max_orders_per_month
- ✅ max_emails_per_month
- ❌ max_reports_per_month (MISSING)

---

### **4. Permissions Management (Optional)**
**Files:** 
- `database/migrations/create_permissions_system.sql`
- `apps/web/src/pages/admin/PermissionsManagement.tsx`

**Purpose:** Granular permission control beyond roles

**Tables Needed:**
```sql
CREATE TABLE permissions (
  permission_id UUID PRIMARY KEY,
  permission_name VARCHAR(100) UNIQUE,
  description TEXT,
  resource VARCHAR(50),
  action VARCHAR(50)
);

CREATE TABLE role_permissions (
  role VARCHAR(50),
  permission_id UUID REFERENCES permissions,
  PRIMARY KEY (role, permission_id)
);
```

**Note:** This is OPTIONAL. Current role-based system may be sufficient.

---

## 🎯 **PRIORITY ORDER:**

### **HIGH PRIORITY:**
1. ✅ Add `max_reports_per_month` to subscription_plans
2. ✅ Create RoleManagement.tsx page
3. ✅ Create FeatureFlagsSettings.tsx page

### **MEDIUM PRIORITY:**
4. Add role change audit logging
5. Add feature usage analytics

### **LOW PRIORITY:**
6. Create full permissions system (if needed)

---

## 📝 **IMPLEMENTATION PLAN:**

### **Step 1: Database Update**
```sql
-- Add missing column
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_reports_per_month INTEGER DEFAULT 10;

-- Update existing plans
UPDATE subscription_plans 
SET max_reports_per_month = 10 
WHERE tier = 'free';

UPDATE subscription_plans 
SET max_reports_per_month = 50 
WHERE tier = 'pro';

UPDATE subscription_plans 
SET max_reports_per_month = 999999 
WHERE tier = 'enterprise';
```

### **Step 2: Create RoleManagement Page**
- List all users with roles
- Search/filter functionality
- Change role dropdown
- Confirm dialog before change
- Toast notification on success

### **Step 3: Create FeatureFlagsSettings Page**
- List all subscription plans
- Expandable sections per plan
- Checkboxes for each feature
- Save button
- Preview mode

### **Step 4: Update SubscriptionManagement**
- Add max_reports_per_month field
- Validate on save
- Show in plan comparison

---

## 🔍 **VALIDATION QUERY:**

Run `CHECK_ADMIN_SETTINGS.sql` to verify:
```bash
# In Supabase SQL Editor
# Run: database/migrations/CHECK_ADMIN_SETTINGS.sql
```

This will show:
- ✅ What exists
- ❌ What's missing
- 📊 Current roles in system
- 📊 Current subscription plans

---

## 📚 **RELATED FILES:**

**Existing:**
- `apps/web/src/pages/admin/SubscriptionManagement.tsx`
- `apps/web/src/pages/admin/SystemSettings.tsx`
- `database/migrations/CHECK_ADMIN_SETTINGS.sql`

**To Create:**
- `apps/web/src/pages/admin/RoleManagement.tsx`
- `apps/web/src/pages/admin/FeatureFlagsSettings.tsx`
- `database/migrations/add_max_reports_per_month.sql`
- `api/admin/users.ts` (role management API)
- `api/admin/subscription-plans.ts` (feature flags API)

---

## ✅ **SUCCESS CRITERIA:**

**Admin should be able to:**
1. ✅ View all users and their roles
2. ✅ Change user roles easily
3. ✅ Configure subscription plan features
4. ✅ Set all subscription limits (including reports)
5. ✅ See audit trail of role changes

**System should:**
1. ✅ Enforce role-based access
2. ✅ Enforce subscription limits
3. ✅ Check feature flags before allowing access
4. ✅ Log all admin actions

---

**Status:** Ready to implement  
**Estimated Time:** 4-6 hours  
**Dependencies:** None (uses existing infrastructure)
