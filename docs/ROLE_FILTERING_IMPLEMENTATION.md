# Role-Based Data Filtering Implementation Guide

## 🎯 Purpose

This guide provides exact code implementations for filtering data by user role across all views.

**Last Updated:** October 12, 2025

---

## 🔧 Backend API Filtering

### Pattern 1: Dashboard Endpoints

#### Create Role-Specific Endpoints

**File:** `api/merchant/dashboard.ts`
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'merchant') {
    return res.status(403).json({ error: 'Merchants only' });
  }

  const merchantId = user.userId;

  // Get merchant's shops
  const shops = await db.query(
    'SELECT * FROM shops WHERE owner_user_id = $1',
    [merchantId]
  );

  // Get orders from merchant's shops only
  const orders = await db.query(
    `SELECT o.* FROM orders o
     JOIN shops s ON o.shop_id = s.shop_id
     WHERE s.owner_user_id = $1
     ORDER BY o.created_at DESC
     LIMIT 10`,
    [merchantId]
  );

  // Get merchant's selected couriers only
  const couriers = await db.query(
    `SELECT c.* FROM couriers c
     JOIN merchant_courier_selections mcs ON c.courier_id = mcs.courier_id
     WHERE mcs.merchant_id = $1 AND mcs.is_active = true`,
    [merchantId]
  );

  // Calculate merchant-specific stats
  const stats = await db.query(
    `SELECT 
       COUNT(DISTINCT o.order_id) as total_orders,
       SUM(o.total_amount) as total_revenue,
       COUNT(DISTINCT s.shop_id) as total_shops,
       COUNT(DISTINCT mcs.courier_id) as selected_couriers
     FROM shops s
     LEFT JOIN orders o ON s.shop_id = o.shop_id
     LEFT JOIN merchant_courier_selections mcs ON s.owner_user_id = mcs.merchant_id
     WHERE s.owner_user_id = $1`,
    [merchantId]
  );

  return res.json({
    success: true,
    data: {
      shops: shops.rows,
      orders: orders.rows,
      couriers: couriers.rows,
      stats: stats.rows[0]
    }
  });
}
```

**File:** `api/courier/dashboard.ts`
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'courier') {
    return res.status(403).json({ error: 'Couriers only' });
  }

  const courierId = user.userId;

  // Get courier's deliveries only
  const deliveries = await db.query(
    `SELECT * FROM orders 
     WHERE courier_id = $1 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [courierId]
  );

  // Get courier's performance stats
  const stats = await db.query(
    `SELECT 
       COUNT(*) as total_deliveries,
       AVG(trust_score) as avg_trust_score,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries,
       AVG(CASE WHEN delivered_on_time THEN 100 ELSE 0 END) as on_time_rate
     FROM orders 
     WHERE courier_id = $1`,
    [courierId]
  );

  // Get courier's team members
  const team = await db.query(
    `SELECT * FROM team_members 
     WHERE courier_id = $1`,
    [courierId]
  );

  return res.json({
    success: true,
    data: {
      deliveries: deliveries.rows,
      stats: stats.rows[0],
      team: team.rows
    }
  });
}
```

**File:** `api/consumer/dashboard.ts`
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'consumer') {
    return res.status(403).json({ error: 'Consumers only' });
  }

  const consumerId = user.userId;

  // Get consumer's orders only
  const orders = await db.query(
    `SELECT * FROM orders 
     WHERE consumer_id = $1 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [consumerId]
  );

  // Get consumer's stats
  const stats = await db.query(
    `SELECT 
       COUNT(*) as total_orders,
       SUM(total_amount) as total_spent,
       COUNT(DISTINCT shop_id) as shops_ordered_from
     FROM orders 
     WHERE consumer_id = $1`,
    [consumerId]
  );

  return res.json({
    success: true,
    data: {
      orders: orders.rows,
      stats: stats.rows[0]
    }
  });
}
```

---

### Pattern 2: Orders Filtering

**File:** `api/orders/index.ts`
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let query = 'SELECT o.*, s.shop_name, c.courier_name FROM orders o';
  query += ' LEFT JOIN shops s ON o.shop_id = s.shop_id';
  query += ' LEFT JOIN couriers c ON o.courier_id = c.courier_id';
  
  const params: any[] = [];
  
  // Role-based filtering
  switch (user.role) {
    case 'merchant':
      query += ' WHERE s.owner_user_id = $1';
      params.push(user.userId);
      break;
      
    case 'courier':
      query += ' WHERE o.courier_id = $1';
      params.push(user.userId);
      break;
      
    case 'consumer':
      query += ' WHERE o.consumer_id = $1';
      params.push(user.userId);
      break;
      
    case 'admin':
      // No filter - admin sees all
      break;
      
    default:
      return res.status(403).json({ error: 'Invalid role' });
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT 100';
  
  const result = await db.query(query, params);
  
  return res.json({
    success: true,
    orders: result.rows
  });
}
```

