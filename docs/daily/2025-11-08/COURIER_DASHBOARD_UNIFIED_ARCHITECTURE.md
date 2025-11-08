# 🎯 COURIER DASHBOARD - UNIFIED ARCHITECTURE

**Date:** November 8, 2025, 11:20 PM
**Critical Clarification:** "The courier dashboard should be the same as courier@performile.com limited according to subscription and userrole"

---

## 🎯 **THE KEY INSIGHT**

**ALL couriers use the SAME dashboard:**
- PostNord courier user → Same dashboard
- Independent courier user → Same dashboard
- courier@performile.com test user → Same dashboard

**What differs:**
1. **Data shown** - Filtered by their `courier_id`
2. **Subscription limits** - What features they can access
3. **Analytics depth** - Based on subscription tier
4. **Anonymization** - Competitor data is anonymized

---

## 🏗️ **REVISED ARCHITECTURE**

### **Courier Types:**

**Type 1: Platform Courier with User Account**
```
PostNord Company (courier record)
    ↓
PostNord User (user account, role='courier')
    ↓
Links to courier_id
    ↓
Accesses Courier Dashboard
    ↓
Sees PostNord's data only
```

**Type 2: Independent Courier with User Account**
```
John's Delivery (courier record)
    ↓
John User (user account, role='courier')
    ↓
Links to courier_id
    ↓
Accesses Courier Dashboard
    ↓
Sees John's Delivery data only
```

**Both use the EXACT SAME dashboard component!**

---

## 📊 **DATABASE STRUCTURE (REVISED)**

### **Couriers Table:**

```sql
CREATE TABLE couriers (
  courier_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),  -- ⚠️ REQUIRED for dashboard access
  courier_name VARCHAR(255) NOT NULL,
  courier_type VARCHAR(20) DEFAULT 'platform',  -- 'platform' or 'independent'
  courier_code VARCHAR(50) UNIQUE,
  
  -- Subscription
  subscription_plan_id INTEGER REFERENCES subscription_plans(plan_id),
  subscription_status VARCHAR(20) DEFAULT 'active',
  
  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Business
  logo_url TEXT,
  description TEXT,
  service_types TEXT[],
  coverage_countries TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_platform_courier BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ⚠️ EVERY courier MUST have user_id for dashboard access
  CONSTRAINT couriers_user_id_required CHECK (user_id IS NOT NULL)
);
```

**Key Change:** `user_id` is **REQUIRED** for all couriers (platform and independent).

---

## 🔄 **HOW IT WORKS**

### **Platform Courier Setup (PostNord):**

**Step 1: Admin creates courier record**
```sql
INSERT INTO couriers (
  courier_name,
  courier_code,
  courier_type,
  is_platform_courier,
  user_id  -- ⚠️ NULL initially
) VALUES
('PostNord', 'POSTNORD', 'platform', true, NULL);
```

**Step 2: PostNord employee registers**
```typescript
// PostNord employee registers with email: postnord-admin@postnord.com
// Role: courier
// During registration:

// Find existing PostNord courier record
const existingCourier = await supabase
  .from('couriers')
  .select('*')
  .eq('courier_code', 'POSTNORD')
  .single();

if (existingCourier && !existingCourier.user_id) {
  // Link user to existing courier record
  await supabase
    .from('couriers')
    .update({ user_id: newUser.id })
    .eq('courier_id', existingCourier.courier_id);
} else {
  // Create new independent courier record
  await supabase
    .from('couriers')
    .insert({
      user_id: newUser.id,
      courier_name: `${first_name} ${last_name} Courier`,
      courier_type: 'independent'
    });
}
```

**Step 3: PostNord user accesses dashboard**
```typescript
// Login as postnord-admin@postnord.com
// Navigate to /courier/dashboard

// Dashboard fetches data filtered by courier_id
const { data: courier } = await supabase
  .from('couriers')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Show PostNord's data
const orders = await supabase
  .from('orders')
  .select('*')
  .eq('courier_id', courier.courier_id);  // Only PostNord's orders
```

---

## 🎨 **UNIFIED COURIER DASHBOARD**

### **Component: CourierDashboard.tsx**

