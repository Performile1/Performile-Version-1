# Subscription System Documentation

## Overview

The Performile platform implements a comprehensive subscription system that controls access to features and enforces usage limits based on the user's subscription tier.

**Last Updated:** October 12, 2025

---

## Subscription Tiers

### Merchant Plans

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Price (Monthly)** | $0 | $29 | $79 | $199 |
| **Price (Yearly)** | $0 | $290 | $790 | $1,990 |
| **Max Couriers** | 2 | 5 | 20 | Unlimited |
| **Max Shops** | 1 | 1 | 3 | Unlimited |
| **Max Orders/Month** | 50 | 100 | 500 | Unlimited |
| **Max Emails/Month** | 100 | 500 | 2,000 | Unlimited |
| **Max SMS/Month** | 0 | 0 | 100 | 500 |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Custom Templates** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **Dedicated Manager** | ❌ | ❌ | ❌ | ✅ |

### Courier Plans

| Feature | Free | Individual | Professional | Fleet |
|---------|------|-----------|--------------|-------|
| **Price (Monthly)** | $0 | $19 | $49 | $149 |
| **Price (Yearly)** | $0 | $190 | $490 | $1,490 |
| **Max Team Members** | 1 | 1 | 3 | Unlimited |
| **Max Orders/Month** | 25 | 50 | 200 | Unlimited |
| **Max Emails/Month** | 50 | 200 | 1,000 | Unlimited |
| **Max SMS/Month** | 0 | 0 | 50 | 200 |
| **Enhanced Profile** | ❌ | ❌ | ✅ | ✅ |
| **Priority Listing** | ❌ | ❌ | ✅ | ✅ |
| **Team Management** | ❌ | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Fleet Dashboard** | ❌ | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ✅ |

---

## Key Features

### 1. Courier Selection Limits (Merchants)

Merchants can select which couriers appear in their checkout. The number of couriers they can select is limited by their subscription tier.

**Implementation:**
- Database table: `merchant_courier_selections`
- Enforced via database trigger: `trg_enforce_courier_limit`
- API endpoint: `/api/couriers/merchant-preferences`
- Frontend page: `MerchantCourierSettings.tsx`

**User Experience:**
- Visual progress bar showing usage (e.g., "3 / 5 couriers selected")
- Upgrade prompts when limit is reached
- Courier logos displayed from `/public/courier-logos/`
- Drag-and-drop reordering
- Enable/disable without removing
- Custom courier names

### 2. Data Visibility Based on Subscription

Different subscription tiers see different levels of data:

#### Basic Data (All Tiers)
- Order tracking
- Basic analytics
- Courier ratings
- Review submission

#### Advanced Data (Professional+)
- Detailed analytics
- Competitor insights
- Postal code level data
- Export functionality
- Custom reports

#### Premium Data (Enterprise Only)
- White-label features
- API access
- Dedicated support
- Custom integrations

### 3. Usage Tracking

The system tracks usage for:
- Orders processed
- Emails sent
- SMS sent
- Push notifications
- API calls

**Monthly Reset:**
- Usage counters reset at the start of each billing period
- Function: `reset_monthly_usage()`
- Should be run via cron job

---

## Database Schema

### Core Tables

#### `subscription_plans`
Defines available subscription plans with limits and features.

```sql
CREATE TABLE subscription_plans (
  plan_id SERIAL PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  plan_slug VARCHAR(50) NOT NULL UNIQUE,
  user_type VARCHAR(20) NOT NULL, -- 'merchant' or 'courier'
  tier INTEGER NOT NULL, -- 0=Free, 1=Starter, 2=Professional, 3=Enterprise
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2),
  max_orders_per_month INTEGER,
  max_emails_per_month INTEGER,
  max_sms_per_month INTEGER,
  max_couriers INTEGER, -- For merchants
  max_team_members INTEGER, -- For couriers
  max_shops INTEGER, -- For merchants
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);
```

#### `user_subscriptions`
Tracks active user subscriptions and usage.

```sql
CREATE TABLE user_subscriptions (
  subscription_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  plan_id INTEGER REFERENCES subscription_plans(plan_id),
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  orders_used_this_month INTEGER DEFAULT 0,
  emails_sent_this_month INTEGER DEFAULT 0,
  sms_sent_this_month INTEGER DEFAULT 0,
  stripe_subscription_id VARCHAR(255)
);
```

