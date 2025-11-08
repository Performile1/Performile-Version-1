# 🚨 FAILED DELIVERIES - VISIBILITY & CATEGORIZATION

**Date:** November 8, 2025, 11:56 PM
**Question:** Should we show failed deliveries (lost, damaged, cancelled) in merchant, courier, and admin views?

---

## ✅ **YES - But with Different Views for Each Role**

---

## 📊 **FAILURE CATEGORIES**

### **1. Courier Responsibility (Affects TrustScore):**

**Lost in Transit** ❌
- Package lost by courier
- **Courier fault:** Yes
- **Affects TrustScore:** Yes (major impact)
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

**Damaged/Destroyed** ❌
- Package damaged during handling
- **Courier fault:** Yes
- **Affects TrustScore:** Yes (major impact)
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

**Cancelled by Courier** ❌
- Courier unable/unwilling to deliver
- **Courier fault:** Yes
- **Affects TrustScore:** Yes (moderate impact)
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

---

### **2. Customer Responsibility (Does NOT Affect TrustScore):**

**Refused by Customer** ⚠️
- Customer rejected package at door
- **Courier fault:** No
- **Affects TrustScore:** No
- **Merchant sees:** Yes (needs to know)
- **Courier sees:** Yes (for records)
- **Admin sees:** Yes

**Customer Not Home (Multiple Attempts)** ⚠️
- Customer unavailable after max attempts
- **Courier fault:** No
- **Affects TrustScore:** No (but affects first-attempt rate)
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

**Wrong Address (Customer Error)** ⚠️
- Customer provided incorrect address
- **Courier fault:** No
- **Affects TrustScore:** No
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

---

### **3. Merchant Responsibility (Does NOT Affect TrustScore):**

**Cancelled by Merchant** ℹ️
- Merchant cancelled before pickup
- **Courier fault:** No
- **Affects TrustScore:** No
- **Merchant sees:** Yes
- **Courier sees:** Yes (for records)
- **Admin sees:** Yes

**Wrong/Incomplete Address (Merchant Error)** ℹ️
- Merchant provided bad address
- **Courier fault:** No
- **Affects TrustScore:** No
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

---

### **4. External Factors (Does NOT Affect TrustScore):**

**Customs Hold** ℹ️
- Held by customs (international)
- **Courier fault:** No
- **Affects TrustScore:** No
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

**Force Majeure** ℹ️
- Natural disaster, strikes, etc.
- **Courier fault:** No
- **Affects TrustScore:** No
- **Merchant sees:** Yes
- **Courier sees:** Yes
- **Admin sees:** Yes

---

## 🗄️ **DATABASE SCHEMA**

### **Order Status Values:**

```sql
-- Add failure_reason column to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(100),
ADD COLUMN IF NOT EXISTS failure_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS responsible_party VARCHAR(50);

-- Failure categories
CREATE TYPE failure_category_enum AS ENUM (
  'courier_fault',      -- Lost, damaged, cancelled by courier
  'customer_fault',     -- Refused, not home, wrong address
  'merchant_fault',     -- Cancelled by merchant, bad address
  'external_factor'     -- Customs, force majeure
);

-- Responsible parties
CREATE TYPE responsible_party_enum AS ENUM (
  'courier',
  'customer',
  'merchant',
  'external'
);

-- Update orders table
ALTER TABLE orders
ALTER COLUMN failure_category TYPE failure_category_enum USING failure_category::failure_category_enum,
ALTER COLUMN responsible_party TYPE responsible_party_enum USING responsible_party::responsible_party_enum;

-- Example data:
INSERT INTO orders (
  order_status,
  failure_reason,
  failure_category,
  responsible_party
) VALUES
('failed', 'lost_in_transit', 'courier_fault', 'courier'),
('failed', 'damaged_package', 'courier_fault', 'courier'),
('failed', 'cancelled_by_courier', 'courier_fault', 'courier'),
('returned', 'customer_refused', 'customer_fault', 'customer'),
('returned', 'customer_not_home', 'customer_fault', 'customer'),
('cancelled', 'merchant_cancelled', 'merchant_fault', 'merchant');
```

---