```tsx
// apps/web/src/pages/courier/CourierDashboard.tsx

export const CourierDashboard = () => {
  const { user } = useAuthStore();
  const [courier, setCourier] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    // Get courier record for this user
    const fetchCourier = async () => {
      const { data } = await supabase
        .from('couriers')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .single();
      
      setCourier(data);
      setSubscription(data.subscription_plans);
    };
    
    fetchCourier();
  }, [user.id]);
  
  if (!courier) {
    return <Loading />;
  }
  
  return (
    <Box>
      <Typography variant="h4">
        {courier.courier_name} Dashboard
      </Typography>
      
      {/* Subscription Badge */}
      <Chip 
        label={subscription?.plan_name || 'Free'} 
        color={subscription?.tier >= 2 ? 'primary' : 'default'}
      />
      
      {/* Key Metrics - Always visible */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Orders"
            value={courier.total_orders}
            icon={<PackageIcon />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Completion Rate"
            value={`${courier.completion_rate}%`}
            icon={<CheckCircleIcon />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Avg Rating"
            value={courier.avg_rating}
            icon={<StarIcon />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="TrustScore"
            value={courier.trust_score}
            icon={<TrustScoreIcon />}
          />
        </Grid>
      </Grid>
      
      {/* Recent Orders - Always visible */}
      <RecentOrdersTable courierId={courier.courier_id} />
      
      {/* Advanced Analytics - Subscription gated */}
      {subscription?.tier >= 2 && (
        <>
          <PerformanceTrendsChart courierId={courier.courier_id} />
          <GeographicHeatmap courierId={courier.courier_id} />
        </>
      )}
      
      {/* Competitor Analytics - Subscription gated + Anonymized */}
      {subscription?.tier >= 3 && (
        <CompetitorAnalytics 
          courierId={courier.courier_id}
          anonymized={true}  // Always anonymized
        />
      )}
      
      {/* Upgrade prompt for locked features */}
      {subscription?.tier < 3 && (
        <UpgradePrompt
          currentPlan={subscription?.plan_name}
          lockedFeatures={['Advanced Analytics', 'Competitor Insights']}
        />
      )}
    </Box>
  );
};
```

---

## 🔒 **DATA FILTERING BY COURIER_ID**

### **All queries filter by courier_id:**

```typescript
// Orders
const orders = await supabase
  .from('orders')
  .select('*')
  .eq('courier_id', courier.courier_id);  // Only this courier's orders

// Reviews
const reviews = await supabase
  .from('reviews')
  .select('*')
  .eq('courier_id', courier.courier_id);  // Only reviews about this courier

// Analytics
const analytics = await supabase
  .from('courier_analytics')
  .select('*')
  .eq('courier_id', courier.courier_id);  // Only this courier's analytics

// Performance
const performance = await supabase
  .from('service_performance')
  .select('*')
  .eq('courier_id', courier.courier_id);  // Only this courier's performance
```

---

## 📊 **SUBSCRIPTION-BASED FEATURES**

### **Tier 0: Free (Default)**

**What they see:**
- ✅ Basic metrics (total orders, completion rate, avg rating)
- ✅ Recent orders list (last 10)
- ✅ Basic profile settings
- ❌ No analytics charts
- ❌ No competitor data
- ❌ No advanced features

### **Tier 1: Starter ($29/month)**

**What they see:**
- ✅ All Free features
- ✅ Performance trends chart (30 days)
- ✅ Order history (unlimited)
- ✅ Customer reviews
- ❌ No competitor data
- ❌ No geographic heatmap

### **Tier 2: Professional ($99/month)**

**What they see:**
- ✅ All Starter features
- ✅ Advanced analytics (90 days)
- ✅ Geographic heatmap
- ✅ Service performance breakdown
- ✅ Anonymized competitor data (top 5 competitors)
- ❌ No detailed competitor insights

### **Tier 3: Enterprise ($299/month)**

**What they see:**
- ✅ All Professional features
- ✅ Full analytics (unlimited history)
- ✅ Detailed competitor insights (anonymized)
- ✅ Market share analysis
- ✅ Predictive analytics
- ✅ API access
- ✅ Custom reports

---

## 🎭 **ANONYMIZED COMPETITOR DATA**

### **What Couriers See:**