---

### Pattern 3: Analytics Filtering

**File:** `api/merchant/analytics.ts`
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'merchant') {
    return res.status(403).json({ error: 'Merchants only' });
  }

  const { timeRange, startDate, endDate } = req.query;
  const merchantId = user.userId;

  // Order trends for merchant's shops only
  const orderTrends = await db.query(
    `SELECT 
       DATE(created_at) as date,
       COUNT(*) as order_count,
       SUM(total_amount) as revenue
     FROM orders o
     JOIN shops s ON o.shop_id = s.shop_id
     WHERE s.owner_user_id = $1
       AND created_at >= $2
       AND created_at <= $3
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [merchantId, startDate, endDate]
  );

  // Courier performance for selected couriers only
  const courierPerformance = await db.query(
    `SELECT 
       c.courier_name,
       COUNT(o.order_id) as deliveries,
       AVG(o.trust_score) as avg_trust_score,
       AVG(CASE WHEN o.delivered_on_time THEN 100 ELSE 0 END) as on_time_rate
     FROM couriers c
     JOIN merchant_courier_selections mcs ON c.courier_id = mcs.courier_id
     LEFT JOIN orders o ON c.courier_id = o.courier_id
     WHERE mcs.merchant_id = $1
       AND mcs.is_active = true
     GROUP BY c.courier_id, c.courier_name`,
    [merchantId]
  );

  return res.json({
    success: true,
    data: {
      orderTrends: orderTrends.rows,
      courierPerformance: courierPerformance.rows
    }
  });
}
```

---

## 🎨 Frontend Filtering

### Pattern 1: Role-Based Endpoint Selection

**File:** `Dashboard.tsx`
```typescript
const { data: dashboardData, isLoading } = useQuery({
  queryKey: ['dashboard', user?.user_role, user?.user_id],
  queryFn: async () => {
    const endpoint = getDashboardEndpoint(user?.user_role);
    const response = await apiClient.get(endpoint);
    return response.data.data;
  },
  enabled: !!user,
});

const getDashboardEndpoint = (role: string) => {
  switch (role) {
    case 'merchant': return '/merchant/dashboard';
    case 'courier': return '/courier/dashboard';
    case 'consumer': return '/consumer/dashboard';
    case 'admin': return '/admin/dashboard';
    default: throw new Error('Invalid role');
  }
};
```

### Pattern 2: Role-Based Component Rendering

**File:** `Dashboard.tsx`
```typescript
const renderDashboard = () => {
  switch (user?.user_role) {
    case 'merchant':
      return <MerchantDashboard data={dashboardData} />;
    case 'courier':
      return <CourierDashboard data={dashboardData} />;
    case 'consumer':
      return <ConsumerDashboard data={dashboardData} />;
    case 'admin':
      return <AdminDashboard data={dashboardData} />;
    default:
      return <Navigate to="/login" />;
  }
};

return (
  <Container>
    {renderDashboard()}
  </Container>
);
```

### Pattern 3: Conditional Feature Display

```typescript
// Show feature only to specific roles
{user?.user_role === 'merchant' && (
  <MerchantOnlyFeature />
)}

{['merchant', 'admin'].includes(user?.user_role) && (
  <MerchantAndAdminFeature />
)}

// Hide feature from specific roles
{user?.user_role !== 'consumer' && (
  <NotForConsumers />
)}
```

---

## 🗄️ Database Row Level Security (RLS)

### Enable RLS on Tables

```sql
-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Merchants can see orders from their shops
CREATE POLICY merchant_orders_policy ON orders
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM shops 
      WHERE owner_user_id = current_user_id()
    )
  );

-- Policy: Couriers can see their assigned deliveries
CREATE POLICY courier_orders_policy ON orders
  FOR SELECT
  USING (courier_id = current_user_id());

-- Policy: Consumers can see their own orders
CREATE POLICY consumer_orders_policy ON orders
  FOR SELECT
  USING (consumer_id = current_user_id());

-- Policy: Admins can see all orders
CREATE POLICY admin_orders_policy ON orders
  FOR ALL
  USING (current_user_role() = 'admin');
```

### Helper Functions

```sql
-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.user_id', true)::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user role from JWT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.user_role', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Implementation Checklist

### Backend APIs
- [ ] Create `/api/merchant/dashboard`
- [ ] Create `/api/courier/dashboard`
- [ ] Create `/api/consumer/dashboard`
- [ ] Update `/api/orders` with role filtering
- [ ] Create `/api/merchant/analytics`
- [ ] Create `/api/courier/analytics`
- [ ] Add role validation to all endpoints
- [ ] Add ownership validation to all CRUD operations

### Frontend Components
- [ ] Update `Dashboard.tsx` with role-based endpoints
- [ ] Update `Analytics.tsx` with role-based endpoints
- [ ] Update `Orders.tsx` with role-based filtering
- [ ] Add role guards to all components
- [ ] Hide unauthorized features
- [ ] Show upgrade prompts for subscription limits

### Database
- [ ] Enable RLS on all tables
- [ ] Create RLS policies per role
- [ ] Add helper functions for current user
- [ ] Test RLS policies
- [ ] Add audit triggers

### Testing
- [ ] Test with merchant account
- [ ] Test with courier account
- [ ] Test with consumer account
- [ ] Test with admin account
- [ ] Test cross-role data isolation
- [ ] Security audit
- [ ] Performance testing

---

## 🧪 Testing Examples

### Test 1: Merchant Data Isolation

```bash
# Login as Merchant A
curl -X POST /api/auth/login \
  -d '{"email":"merchant-a@test.com","password":"test123"}'

# Get dashboard (should only see Merchant A's data)
curl -X GET /api/merchant/dashboard \
  -H "Authorization: Bearer TOKEN_A"

# Try to access Merchant B's shop (should fail)
curl -X GET /api/shops/merchant-b-shop-id \
  -H "Authorization: Bearer TOKEN_A"
# Expected: 403 Forbidden
```

### Test 2: Courier Data Isolation

```bash
# Login as Courier A
curl -X POST /api/auth/login \
  -d '{"email":"courier-a@test.com","password":"test123"}'

# Get deliveries (should only see Courier A's deliveries)
curl -X GET /api/orders \
  -H "Authorization: Bearer TOKEN_A"

# Try to update Courier B's delivery (should fail)
curl -X PUT /api/orders/courier-b-order-id \
  -H "Authorization: Bearer TOKEN_A"
# Expected: 403 Forbidden
```

---

## 📊 Quick Reference

### Role Access Matrix

| Endpoint | Merchant | Courier | Consumer | Admin |
|----------|----------|---------|----------|-------|
| `/merchant/dashboard` | ✅ Own data | ❌ | ❌ | ✅ All data |
| `/courier/dashboard` | ❌ | ✅ Own data | ❌ | ✅ All data |
| `/consumer/dashboard` | ❌ | ❌ | ✅ Own data | ✅ All data |
| `/orders` | ✅ Own shops | ✅ Assigned | ✅ Own orders | ✅ All |
| `/analytics` | ✅ Own data | ✅ Own data | ❌ | ✅ All data |
| `/shops` | ✅ Own shops | ❌ | ❌ | ✅ All shops |
| `/team` | ✅ Own team | ✅ Own team | ❌ | ✅ All teams |

---

**Version:** 1.0  
**Last Updated:** October 12, 2025