## 👔 **MERCHANT VIEW**

### **What Merchants See:**

```tsx
<Box>
  <Typography variant="h6">Order Status</Typography>
  
  {/* Failed delivery */}
  {order.order_status === 'failed' && (
    <Alert severity="error">
      <AlertTitle>Delivery Failed</AlertTitle>
      
      {/* Show reason */}
      <Typography variant="body2">
        Reason: {formatFailureReason(order.failure_reason)}
      </Typography>
      
      {/* Show who's responsible */}
      <Typography variant="body2" mt={1}>
        {order.responsible_party === 'courier' && (
          <>
            <strong>Courier Responsibility</strong>
            <br />
            This failure is the courier's responsibility. 
            You may be eligible for compensation.
          </>
        )}
        {order.responsible_party === 'customer' && (
          <>
            <strong>Customer Issue</strong>
            <br />
            The customer {order.failure_reason === 'customer_refused' ? 'refused' : 'was unavailable for'} delivery.
          </>
        )}
        {order.responsible_party === 'merchant' && (
          <>
            <strong>Merchant Action Required</strong>
            <br />
            Please verify the shipping address and customer details.
          </>
        )}
      </Typography>
      
      {/* Actions */}
      <Box mt={2}>
        {order.responsible_party === 'courier' && (
          <Button variant="contained" color="primary" onClick={() => fileClaim()}>
            File Claim
          </Button>
        )}
        {order.responsible_party === 'customer' && (
          <Button variant="outlined" onClick={() => contactCustomer()}>
            Contact Customer
          </Button>
        )}
        <Button variant="outlined" onClick={() => createNewShipment()}>
          Create New Shipment
        </Button>
      </Box>
    </Alert>
  )}
</Box>
```

### **Merchant Dashboard - Failed Orders:**

```tsx
<Card>
  <CardHeader title="Failed Deliveries (Last 30 Days)" />
  <CardContent>
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <MetricCard
          title="Courier Fault"
          value={15}
          subtitle="Lost, damaged, cancelled"
          color="error"
          icon={<ErrorIcon />}
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title="Customer Issues"
          value={8}
          subtitle="Refused, not home"
          color="warning"
          icon={<WarningIcon />}
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title="Address Issues"
          value={3}
          subtitle="Wrong/incomplete address"
          color="info"
          icon={<InfoIcon />}
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title="Total Failed"
          value={26}
          subtitle="Out of 1,000 orders (2.6%)"
          color="default"
        />
      </Grid>
    </Grid>
    
    {/* Breakdown by courier */}
    <Table sx={{ mt: 2 }}>
      <TableHead>
        <TableRow>
          <TableCell>Courier</TableCell>
          <TableCell>Total Orders</TableCell>
          <TableCell>Failed (Courier Fault)</TableCell>
          <TableCell>Failure Rate</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>PostNord</TableCell>
          <TableCell>500</TableCell>
          <TableCell>8 (lost: 3, damaged: 2, cancelled: 3)</TableCell>
          <TableCell>1.6%</TableCell>
          <TableCell>
            <Button size="small" onClick={() => viewDetails('postnord')}>
              View Details
            </Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>DHL</TableCell>
          <TableCell>300</TableCell>
          <TableCell>7 (lost: 5, damaged: 1, cancelled: 1)</TableCell>
          <TableCell>2.3%</TableCell>
          <TableCell>
            <Button size="small" onClick={() => viewDetails('dhl')}>
              View Details
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

## 🚚 **COURIER VIEW**

### **What Couriers See:**

```tsx
<Box>
  <Typography variant="h6">Failed Deliveries</Typography>
  
  {/* Show ALL failures, but categorize clearly */}
  <Tabs value={selectedTab}>
    <Tab label="Our Responsibility" value="courier_fault" />
    <Tab label="Customer Issues" value="customer_fault" />
    <Tab label="External Factors" value="external" />
  </Tabs>
  
  {/* Courier Fault Tab */}
  {selectedTab === 'courier_fault' && (
    <Box>
      <Alert severity="error" sx={{ mb: 2 }}>
        These failures affect your TrustScore. Please review and take action.
      </Alert>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>#12345</TableCell>
            <TableCell>
              <Chip label="Lost in Transit" color="error" size="small" />
            </TableCell>
            <TableCell>Nov 5, 2025</TableCell>
            <TableCell>
              <Chip label="Claim Filed" color="warning" size="small" />
            </TableCell>
            <TableCell>
              <Button size="small" onClick={() => viewDetails()}>
                View Details
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>#12346</TableCell>
            <TableCell>
              <Chip label="Damaged Package" color="error" size="small" />
            </TableCell>
            <TableCell>Nov 6, 2025</TableCell>
            <TableCell>
              <Chip label="Under Investigation" color="warning" size="small" />
            </TableCell>
            <TableCell>
              <Button size="small" onClick={() => addEvidence()}>
                Add Evidence
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  )}
  
  {/* Customer Issues Tab */}
  {selectedTab === 'customer_fault' && (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        These do not affect your TrustScore. For informational purposes only.
      </Alert>
      
      <Table>
        {/* Similar table for customer issues */}
      </Table>
    </Box>
  )}