```tsx
// Competitor Analytics Component
<CompetitorAnalytics courierId={courier.courier_id}>
  <Typography variant="h6">Market Position</Typography>
  
  {/* Anonymized competitor data */}
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Rank</TableCell>
        <TableCell>Courier</TableCell>
        <TableCell>TrustScore</TableCell>
        <TableCell>Completion Rate</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>1</TableCell>
        <TableCell>You</TableCell>  {/* Your actual name */}
        <TableCell>92</TableCell>
        <TableCell>98%</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>2</TableCell>
        <TableCell>Competitor A</TableCell>  {/* Anonymized */}
        <TableCell>90</TableCell>
        <TableCell>97%</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>3</TableCell>
        <TableCell>Competitor B</TableCell>  {/* Anonymized */}
        <TableCell>88</TableCell>
        <TableCell>96%</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</CompetitorAnalytics>
```

### **API Implementation:**

```typescript
// api/courier/competitor-analytics.ts

export default async function handler(req: Request, res: Response) {
  const { user } = await validateAuth(req);
  
  // Verify role
  if (user.role !== 'courier') {
    return res.status(403).json({ error: 'Courier access required' });
  }
  
  // Get courier record
  const { data: courier } = await supabase
    .from('couriers')
    .select('*, subscription_plans (*)')
    .eq('user_id', user.id)
    .single();
  
  // Check subscription tier
  if (courier.subscription_plans.tier < 2) {
    return res.status(403).json({ 
      error: 'Upgrade required',
      message: 'Competitor analytics requires Professional plan or higher'
    });
  }
  
  // Get competitor data (anonymized)
  const { data: competitors } = await supabase
    .from('courier_analytics')
    .select('courier_id, trust_score, completion_rate, avg_rating')
    .order('trust_score', { ascending: false })
    .limit(10);
  
  // Anonymize competitor names
  const anonymized = competitors.map((comp, index) => ({
    rank: index + 1,
    courier_name: comp.courier_id === courier.courier_id 
      ? courier.courier_name  // Show real name for self
      : `Competitor ${String.fromCharCode(65 + index)}`,  // A, B, C, etc.
    trust_score: comp.trust_score,
    completion_rate: comp.completion_rate,
    avg_rating: comp.avg_rating,
    is_you: comp.courier_id === courier.courier_id
  }));
  
  return res.status(200).json({
    success: true,
    data: anonymized
  });
}
```

---

## 🔐 **RLS POLICIES (UPDATED)**

### **Couriers can only see their own data:**

```sql
-- Orders: Courier sees only their orders
CREATE POLICY courier_orders_select ON orders
FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'role' = 'courier'
  AND courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- Reviews: Courier sees only reviews about them
CREATE POLICY courier_reviews_select ON reviews
FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'role' = 'courier'
  AND courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- Analytics: Courier sees only their analytics
CREATE POLICY courier_analytics_select ON courier_analytics
FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'role' = 'courier'
  AND courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- Competitor data: Courier sees anonymized competitor data (handled in API)
-- No direct RLS policy - API layer handles anonymization
```

---

## 🎯 **REGISTRATION FLOWS (REVISED)**

### **Flow 1: Platform Courier (PostNord) Claims Account**

```
1. Admin pre-creates PostNord courier record
   INSERT INTO couriers (courier_name, courier_code, courier_type, user_id)
   VALUES ('PostNord', 'POSTNORD', 'platform', NULL);
   
2. PostNord employee visits website
   
3. Clicks "Register as Courier"
   
4. Enters email: postnord-admin@postnord.com
   
5. System checks: Does courier with code 'POSTNORD' exist without user_id?
   
6. If yes: "Claim your company account"
   - Verify email domain matches (@postnord.com)
   - Link user to existing courier record
   
7. If no: Create new independent courier record
   
8. Redirect to courier dashboard
   
9. Dashboard shows PostNord's data (filtered by courier_id)
```

### **Flow 2: Independent Courier Registers**

```
1. User visits website
   
2. Clicks "Register as Courier"
   
3. Enters email: john@johnsdelivery.com
   
4. System checks: No existing courier with this domain
   
5. Auto-create new courier record
   INSERT INTO couriers (user_id, courier_name, courier_type)
   VALUES (user.id, 'John's Delivery', 'independent');
   
6. Redirect to onboarding wizard
   
7. Complete company profile
   
8. Redirect to courier dashboard
   
9. Dashboard shows John's Delivery data (filtered by courier_id)
```

---

