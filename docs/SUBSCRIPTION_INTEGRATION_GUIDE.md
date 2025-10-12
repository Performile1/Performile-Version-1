# Subscription Integration Guide

This guide shows how to integrate subscription-based access control across different pages in the Performile platform.

**Last Updated:** October 12, 2025

---

## Quick Start

### 1. Import Required Utilities

```typescript
import { SubscriptionGate, FeatureLockedAlert } from '@/components/SubscriptionGate';
import { 
  canAccessFeature, 
  filterDataBySubscription,
  getUsagePercentage,
  getUsageColor 
} from '@/utils/subscriptionHelpers';
import type { SubscriptionInfo } from '@/utils/subscriptionHelpers';
```

### 2. Fetch Subscription Info

```typescript
const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

useEffect(() => {
  fetchSubscriptionInfo();
}, []);

const fetchSubscriptionInfo = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      '/api/couriers/merchant-preferences',
      { action: 'get_subscription_info' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSubscriptionInfo(response.data.data);
  } catch (error) {
    console.error('Error fetching subscription info:', error);
  }
};
```

---

## Page-by-Page Integration

### Analytics Page

**Location:** `/frontend/src/pages/Analytics.tsx`

**What to Restrict:**
- Advanced analytics (Professional+)
- Competitor data (Professional+)
- Postal code insights (Professional+)
- Export functionality (Professional+)

**Implementation:**

```typescript
import { SubscriptionGate, FeatureLockedAlert } from '@/components/SubscriptionGate';

export const Analytics: React.FC = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  // ... fetch subscription info ...

  return (
    <Container>
      {/* Basic Analytics - Available to all */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Overview</Typography>
        <BasicAnalyticsChart data={basicData} />
      </Paper>

      {/* Advanced Analytics - Professional+ only */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredTier="professional"
        featureName="Advanced Analytics"
      >
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">Advanced Insights</Typography>
          <AdvancedAnalyticsChart data={advancedData} />
        </Paper>
      </SubscriptionGate>

      {/* Competitor Data - Professional+ only */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredFeature="has_advanced_analytics"
        featureName="Competitor Insights"
      >
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">Competitor Analysis</Typography>
          <CompetitorDataTable data={competitorData} />
        </Paper>
      </SubscriptionGate>

      {/* Export Button - Professional+ only */}
      {canAccessFeature(subscriptionInfo, 'has_advanced_analytics') ? (
        <Button startIcon={<Download />} onClick={handleExport}>
          Export Data
        </Button>
      ) : (
        <FeatureLockedAlert 
          featureName="Data Export" 
          requiredTier="Professional"
        />
      )}
    </Container>
  );
};
```

### Dashboard Page

**Location:** `/frontend/src/pages/Dashboard.tsx`

**What to Show Based on Tier:**
- Free: Basic stats, limited data
- Starter: More detailed stats
- Professional: Real-time data, advanced widgets
- Enterprise: Custom dashboards, all features

**Implementation:**

```typescript
export const Dashboard: React.FC = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  // Filter widgets based on subscription
  const visibleWidgets = React.useMemo(() => {
    if (!subscriptionInfo) return basicWidgets;

    const { tier } = subscriptionInfo.subscription;

    if (tier >= 3) return [...basicWidgets, ...advancedWidgets, ...enterpriseWidgets];
    if (tier >= 2) return [...basicWidgets, ...advancedWidgets];
    if (tier >= 1) return [...basicWidgets, ...starterWidgets];
    return basicWidgets;
  }, [subscriptionInfo]);

  return (
    <Container>
      {/* Subscription Status Banner */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {subscriptionInfo?.subscription.plan_name || 'Free'} Plan
          </Typography>
          {subscriptionInfo?.subscription.tier < 2 && (
            <Button 
              variant="contained" 
              sx={{ bgcolor: 'white', color: 'primary.main' }}
              onClick={() => navigate('/pricing')}
            >
              Upgrade
            </Button>
          )}
        </Box>
      </Paper>

      {/* Render widgets */}
      <Grid container spacing={3}>
        {visibleWidgets.map((widget) => (
          <Grid item xs={12} md={widget.size} key={widget.id}>
            {widget.component}
          </Grid>
        ))}
      </Grid>

      {/* Locked widgets preview */}
      {subscriptionInfo?.subscription.tier < 2 && (
        <SubscriptionGate
          subscriptionInfo={subscriptionInfo}
          requiredTier="professional"
          featureName="Advanced Dashboard Widgets"
        >
          <div /> {/* This won't render, will show upgrade prompt */}
        </SubscriptionGate>
      )}
    </Container>
  );
};
```

### Orders Page

**Location:** `/frontend/src/pages/Orders.tsx`

**What to Restrict:**
- Number of orders displayed (based on monthly limit)
- Advanced filters (Professional+)
- Bulk actions (Professional+)
- Export orders (Professional+)

