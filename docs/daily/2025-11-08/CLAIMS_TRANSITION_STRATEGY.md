# 🎯 CLAIMS SYSTEM - TRANSITION STRATEGY

**Date:** November 9, 2025, 12:15 AM
**Challenge:** "Couriers won't use the claim system immediately - how do we calculate TrustScore until then?"

---

## 🚨 **THE PROBLEM**

### **Ideal State (Future):**
- Merchants file claims through Performile
- Couriers respond through Performile
- All claim data tracked in database
- TrustScore reflects actual claim rate

### **Current Reality:**
- Couriers handle claims directly with merchants
- No data in Performile system
- Can't calculate claim rate
- **Missing 10% of TrustScore calculation**

---

## ✅ **TRANSITION STRATEGY**

### **Phase 1: No Claims Data (Months 1-3)**
**Assume neutral performance**

### **Phase 2: Partial Adoption (Months 4-6)**
**Mix of in-system and external claims**

### **Phase 3: Full Adoption (Months 7+)**
**All claims through Performile**

---

## 📊 **TRUSTSCORE CALCULATION - PHASED APPROACH**

### **PHASE 1: No Claims Data (Current State)**

**Problem:** Can't calculate claim rate (no data)

**Solution:** Redistribute the 10% weight to other metrics

```typescript
// TrustScore without claims data
function calculateTrustScorePhase1(courier_id: string): number {
  const weights = {
    reviews: 0.35,              // 35% (was 30%, +5%)
    completionRate: 0.30,       // 30% (was 25%, +5%)
    onTimeDelivery: 0.20,       // 20% (unchanged)
    firstAttemptSuccess: 0.15   // 15% (unchanged)
    // claimRate: 0.00          // 0% (no data yet)
  };
  
  const reviewScore = calculateReviewScore(courier_id);
  const completionRate = calculateCompletionRate(courier_id);
  const onTimeRate = calculateOnTimeRate(courier_id);
  const firstAttemptRate = calculateFirstAttemptRate(courier_id);
  
  const trustScore = 
    (reviewScore * weights.reviews) +
    (completionRate * weights.completionRate) +
    (onTimeRate * weights.onTimeDelivery) +
    (firstAttemptRate * weights.firstAttemptSuccess);
  
  return Math.round(trustScore);
}
```

**Rationale:**
- Can't assume 0% claims (unfair to penalize)
- Can't assume 100% claims (unrealistic)
- Better to use other metrics until we have data

---

### **PHASE 2: Partial Claims Data (Transition)**

**Problem:** Some claims in system, some external

**Solution:** Use available data but mark as "incomplete"

```typescript
// TrustScore with partial claims data
function calculateTrustScorePhase2(courier_id: string): number {
  const claimData = await getClaimData(courier_id);
  
  // Check if we have enough data
  const hasEnoughClaimData = claimData.total_orders >= 20;
  
  if (hasEnoughClaimData) {
    // Use full formula with claims
    return calculateTrustScorePhase3(courier_id);
  } else {
    // Use Phase 1 formula (redistribute weight)
    return calculateTrustScorePhase1(courier_id);
  }
}
```

**Threshold:** Need at least 20 orders with claim tracking before including in TrustScore

---

### **PHASE 3: Full Claims Data (Target State)**

**Solution:** Use complete formula

```typescript
// TrustScore with full claims data
function calculateTrustScorePhase3(courier_id: string): number {
  const weights = {
    reviews: 0.30,              // 30%
    completionRate: 0.25,       // 25%
    onTimeDelivery: 0.20,       // 20%
    firstAttemptSuccess: 0.15,  // 15%
    claimRate: 0.10             // 10% (now included)
  };
  
  const reviewScore = calculateReviewScore(courier_id);
  const completionRate = calculateCompletionRate(courier_id);
  const onTimeRate = calculateOnTimeRate(courier_id);
  const firstAttemptRate = calculateFirstAttemptRate(courier_id);
  const claimScore = calculateClaimScore(courier_id);
  
  const trustScore = 
    (reviewScore * weights.reviews) +
    (completionRate * weights.completionRate) +
    (onTimeRate * weights.onTimeDelivery) +
    (firstAttemptRate * weights.firstAttemptSuccess) +
    (claimScore * weights.claimRate);
  
  return Math.round(trustScore);
}
```

---

## 🎯 **ALTERNATIVE: INFER CLAIMS FROM OTHER DATA**

### **Smart Estimation (Before Full Adoption):**

**Use proxy metrics to estimate claim rate:**