</Box>
```

### **Courier Dashboard - Failure Analytics:**

```tsx
<Card>
  <CardHeader title="Failure Analysis (Last 90 Days)" />
  <CardContent>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2">Failures by Category</Typography>
        <PieChart
          data={[
            { name: 'Lost in Transit', value: 3, color: '#f44336' },
            { name: 'Damaged', value: 2, color: '#ff9800' },
            { name: 'Cancelled', value: 3, color: '#ff5722' },
            { name: 'Customer Issues', value: 8, color: '#9e9e9e' }
          ]}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2">Trend Over Time</Typography>
        <LineChart
          data={failureTrendData}
          xAxis="month"
          yAxis="failure_count"
        />
      </Grid>
    </Grid>
    
    {/* Impact on TrustScore */}
    <Alert severity="warning" sx={{ mt: 2 }}>
      <AlertTitle>TrustScore Impact</AlertTitle>
      <Typography variant="body2">
        Your 8 courier-fault failures (1.6% failure rate) have reduced your TrustScore by 4 points.
      </Typography>
      <Typography variant="body2" mt={1}>
        <strong>To improve:</strong> Focus on reducing lost packages and improving handling procedures.
      </Typography>
    </Alert>
  </CardContent>
</Card>
```

---

## 👨‍💼 **ADMIN VIEW**

### **What Admins See:**

```tsx
<Box>
  <Typography variant="h5">Platform-Wide Failed Deliveries</Typography>
  
  {/* Summary metrics */}
  <Grid container spacing={2} sx={{ mt: 2 }}>
    <Grid item xs={3}>
      <MetricCard
        title="Total Failed"
        value={156}
        subtitle="Out of 10,000 orders (1.56%)"
      />
    </Grid>
    <Grid item xs={3}>
      <MetricCard
        title="Courier Fault"
        value={89}
        subtitle="57% of failures"
        color="error"
      />
    </Grid>
    <Grid item xs={3}>
      <MetricCard
        title="Customer Issues"
        value={45}
        subtitle="29% of failures"
        color="warning"
      />
    </Grid>
    <Grid item xs={3}>
      <MetricCard
        title="Other"
        value={22}
        subtitle="14% of failures"
        color="info"
      />
    </Grid>
  </Grid>
  
  {/* Breakdown by courier */}
  <Table sx={{ mt: 3 }}>
    <TableHead>
      <TableRow>
        <TableCell>Courier</TableCell>
        <TableCell>Total Orders</TableCell>
        <TableCell>Lost</TableCell>
        <TableCell>Damaged</TableCell>
        <TableCell>Cancelled</TableCell>
        <TableCell>Total Failed</TableCell>
        <TableCell>Failure Rate</TableCell>
        <TableCell>TrustScore Impact</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>PostNord</TableCell>
        <TableCell>5,000</TableCell>
        <TableCell>15</TableCell>
        <TableCell>8</TableCell>
        <TableCell>12</TableCell>
        <TableCell>35</TableCell>
        <TableCell>0.7%</TableCell>
        <TableCell>
          <Chip label="-2 points" color="success" size="small" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>DHL</TableCell>
        <TableCell>3,000</TableCell>
        <TableCell>25</TableCell>
        <TableCell>15</TableCell>
        <TableCell>14</TableCell>
        <TableCell>54</TableCell>
        <TableCell>1.8%</TableCell>
        <TableCell>
          <Chip label="-5 points" color="warning" size="small" />
        </TableCell>
      </TableRow>
      <TableRow sx={{ bgcolor: 'error.light' }}>
        <TableCell>Bring</TableCell>
        <TableCell>2,000</TableCell>
        <TableCell>30</TableCell>
        <TableCell>20</TableCell>
        <TableCell>17</TableCell>
        <TableCell>67</TableCell>
        <TableCell>3.35%</TableCell>
        <TableCell>
          <Chip label="-8 points" color="error" size="small" />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
  
  {/* Actions */}
  <Box sx={{ mt: 2 }}>
    <Button 
      variant="outlined" 
      color="error"
      onClick={() => contactCourier('bring')}
    >
      Contact Bring (High Failure Rate)
    </Button>
  </Box>