**Implementation:**

```typescript
export const Orders: React.FC = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filter orders based on subscription
  const displayedOrders = React.useMemo(() => {
    if (!subscriptionInfo) return orders.slice(0, 10);

    const { max_orders_per_month } = subscriptionInfo.subscription;
    
    // Show all orders if unlimited or within limit
    if (max_orders_per_month === null) return orders;
    
    return orders.slice(0, max_orders_per_month);
  }, [orders, subscriptionInfo]);

  return (
    <Container>
      {/* Order limit warning */}
      {subscriptionInfo && subscriptionInfo.subscription.max_orders_per_month !== null && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing {displayedOrders.length} of {orders.length} orders 
          (Limit: {subscriptionInfo.subscription.max_orders_per_month}/month)
          {orders.length > displayedOrders.length && (
            <Button size="small" onClick={() => navigate('/pricing')} sx={{ ml: 1 }}>
              Upgrade to see all
            </Button>
          )}
        </Alert>
      )}

      {/* Advanced Filters - Professional+ */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredTier="professional"
        showUpgradePrompt={false}
      >
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Advanced Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField label="Postal Code" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Courier" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Status" fullWidth size="small" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Date Range" fullWidth size="small" />
            </Grid>
          </Grid>
        </Paper>
      </SubscriptionGate>

      {/* Orders Table */}
      <OrdersTable orders={displayedOrders} />

      {/* Bulk Actions - Professional+ */}
      {canAccessFeature(subscriptionInfo, 'has_advanced_analytics') && (
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<Download />}>Export Selected</Button>
          <Button startIcon={<Email />}>Send Bulk Email</Button>
        </Box>
      )}
    </Container>
  );
};
```

### Settings Page

**Location:** `/frontend/src/pages/Settings.tsx`

**What to Show:**
- API Key section (Professional+ only)
- Custom templates (Professional+ only)
- White label settings (Enterprise only)
- Team management (based on team member limit)

**Implementation:**

```typescript
export const Settings: React.FC = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      {/* Basic Settings - All users */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Profile Settings</Typography>
        <ProfileSettingsForm />
      </Paper>

      {/* API Access - Professional+ */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredFeature="has_api_access"
        featureName="API Access"
      >
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>API Settings</Typography>
          <APIKeySection />
        </Paper>
      </SubscriptionGate>

      {/* Custom Templates - Professional+ */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredFeature="has_custom_templates"
        featureName="Custom Email Templates"
      >
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Email Templates</Typography>
          <EmailTemplateEditor />
        </Paper>
      </SubscriptionGate>

      {/* White Label - Enterprise only */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredFeature="has_white_label"
        featureName="White Label Settings"
      >
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>White Label</Typography>
          <WhiteLabelSettings />
        </Paper>
      </SubscriptionGate>
    </Container>
  );
};
```

### Courier Directory (for Couriers)

**Location:** `/frontend/src/pages/courier/CourierDirectory.tsx`

**What to Restrict:**
- Number of markets visible
- Detailed competitor data
- Lead marketplace access

**Implementation:**

```typescript
export const CourierDirectory: React.FC = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);

  // Filter markets based on subscription
  const visibleMarkets = React.useMemo(() => {
    if (!subscriptionInfo) return markets.slice(0, 1);

    const { tier } = subscriptionInfo.subscription;
    
    // Courier tiers: 0=Free, 1=Individual, 2=Professional, 3=Fleet
    if (tier >= 3) return markets; // Unlimited
    if (tier >= 2) return markets.slice(0, 4);
    if (tier >= 1) return markets.slice(0, 1);
    return markets.slice(0, 1);
  }, [markets, subscriptionInfo]);

  return (
    <Container>
      {/* Market limit indicator */}
      {subscriptionInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Viewing {visibleMarkets.length} of {markets.length} markets
          {markets.length > visibleMarkets.length && (
            <Button size="small" onClick={() => navigate('/pricing')} sx={{ ml: 1 }}>
              Upgrade to see all markets
            </Button>
          )}
        </Alert>
      )}

      {/* Markets Grid */}
      <Grid container spacing={3}>
        {visibleMarkets.map((market) => (
          <Grid item xs={12} md={6} key={market.id}>
            <MarketCard market={market} />
          </Grid>
        ))}
      </Grid>

      {/* Lead Marketplace - Professional+ */}
      <SubscriptionGate
        subscriptionInfo={subscriptionInfo}
        requiredTier="professional"
        featureName="Lead Marketplace"
      >
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Available Leads</Typography>
          <LeadsMarketplace />
        </Paper>
      </SubscriptionGate>
    </Container>
  );
};
```

---

## Common Patterns

### Pattern 1: Inline Feature Check