```typescript
function estimateClaimRate(courier_id: string): number {
  // Get data we DO have
  const completionRate = await getCompletionRate(courier_id);
  const reviewScore = await getReviewScore(courier_id);
  const failureRate = 100 - completionRate;
  
  // Estimate claim rate based on:
  // 1. Failure rate (lost/damaged packages)
  // 2. Low review scores (dissatisfied customers)
  // 3. Late deliveries (customer complaints)
  
  let estimatedClaimRate = 0;
  
  // Failed deliveries likely result in claims
  estimatedClaimRate += failureRate * 0.8; // 80% of failures become claims
  
  // Low reviews (1-2 stars) likely indicate claim-worthy issues
  const lowReviewRate = await getLowReviewRate(courier_id); // % of 1-2 star reviews
  estimatedClaimRate += lowReviewRate * 0.5; // 50% of low reviews = claims
  
  // Late deliveries sometimes result in claims
  const lateDeliveryRate = 100 - await getOnTimeRate(courier_id);
  estimatedClaimRate += lateDeliveryRate * 0.1; // 10% of late deliveries = claims
  
  // Cap at reasonable maximum
  return Math.min(estimatedClaimRate, 20); // Max 20% claim rate
}
```

**Example:**
```
Courier A:
- Failure rate: 2% → 2 * 0.8 = 1.6% estimated claims
- Low review rate: 5% → 5 * 0.5 = 2.5% estimated claims
- Late delivery rate: 10% → 10 * 0.1 = 1.0% estimated claims
- Total estimated claim rate: 5.1%

Claim score: 100 - 5.1 = 94.9%
```

---

## 📋 **RECOMMENDED APPROACH**

### **Option 1: Redistribute Weight (Simple)** ⭐ **RECOMMENDED**