</Box>
```

---

## 🧮 **TRUSTSCORE IMPACT CALCULATION**

```typescript
function calculateFailureImpact(courier_id: string): number {
  const failures = await supabase
    .from('orders')
    .select('*')
    .eq('courier_id', courier_id)
    .eq('order_status', 'failed')
    .eq('responsible_party', 'courier')  // Only courier-fault failures
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  
  const totalOrders = await getTotalOrders(courier_id, 90);
  
  // Calculate failure rate
  const failureRate = failures.data.length / totalOrders;
  
  // Impact on completion rate component (25% of TrustScore)
  const completionRate = (1 - failureRate) * 100;
  const completionScore = completionRate * 0.25;  // 25% weight
  
  // Impact on claim rate component (10% of TrustScore)
  const claimRate = await getClaimRate(courier_id);
  const claimScore = (100 - claimRate) * 0.10;  // 10% weight
  
  return {
    failure_rate: failureRate * 100,
    completion_rate: completionRate,
    trustscore_impact: -(100 - completionScore - claimScore),
    breakdown: {
      lost: failures.data.filter(f => f.failure_reason === 'lost_in_transit').length,
      damaged: failures.data.filter(f => f.failure_reason === 'damaged_package').length,
      cancelled: failures.data.filter(f => f.failure_reason === 'cancelled_by_courier').length
    }
  };
}
```

---

## ✅ **RECOMMENDATIONS**

### **1. Show Failed Deliveries:**

**Merchant:**
- ✅ Show all failures
- ✅ Categorize by responsible party
- ✅ Provide actions (file claim, contact customer, reship)
- ✅ Show courier comparison

**Courier:**
- ✅ Show all failures
- ✅ Separate tabs for courier-fault vs. others
- ✅ Highlight TrustScore impact
- ✅ Provide improvement suggestions
- ✅ Allow evidence submission for disputes

**Admin:**
- ✅ Show all failures across platform
- ✅ Identify problematic couriers
- ✅ Monitor trends
- ✅ Take action on high failure rates

### **2. TrustScore Impact:**

**Only count courier-fault failures:**
- Lost in transit ❌
- Damaged/destroyed ❌
- Cancelled by courier ❌

**Do NOT count:**
- Customer refused ✅
- Customer not home ✅
- Merchant cancelled ✅
- Wrong address (customer error) ✅
- External factors ✅

### **3. Database Changes:**

```sql
ALTER TABLE orders
ADD COLUMN failure_reason VARCHAR(100),
ADD COLUMN failure_category VARCHAR(50),
ADD COLUMN responsible_party VARCHAR(50);
```

---

## 🎯 **SUMMARY**

**YES, show failed deliveries in all views, but:**

1. **Categorize clearly** - Courier fault vs. customer vs. merchant vs. external
2. **Different perspectives** - Each role sees what's relevant to them
3. **TrustScore impact** - Only courier-fault failures affect TrustScore
4. **Actionable** - Provide next steps for each failure type
5. **Transparent** - Everyone sees the data, builds trust

**This creates accountability while being fair!** 🎯
