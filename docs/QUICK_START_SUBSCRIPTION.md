# Quick Start: Subscription System

## 🚀 Getting Started in 5 Minutes

### Step 1: Run Database Migration

```bash
# Connect to your database
psql -U your_user -d your_database

# Run the subscription system migration
\i database/merchant-courier-selection-with-limits.sql
```

This creates:
- `merchant_courier_selections` table
- Subscription limit checking functions
- Automatic enforcement triggers
- Helper views and functions

### Step 2: Verify Database Setup

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('merchant_courier_selections', 'subscription_plans', 'user_subscriptions');

-- Check if functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('get_user_subscription_limits', 'check_courier_selection_limit');

-- Test with a merchant user
SELECT get_merchant_subscription_info('your-merchant-uuid-here');
```

### Step 3: Add Route to Your App

In your main router file (e.g., `App.tsx` or `routes.tsx`):

```typescript
import { MerchantCourierSettings } from '@/pages/settings/MerchantCourierSettings';

// Add this route
<Route 
  path="/settings/couriers" 
  element={<MerchantCourierSettings />} 
/>
```

### Step 4: Test the Feature

1. **Login as a merchant:**
   - Email: `merchant@performile.com`
   - Password: `admin123`

2. **Navigate to:**
   - `/settings/couriers`

3. **You should see:**
   - Subscription status card (showing Free tier with 2 courier limit)
   - List of available couriers with logos
   - "Add Courier" button
   - Usage indicator (e.g., "0 / 2 couriers selected")

4. **Try adding couriers:**
   - Click "Add Courier"
   - Select 2 couriers (should work)
   - Try adding a 3rd courier (should show upgrade prompt)

### Step 5: Verify API Endpoints

```bash
# Get subscription info
curl -X POST http://localhost:5173/api/couriers/merchant-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_subscription_info"}'

# Get available couriers
curl -X POST http://localhost:5173/api/couriers/merchant-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_available_couriers"}'
```

---

## 📋 What You Get

### For Merchants:
- **Courier Selection Page** with subscription limits
- **Visual Progress Bars** showing usage
- **Courier Logos** from 44+ courier companies
- **Custom Courier Names** for branding
- **Drag & Drop Reordering**
- **Enable/Disable** without removing
- **Automatic Upgrade Prompts** when limits reached

### For Developers:
- **Reusable Components:**
  - `<SubscriptionGate>` - Gate features by tier
  - `<SubscriptionBadge>` - Show current plan
  - `<FeatureLockedAlert>` - Inline upgrade prompts

- **Helper Functions:**
  - `canAccessFeature()` - Check feature access
  - `hasReachedLimit()` - Check if limit reached
  - `getUsagePercentage()` - Calculate usage %
  - `filterDataBySubscription()` - Filter data by tier

- **Database Functions:**
  - `get_user_subscription_limits()` - Get limits
  - `check_courier_selection_limit()` - Validate limits
  - `get_merchant_subscription_info()` - Complete info

---

## 🎨 Customization

### Change Subscription Limits

Edit the database:

```sql
-- Update merchant starter plan to allow 10 couriers instead of 5
UPDATE subscription_plans 
SET max_couriers = 10 
WHERE plan_slug = 'merchant-starter';
```

### Add New Courier Logos

1. Add logo to `/frontend/public/courier-logos/`
2. Name it: `{courier_name}_logo.jpeg` (lowercase, underscores)
3. Example: `dhl_logo.jpeg`, `fedex_logo.jpeg`

### Customize Upgrade Prompts

In `SubscriptionGate.tsx`, modify the upgrade prompt UI:

```typescript
<Typography variant="h5" fontWeight={600} gutterBottom>
  Your Custom Message Here
</Typography>
```

---

## 🧪 Testing Different Tiers

### Create Test Subscriptions

```sql
-- Give merchant a Professional subscription
INSERT INTO user_subscriptions (user_id, plan_id, status)
SELECT 
  'your-merchant-uuid',
  plan_id,
  'active'
FROM subscription_plans 
WHERE plan_slug = 'merchant-professional';

-- Give merchant an Enterprise subscription
UPDATE user_subscriptions 
SET plan_id = (SELECT plan_id FROM subscription_plans WHERE plan_slug = 'merchant-enterprise')
WHERE user_id = 'your-merchant-uuid';
```

### Test Scenarios

1. **Free Tier (Default):**
   - Can select 2 couriers
   - Cannot add 3rd courier
   - Sees upgrade prompts

2. **Starter Tier:**
   - Can select 5 couriers
   - Basic features only
   - Some upgrade prompts

3. **Professional Tier:**
   - Can select 20 couriers
   - Advanced analytics
   - API access
   - Few upgrade prompts

4. **Enterprise Tier:**
   - Unlimited couriers
   - All features
   - No upgrade prompts

---

## 🔧 Troubleshooting

### Issue: "Cannot read property 'subscription' of null"

**Cause:** Subscription info not loaded

**Fix:**
```typescript
// Add loading state
if (!subscriptionInfo) {
  return <CircularProgress />;
}
```

### Issue: Courier logos not showing

**Cause:** Logo file not found or wrong naming

**Fix:**
1. Check file exists: `/frontend/public/courier-logos/postnord_logo.jpeg`
2. Check naming: lowercase with underscores
3. Add fallback in code:

```typescript
<Avatar 
  src={getCourierLogo(courierName)}
  imgProps={{
    onError: (e: any) => {
      e.target.src = '/fallback-logo.png';
    }
  }}
/>
```

### Issue: Limits not enforced

**Cause:** Trigger not created or disabled

**Fix:**
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'trg_enforce_courier_limit';

-- Recreate trigger if missing
-- (Run the migration script again)
```

### Issue: API returns 401 Unauthorized

**Cause:** Token not sent or expired

**Fix:**
```typescript
// Ensure token is included
const token = localStorage.getItem('token');
axios.post('/api/couriers/merchant-preferences', 
  { action: 'get_subscription_info' },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 📚 Next Steps

1. **Integrate with other pages:**
   - See [SUBSCRIPTION_INTEGRATION_GUIDE.md](./SUBSCRIPTION_INTEGRATION_GUIDE.md)
   - Add subscription gates to Analytics, Dashboard, Orders pages

2. **Set up Stripe integration:**
   - Connect Stripe for payments
   - Handle subscription webhooks
   - Auto-update subscription status

3. **Monitor usage:**
   - Track conversion rates
   - Monitor which features drive upgrades
   - Optimize pricing based on data

4. **Add more features:**
   - Email notifications when limit reached
   - Usage analytics dashboard
   - Subscription management page

---

## 📖 Full Documentation

- **[SUBSCRIPTION_SYSTEM.md](./SUBSCRIPTION_SYSTEM.md)** - Complete system documentation
- **[SUBSCRIPTION_INTEGRATION_GUIDE.md](./SUBSCRIPTION_INTEGRATION_GUIDE.md)** - Integration examples
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history

---

## ✅ Checklist

- [ ] Database migration completed
- [ ] API endpoints working
- [ ] Frontend route added
- [ ] Can view courier settings page
- [ ] Can add/remove couriers
- [ ] Limits are enforced
- [ ] Upgrade prompts appear
- [ ] Courier logos display correctly
- [ ] Tested with different subscription tiers

---

**Need Help?** Check the troubleshooting section above or review the full documentation.

**Version:** 1.0  
**Last Updated:** October 12, 2025