**Pros:**
- ✅ Simple to implement
- ✅ Fair (don't penalize for missing data)
- ✅ Clear to users ("Claims tracking coming soon")
- ✅ Easy to transition to full formula later

**Cons:**
- ⚠️ Missing 10% of score accuracy
- ⚠️ Can't differentiate couriers on claim handling

**Implementation:**
```typescript
// Check if claims data available
const hasClaimsData = await checkClaimsDataAvailability(courier_id);

if (hasClaimsData) {
  // Use full formula (Phase 3)
  return calculateTrustScoreWithClaims(courier_id);
} else {
  // Redistribute weight (Phase 1)
  return calculateTrustScoreWithoutClaims(courier_id);
}
```

---

### **Option 2: Estimate from Proxy Metrics (Smart)**

**Pros:**
- ✅ Uses available data
- ✅ Better than nothing
- ✅ Smooth transition

**Cons:**
- ⚠️ Estimation may be inaccurate
- ⚠️ More complex
- ⚠️ Harder to explain to users

**Implementation:**
```typescript
const hasClaimsData = await checkClaimsDataAvailability(courier_id);

if (hasClaimsData) {
  // Use actual claims data
  claimScore = calculateActualClaimScore(courier_id);
} else {
  // Estimate from proxy metrics
  claimScore = estimateClaimScore(courier_id);
}
```

---

### **Option 3: Default to "Good" (Optimistic)**

**Pros:**
- ✅ Encourages courier adoption
- ✅ Doesn't penalize early adopters

**Cons:**
- ❌ Unfair to couriers with actual low claim rates
- ❌ Inflates scores artificially

**Not recommended**

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1 (Now - Month 3): Redistribute Weight**

```sql
-- TrustScore calculation without claims
WITH courier_metrics AS (
  SELECT 
    courier_id,
    -- Reviews: 35% (boosted from 30%)
    review_score * 0.35 as review_component,
    -- Completion: 30% (boosted from 25%)
    completion_rate * 0.30 as completion_component,
    -- On-time: 20%
    on_time_rate * 0.20 as on_time_component,
    -- First-attempt: 15%
    first_attempt_rate * 0.15 as first_attempt_component
    -- Claims: 0% (no data)
  FROM courier_performance_metrics
)
SELECT 
  courier_id,
  ROUND(
    review_component + 
    completion_component + 
    on_time_component + 
    first_attempt_component,
    0
  ) as trust_score,
  'Phase 1: Claims data not yet available' as note
FROM courier_metrics;
```

---

### **Phase 2 (Month 4-6): Gradual Adoption**

```typescript
// Check if courier has enough claim data
const claimDataCheck = await supabase
  .from('claims')
  .select('claim_id')
  .eq('courier_id', courier_id)
  .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

const hasEnoughData = claimDataCheck.data.length >= 20;

if (hasEnoughData) {
  // Use full formula
  weights = {
    reviews: 0.30,
    completionRate: 0.25,
    onTimeDelivery: 0.20,
    firstAttemptSuccess: 0.15,
    claimRate: 0.10  // Include claims
  };
} else {
  // Redistribute weight
  weights = {
    reviews: 0.35,
    completionRate: 0.30,
    onTimeDelivery: 0.20,
    firstAttemptSuccess: 0.15,
    claimRate: 0.00  // Exclude claims
  };
}
```

---

### **Phase 3 (Month 7+): Full Adoption**

```typescript
// All couriers should have claim data by now
weights = {
  reviews: 0.30,
  completionRate: 0.25,
  onTimeDelivery: 0.20,
  firstAttemptSuccess: 0.15,
  claimRate: 0.10
};

// If still no data, use estimate
if (!hasClaimsData) {
  claimScore = estimateClaimScore(courier_id);
}
```

---

## 📊 **UI TRANSPARENCY**

### **Show Users What's Included:**

```tsx
<TrustScoreCard>
  <Typography variant="h4">TrustScore: 87</Typography>
  
  <Box mt={2}>
    <Typography variant="subtitle2">Components:</Typography>
    <List>
      <ListItem>
        <CheckCircleIcon color="success" />
        <ListItemText 
          primary="Customer Reviews: 35%" 
          secondary="92/100 (weighted 35%)"
        />
      </ListItem>
      <ListItem>
        <CheckCircleIcon color="success" />
        <ListItemText 
          primary="Completion Rate: 30%" 
          secondary="95% (weighted 30%)"
        />
      </ListItem>
      <ListItem>
        <CheckCircleIcon color="success" />
        <ListItemText 
          primary="On-Time Delivery: 20%" 
          secondary="88% (weighted 20%)"
        />
      </ListItem>
      <ListItem>
        <CheckCircleIcon color="success" />
        <ListItemText 
          primary="First-Attempt Success: 15%" 
          secondary="82% (weighted 15%)"
        />
      </ListItem>
      <ListItem>
        <InfoIcon color="info" />
        <ListItemText 
          primary="Claim Rate: Not yet tracked" 
          secondary="Will be included when claim system is adopted"
        />
      </ListItem>
    </List>
  </Box>
  
  <Alert severity="info" sx={{ mt: 2 }}>
    <AlertTitle>Claims Tracking Coming Soon</AlertTitle>
    <Typography variant="body2">
      Once you process 20+ orders through our claim system, 
      claim rate (10% weight) will be added to your TrustScore.
    </Typography>
  </Alert>
</TrustScoreCard>
```

---

## 🎯 **INCENTIVIZE ADOPTION**

### **Encourage Couriers to Use Claim System:**

**Benefits to communicate:**
1. **Transparency** - Show low claim rate to merchants
2. **Faster resolution** - Centralized system
3. **Better TrustScore** - If claim rate is low, boosts score
4. **Data insights** - See claim patterns

**Messaging:**
```
"Start using Performile's claim system to:
✅ Show merchants your low claim rate (2%)
✅ Boost your TrustScore by up to 10 points
✅ Resolve claims faster
✅ Get insights on claim patterns

Currently, your TrustScore is calculated without claim data.
Once you process 20+ orders with claims tracking, 
your score could increase if your claim rate is low!"
```

---

## ✅ **RECOMMENDED IMPLEMENTATION**

### **Start with Option 1 (Redistribute Weight):**

**Month 1-3:**
- TrustScore = 90% of metrics (no claims)
- Weights redistributed to other components
- Clear messaging: "Claims tracking coming soon"

**Month 4-6:**
- Check if courier has 20+ orders with claim data
- If yes: Use full formula
- If no: Continue with redistributed weight

**Month 7+:**
- Most couriers should have claim data
- Use full formula for all
- Estimate for stragglers

---

## 📋 **DATABASE TRACKING**

```sql
-- Track claim system adoption
CREATE TABLE claim_system_adoption (
  courier_id UUID PRIMARY KEY REFERENCES couriers(courier_id),
  first_claim_date TIMESTAMP WITH TIME ZONE,
  total_claims_tracked INTEGER DEFAULT 0,
  has_enough_data BOOLEAN DEFAULT FALSE,
  using_full_trustscore BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update adoption status
CREATE OR REPLACE FUNCTION update_claim_adoption()
RETURNS void AS $$
BEGIN
  UPDATE claim_system_adoption
  SET 
    total_claims_tracked = (
      SELECT COUNT(*) FROM claims 
      WHERE claims.courier_id = claim_system_adoption.courier_id
    ),
    has_enough_data = (
      SELECT COUNT(*) >= 20 FROM claims 
      WHERE claims.courier_id = claim_system_adoption.courier_id
    ),
    using_full_trustscore = (
      SELECT COUNT(*) >= 20 FROM claims 
      WHERE claims.courier_id = claim_system_adoption.courier_id
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 **SUMMARY**

**Recommended Approach:**
1. **Phase 1 (Now):** Redistribute 10% claim weight to other metrics
2. **Phase 2 (Transition):** Use full formula when courier has 20+ tracked claims
3. **Phase 3 (Target):** All couriers use full formula

**Benefits:**
- ✅ Fair to all couriers
- ✅ No penalty for missing data
- ✅ Smooth transition
- ✅ Incentivizes adoption
- ✅ Transparent to users

**TrustScore remains accurate and fair throughout the transition!** 🎯

---

**Document:** `docs/daily/2025-11-08/CLAIMS_TRANSITION_STRATEGY.md`