#### `merchant_courier_selections`
Tracks which couriers each merchant has selected.

```sql
CREATE TABLE merchant_courier_selections (
  selection_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id),
  courier_id UUID REFERENCES couriers(courier_id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  custom_name VARCHAR(255),
  priority_level INTEGER DEFAULT 0,
  UNIQUE(merchant_id, courier_id)
);
```

### Key Functions

#### `get_user_subscription_limits(user_id)`
Returns subscription limits and features for a user.

```sql
SELECT * FROM get_user_subscription_limits('user-uuid-here');
```

Returns:
- `max_couriers`
- `max_shops`
- `max_orders_per_month`
- `has_api_access`
- `has_advanced_analytics`
- `plan_name`
- `tier`

#### `check_courier_selection_limit(merchant_id)`
Checks if merchant can add more couriers.

```sql
SELECT check_courier_selection_limit('merchant-uuid-here');
-- Returns: true or false
```

#### `get_merchant_subscription_info(merchant_id)`
Returns complete subscription info and usage.

```sql
SELECT get_merchant_subscription_info('merchant-uuid-here');
```

Returns JSON with subscription details and current usage.

---

## API Endpoints

### `/api/couriers/merchant-preferences`

**Authentication:** Required (Merchant role only)

**Actions:**

#### 1. Get Subscription Info
```json
POST /api/couriers/merchant-preferences
{
  "action": "get_subscription_info"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan_name": "Professional",
      "tier": 2,
      "max_couriers": 20,
      "max_shops": 3,
      "has_api_access": true,
      "has_advanced_analytics": true
    },
    "usage": {
      "couriers_selected": 8,
      "shops_created": 2,
      "can_add_courier": true
    }
  }
}
```

#### 2. Get Selected Couriers
```json
POST /api/couriers/merchant-preferences
{
  "action": "get_selected_couriers"
}
```

#### 3. Get Available Couriers
```json
POST /api/couriers/merchant-preferences
{
  "action": "get_available_couriers"
}
```

#### 4. Add Courier
```json
POST /api/couriers/merchant-preferences
{
  "action": "add_courier",
  "courier_id": "uuid-here"
}
```

Returns error if limit reached:
```json
{
  "error": "Courier limit reached",
  "message": "You have reached your subscription limit..."
}
```

#### 5. Remove Courier
```json
POST /api/couriers/merchant-preferences
{
  "action": "remove_courier",
  "courier_id": "uuid-here"
}
```

#### 6. Toggle Courier Active
```json
POST /api/couriers/merchant-preferences
{
  "action": "toggle_courier_active",
  "courier_id": "uuid-here",
  "is_active": true
}
```

#### 7. Update Courier Settings
```json
POST /api/couriers/merchant-preferences
{
  "action": "update_courier_settings",
  "courier_id": "uuid-here",
  "custom_name": "Fast Delivery Co",
  "custom_description": "Our preferred courier",
  "priority_level": 1
}
```

---

## Frontend Implementation

### Subscription Helper Utilities

Location: `/frontend/src/utils/subscriptionHelpers.ts`

**Key Functions:**

```typescript
// Check if user can access a feature
canAccessFeature(subscriptionInfo, 'has_api_access')

// Check if limit is reached
hasReachedLimit(currentCount, maxLimit)

// Get usage percentage
getUsagePercentage(current, max) // Returns 0-100

// Get usage color
getUsageColor(current, max) // Returns 'success' | 'warning' | 'error'

// Format limit display
formatLimit(limit) // null → "Unlimited", number → "5"

// Check if can add more
canAddMore(current, max)

// Get remaining slots
getRemainingSlots(current, max)

// Filter data by subscription
filterDataBySubscription(data, subscriptionInfo, 'advanced')
```

### Merchant Courier Settings Page

Location: `/frontend/src/pages/settings/MerchantCourierSettings.tsx`

**Features:**
- Visual subscription status card with gradient
- Progress bar showing courier usage
- Upgrade prompts when limits reached
- Courier logos from `/public/courier-logos/`
- Drag-and-drop reordering
- Custom courier names
- Enable/disable toggles
- API key management