## 📋 **SUBSCRIPTION PLANS FOR COURIERS**

### **Courier Subscription Plans:**

```sql
-- Courier-specific subscription plans
INSERT INTO subscription_plans (
  plan_name,
  plan_slug,
  user_type,
  tier,
  monthly_price,
  annual_price,
  features,
  max_orders_per_month
) VALUES
(
  'Courier Free',
  'courier-free',
  'courier',
  0,
  0,
  0,
  '["Basic metrics", "Recent orders (10)", "Profile settings"]'::jsonb,
  100
),
(
  'Courier Starter',
  'courier-starter',
  'courier',
  1,
  29,
  290,
  '["All Free features", "Performance trends", "Unlimited order history", "Customer reviews"]'::jsonb,
  500
),
(
  'Courier Professional',
  'courier-professional',
  'courier',
  2,
  99,
  990,
  '["All Starter features", "Advanced analytics", "Geographic heatmap", "Anonymized competitor data"]'::jsonb,
  2000
),
(
  'Courier Enterprise',
  'courier-enterprise',
  'courier',
  3,
  299,
  2990,
  '["All Professional features", "Full analytics", "Detailed competitor insights", "Market share analysis", "API access"]'::jsonb,
  -1  -- Unlimited
);
```

---

## 🔧 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database (30 min)**

- [ ] Keep `user_id` as REQUIRED in couriers table
- [ ] Add `subscription_plan_id` to couriers table
- [ ] Add `subscription_status` to couriers table
- [ ] Create courier subscription plans
- [ ] Update RLS policies for courier data access

```sql
ALTER TABLE couriers
ADD COLUMN IF NOT EXISTS subscription_plan_id INTEGER REFERENCES subscription_plans(plan_id),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active';

-- Set default free plan for existing couriers
UPDATE couriers
SET subscription_plan_id = (
  SELECT plan_id FROM subscription_plans 
  WHERE plan_slug = 'courier-free' 
  LIMIT 1
)
WHERE subscription_plan_id IS NULL;
```

### **Phase 2: Registration Logic (1 hour)**

- [ ] Modify registration API
- [ ] Check for existing courier by email domain
- [ ] Link to existing courier if platform courier
- [ ] Create new courier if independent
- [ ] Assign default free subscription

### **Phase 3: Courier Dashboard (2 hours)**

- [ ] Create unified CourierDashboard.tsx
- [ ] Fetch courier data by user_id
- [ ] Filter all queries by courier_id
- [ ] Implement subscription-gated features
- [ ] Add upgrade prompts for locked features

### **Phase 4: Competitor Analytics (1 hour)**

- [ ] Create competitor analytics API
- [ ] Implement anonymization logic
- [ ] Add subscription tier check
- [ ] Create CompetitorAnalytics component

---

## ✅ **BENEFITS OF UNIFIED DASHBOARD**

1. **Single Codebase** - One dashboard for all couriers
2. **Consistent UX** - Same experience for everyone
3. **Easy Maintenance** - Update once, affects all
4. **Fair Competition** - All couriers see same interface
5. **Subscription Upsell** - Clear upgrade path
6. **Data Security** - RLS ensures data isolation
7. **Scalable** - Works for 10 or 10,000 couriers

---

## 🎯 **FINAL ARCHITECTURE**

```
User (role='courier')
    ↓
Links to courier record (via user_id)
    ↓
Courier record has courier_id + subscription_plan_id
    ↓
Courier Dashboard (unified component)
    ↓
Fetches data filtered by courier_id
    ↓
Shows features based on subscription tier
    ↓
Anonymizes competitor data
    ↓
Enforces RLS policies
```

---

## 📚 **DOCUMENTATION**

**Files created:**
- `docs/daily/2025-11-08/COURIER_DASHBOARD_UNIFIED_ARCHITECTURE.md` (this file)
- `docs/daily/2025-11-08/COURIER_ARCHITECTURE_COMPLETE.md` (previous)
- `docs/daily/2025-11-08/COURIER_REGISTRATION_AND_API_FLOW.md` (previous)

**Status:** Ready to implement unified courier dashboard

---

**Key Takeaway:** ALL couriers (PostNord, independent, test users) use the SAME dashboard. Data is filtered by `courier_id`, features are gated by subscription tier, and competitor data is anonymized. 🚀