```typescript
{canAccessFeature(subscriptionInfo, 'has_api_access') ? (
  <APIKeySection />
) : (
  <FeatureLockedAlert featureName="API Access" />
)}
```

### Pattern 2: Full Section Gate

```typescript
<SubscriptionGate
  subscriptionInfo={subscriptionInfo}
  requiredTier="professional"
  featureName="Advanced Analytics"
>
  <AdvancedAnalyticsSection />
</SubscriptionGate>
```

### Pattern 3: Data Filtering

```typescript
const visibleData = filterDataBySubscription(
  allData,
  subscriptionInfo,
  'advanced' // 'basic' | 'advanced' | 'premium'
);
```

### Pattern 4: Usage Indicator

```typescript
<Box sx={{ mb: 2 }}>
  <Typography variant="body2" color="text.secondary">
    Couriers: {couriersSelected} / {formatLimit(maxCouriers)}
  </Typography>
  <LinearProgress 
    variant="determinate" 
    value={getUsagePercentage(couriersSelected, maxCouriers)}
    color={getUsageColor(couriersSelected, maxCouriers)}
  />
</Box>
```

### Pattern 5: Conditional Button

```typescript
<Button
  onClick={handleAction}
  disabled={!canAccessFeature(subscriptionInfo, 'has_api_access')}
  startIcon={!canAccessFeature(subscriptionInfo, 'has_api_access') ? <Lock /> : <Check />}
>
  {canAccessFeature(subscriptionInfo, 'has_api_access') 
    ? 'Generate API Key' 
    : 'Upgrade to Generate API Key'}
</Button>
```

---

## Testing Checklist

### For Each Page:

- [ ] Free tier users see basic features only
- [ ] Upgrade prompts appear for locked features
- [ ] Professional users see advanced features
- [ ] Enterprise users see all features
- [ ] Usage limits are enforced
- [ ] Error messages are clear
- [ ] Upgrade buttons navigate to `/pricing`
- [ ] No console errors when accessing locked features

### Test User Accounts:

Create test accounts for each tier:
```sql
-- Free tier merchant (no subscription)
-- Starter tier merchant (tier 1)
-- Professional tier merchant (tier 2)
-- Enterprise tier merchant (tier 3)
```

---

## Best Practices

1. **Always fetch subscription info on page load**
   ```typescript
   useEffect(() => {
     fetchSubscriptionInfo();
   }, []);
   ```

2. **Show clear upgrade paths**
   - Include "Upgrade" buttons near locked features
   - Explain what the user will get by upgrading
   - Make pricing page easily accessible

3. **Graceful degradation**
   - Don't break the UI if subscription info fails to load
   - Show basic features by default
   - Log errors but don't crash

4. **Visual indicators**
   - Use badges to show current plan
   - Use progress bars for usage limits
   - Use lock icons for locked features

5. **Performance**
   - Cache subscription info in state
   - Don't fetch on every component mount
   - Use React.useMemo for filtered data

---

## Troubleshooting

### Issue: Subscription info not loading

**Solution:**
```typescript
// Add error handling
const fetchSubscriptionInfo = async () => {
  try {
    const response = await axios.post(...);
    setSubscriptionInfo(response.data.data);
  } catch (error) {
    console.error('Error:', error);
    // Set default free tier
    setSubscriptionInfo({
      subscription: {
        plan_name: 'Free',
        tier: 0,
        max_couriers: 2,
        // ... other defaults
      },
      usage: {
        couriers_selected: 0,
        shops_created: 0,
        can_add_courier: true,
      }
    });
  }
};
```

### Issue: User can bypass limits in UI

**Solution:** Always enforce limits on the backend. UI checks are for UX only.

```typescript
// Backend enforcement in API
if (!check_courier_selection_limit(userId)) {
  return res.status(403).json({ error: 'Limit reached' });
}
```

### Issue: Upgrade prompts too aggressive

**Solution:** Use `showUpgradePrompt={false}` for less critical features.

```typescript
<SubscriptionGate
  subscriptionInfo={subscriptionInfo}
  requiredTier="professional"
  showUpgradePrompt={false} // Just hide, don't prompt
>
  <OptionalFeature />
</SubscriptionGate>
```

---

## Next Steps

1. **Run the database migration:**
   ```sql
   \i database/merchant-courier-selection-with-limits.sql
   ```

2. **Test the API endpoints:**
   ```bash
   curl -X POST http://localhost:3000/api/couriers/merchant-preferences \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action": "get_subscription_info"}'
   ```

3. **Update your routes:**
   ```typescript
   <Route path="/settings/couriers" element={<MerchantCourierSettings />} />
   ```

4. **Test with different subscription tiers**

5. **Monitor usage and conversion rates**

---

**Questions?** Check the main [SUBSCRIPTION_SYSTEM.md](./SUBSCRIPTION_SYSTEM.md) documentation.