**Usage:**
```typescript
import { MerchantCourierSettings } from '@/pages/settings/MerchantCourierSettings';

// In router
<Route path="/settings/couriers" element={<MerchantCourierSettings />} />
```

---

## Courier Logos

Location: `/frontend/public/courier-logos/`

**Available Logos:**
- PostNord, DHL, FedEx, UPS, Bring, Budbee, Instabox
- And 40+ more courier logos

**Naming Convention:**
- Format: `{courier_name}_logo.jpeg`
- Example: `postnord_logo.jpeg`, `dhl_logo.jpeg`
- Lowercase with underscores

**Usage in Code:**
```typescript
const getCourierLogo = (courierName: string) => {
  const normalized = courierName.toLowerCase().replace(/\s+/g, '_');
  return `/courier-logos/${normalized}_logo.jpeg`;
};
```

---

## Implementing Subscription Checks

### In API Endpoints

```typescript
// Check if user can perform action
const limitCheck = await client.query(
  'SELECT check_courier_selection_limit($1) as can_add',
  [userId]
);

if (!limitCheck.rows[0]?.can_add) {
  return res.status(403).json({ 
    error: 'Limit reached',
    message: 'Please upgrade your subscription'
  });
}
```

### In Frontend Components

```typescript
import { canAddMore, getUpgradeMessage } from '@/utils/subscriptionHelpers';

// Check if can add more
if (!canAddMore(currentCount, maxLimit)) {
  toast.error(getUpgradeMessage('couriers'));
  navigate('/pricing');
  return;
}
```

### Filtering Data by Subscription

```typescript
import { filterDataBySubscription } from '@/utils/subscriptionHelpers';

// Show advanced analytics only to Professional+ users
const analyticsData = filterDataBySubscription(
  allAnalytics,
  subscriptionInfo,
  'advanced'
);
```

---

## Upgrade Flow

1. **User hits limit** → Show error message
2. **Prompt to upgrade** → Display upgrade button
3. **Redirect to pricing** → `/pricing` page
4. **Select plan** → Stripe checkout
5. **Payment success** → Subscription activated
6. **Limits updated** → User can now access more features

---

## Testing

### Test Scenarios

1. **Free Tier Merchant**
   - Can select 2 couriers
   - Cannot add 3rd courier
   - Sees upgrade prompts

2. **Professional Merchant**
   - Can select 20 couriers
   - Has API access
   - Has advanced analytics

3. **Enterprise Merchant**
   - Unlimited couriers
   - All features unlocked
   - No upgrade prompts

### SQL Test Queries

```sql
-- Test subscription limits
SELECT * FROM get_user_subscription_limits('merchant-uuid');

-- Test courier selection limit
SELECT check_courier_selection_limit('merchant-uuid');

-- Test adding courier (should fail if limit reached)
INSERT INTO merchant_courier_selections (merchant_id, courier_id)
VALUES ('merchant-uuid', 'courier-uuid');
```

---

## Maintenance

### Monthly Usage Reset

Run this SQL function at the start of each month:

```sql
SELECT reset_monthly_usage();
```

**Recommended:** Set up a cron job or scheduled task.

### Monitoring

Track these metrics:
- Subscription conversion rate
- Average revenue per user (ARPU)
- Churn rate
- Feature usage by tier
- Upgrade triggers (what causes users to upgrade)

---

## Future Enhancements

### Planned Features

1. **Add-ons System**
   - Extra courier slots ($10/month each)
   - Extra market access ($15/month each)
   - Postal code insights ($25/month)
   - Competitor data ($49/month)

2. **Usage Alerts**
   - Email when 80% of limit reached
   - In-app notifications
   - Automatic upgrade suggestions

3. **Team Subscriptions**
   - Multiple users per subscription
   - Role-based access within team
   - Shared limits across team

4. **Annual Discounts**
   - 2 months free on annual plans
   - Better shown in pricing page

---

## Support

For subscription-related issues:
- Check database: `user_subscriptions` table
- Check Stripe dashboard for payment issues
- Verify subscription status: `status = 'active'`
- Check usage counters are resetting properly

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Maintained by:** Performile Development Team
