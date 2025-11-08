# 📧 REVIEW TRACKING & NON-RESPONSE TRUSTSCORE

**Date:** November 8, 2025, 11:49 PM
**Critical Insight:** "Track all emails and review requests. No response = 70-80% satisfaction signal"

---

## 🎯 **THE INSIGHT**

**Traditional approach:**
- Only count reviews that are submitted
- Ignore non-responses
- Biased data (only angry or very happy customers respond)

**Better approach:**
- Track EVERY review request sent
- Non-response = neutral/satisfied customer (70-80% score)
- More accurate TrustScore calculation
- Prevents negative bias

---

## 📊 **THE PSYCHOLOGY**

### **Customer Response Patterns:**

```
Very Unhappy (1-2 stars): 80% response rate
  → Motivated to complain
  
Unhappy (3 stars): 40% response rate
  → Somewhat motivated
  
Neutral (4 stars): 20% response rate
  → Not motivated either way
  
Very Happy (5 stars): 60% response rate
  → Motivated to praise
  
No Response: 70-80% implied satisfaction
  → Service was "fine" - not worth the effort to review
```

**Without non-response tracking:**
- Only get extremes (1-2 stars and 5 stars)
- Missing the "satisfied but not excited" majority
- TrustScore skewed

**With non-response tracking:**
- Account for silent majority
- More balanced TrustScore
- Closer to reality

---

## 🗄️ **DATABASE SCHEMA**

### **Review Requests Tracking:**

```sql
CREATE TABLE review_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  merchant_id UUID NOT NULL REFERENCES merchants(merchant_id),
  consumer_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Request details
  request_type VARCHAR(50) DEFAULT 'email',  -- 'email', 'sms', 'in_app'
  sent_to_email VARCHAR(255),
  sent_to_phone VARCHAR(50),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'sent',  -- 'sent', 'opened', 'clicked', 'responded', 'expired'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,  -- 7 days after delivery
  
  -- Response tracking
  review_id UUID REFERENCES reviews(review_id),  -- NULL if no response
  
  -- Email tracking
  email_provider_id VARCHAR(255),  -- SendGrid/Mailgun message ID
  email_status VARCHAR(50),  -- 'delivered', 'bounced', 'opened', 'clicked'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_review_requests_order ON review_requests(order_id);
CREATE INDEX idx_review_requests_courier ON review_requests(courier_id);
CREATE INDEX idx_review_requests_status ON review_requests(status);
CREATE INDEX idx_review_requests_expires ON review_requests(expires_at);
```

### **Enhanced Reviews Table:**

```sql
-- Add source tracking to reviews
ALTER TABLE reviews
ADD COLUMN source VARCHAR(50) DEFAULT 'email_request',  -- 'email_request', 'sms_request', 'in_app', 'unsolicited'
ADD COLUMN request_id UUID REFERENCES review_requests(request_id);
```

---

## 🔄 **REVIEW REQUEST LIFECYCLE**

### **Step 1: Order Delivered**

```typescript
// When order status changes to 'delivered'
async function onOrderDelivered(order: Order) {
  // Wait 24 hours after delivery
  const reviewRequestDate = new Date(
    order.delivered_at.getTime() + 24 * 60 * 60 * 1000
  );
  
  // Schedule review request
  await scheduleReviewRequest({
    order_id: order.order_id,
    courier_id: order.courier_id,
    merchant_id: order.merchant_id,
    consumer_id: order.consumer_id,
    scheduled_for: reviewRequestDate,
    expires_at: new Date(
      reviewRequestDate.getTime() + 7 * 24 * 60 * 60 * 1000  // 7 days to respond
    )
  });
}
```

### **Step 2: Send Review Request Email**

```typescript
// api/reviews/send-request.ts

async function sendReviewRequest(request: ReviewRequest) {
  const consumer = await getConsumer(request.consumer_id);
  const order = await getOrder(request.order_id);
  const courier = await getCourier(request.courier_id);
  
  // Generate unique review link
  const reviewToken = generateSecureToken();
  const reviewLink = `${BASE_URL}/review/${reviewToken}`;
  
  // Send email via SendGrid/Mailgun
  const emailResult = await sendEmail({
    to: consumer.email,
    subject: `How was your delivery from ${courier.courier_name}?`,
    template: 'review_request',
    data: {
      consumer_name: consumer.first_name,
      courier_name: courier.courier_name,
      order_number: order.order_number,
      delivered_date: order.delivered_at,
      review_link: reviewLink
    },
    tracking: {
      open_tracking: true,
      click_tracking: true,
      custom_args: {
        request_id: request.request_id,
        order_id: order.order_id
      }
    }
  });
  
  // Save request
  await supabase
    .from('review_requests')
    .insert({
      order_id: order.order_id,
      courier_id: courier.courier_id,
      merchant_id: order.merchant_id,
      consumer_id: consumer.user_id,
      request_type: 'email',
      sent_to_email: consumer.email,
      status: 'sent',
      sent_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      email_provider_id: emailResult.message_id
    });
}
```

### **Step 3: Track Email Events (Webhooks)**

```typescript
// api/webhooks/email-events.ts

export default async function handler(req: Request, res: Response) {
  const event = req.body;  // SendGrid/Mailgun webhook
  
  const request_id = event.custom_args?.request_id;
  
  switch (event.event) {
    case 'delivered':
      await supabase
        .from('review_requests')
        .update({ 
          email_status: 'delivered',
          updated_at: new Date()
        })
        .eq('request_id', request_id);
      break;
      
    case 'open':
      await supabase
        .from('review_requests')
        .update({ 
          status: 'opened',
          opened_at: new Date(),
          email_status: 'opened',
          updated_at: new Date()
        })
        .eq('request_id', request_id);
      break;
      
    case 'click':
      await supabase
        .from('review_requests')
        .update({ 
          status: 'clicked',
          clicked_at: new Date(),
          email_status: 'clicked',
          updated_at: new Date()
        })
        .eq('request_id', request_id);
      break;
      
    case 'bounce':
    case 'dropped':
      await supabase
        .from('review_requests')
        .update({ 
          status: 'failed',
          email_status: event.event,
          updated_at: new Date()
        })
        .eq('request_id', request_id);
      break;
  }
  
  return res.status(200).json({ received: true });
}
```

### **Step 4: Consumer Submits Review**

```typescript
// api/reviews/submit.ts

async function submitReview(reviewData: ReviewSubmission) {
  // Create review
  const { data: review } = await supabase
    .from('reviews')
    .insert({
      order_id: reviewData.order_id,
      courier_id: reviewData.courier_id,
      merchant_id: reviewData.merchant_id,
      user_id: reviewData.consumer_id,
      rating: reviewData.rating,
      review_text: reviewData.review_text,
      source: 'email_request',
      request_id: reviewData.request_id
    })
    .select()
    .single();
  
  // Update request status
  await supabase
    .from('review_requests')
    .update({
      status: 'responded',
      responded_at: new Date(),
      review_id: review.review_id,
      updated_at: new Date()
    })
    .eq('request_id', reviewData.request_id);
  
  // Recalculate TrustScore
  await recalculateTrustScore(reviewData.courier_id);
}
```

### **Step 5: Handle Expired Requests**

```typescript
// Cron job: Run daily
async function processExpiredReviewRequests() {
  // Find expired requests without responses
  const { data: expiredRequests } = await supabase
    .from('review_requests')
    .select('*')
    .lt('expires_at', new Date())
    .in('status', ['sent', 'opened', 'clicked'])
    .is('review_id', null);
  
  for (const request of expiredRequests) {
    // Mark as expired
    await supabase
      .from('review_requests')
      .update({
        status: 'expired',
        updated_at: new Date()
      })
      .eq('request_id', request.request_id);
    
    // Recalculate TrustScore (will include non-response)
    await recalculateTrustScore(request.courier_id);
  }
}
```

---

## 🧮 **TRUSTSCORE CALCULATION WITH NON-RESPONSES**

### **Traditional Method (Biased):**

```typescript
// WRONG: Only counts submitted reviews
function calculateTrustScoreTraditional(courier_id: string): number {
  const reviews = await getReviews(courier_id);
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  // Problem: Missing silent majority
  return (avgRating / 5) * 100;
}

// Example:
// 5 reviews: [1, 1, 2, 5, 5]
// Average: 2.8 / 5 = 56% TrustScore
// But ignores 95 non-responses!
```

### **Improved Method (With Non-Responses):**

```typescript
function calculateTrustScoreWithNonResponses(courier_id: string): number {
  // Get all review requests (last 90 days)
  const requests = await supabase
    .from('review_requests')
    .select('*, reviews(*)')
    .eq('courier_id', courier_id)
    .gte('sent_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  
  const NON_RESPONSE_SCORE = 0.75;  // 75% = neutral/satisfied
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const request of requests.data) {
    if (request.review_id) {
      // Actual review submitted
      const review = request.reviews;
      const normalizedScore = review.rating / 5;  // 0-1 scale
      
      totalScore += normalizedScore;
      totalWeight += 1;
    } else if (request.status === 'expired') {
      // No response = assume neutral satisfaction
      totalScore += NON_RESPONSE_SCORE;
      totalWeight += 1;
    } else if (request.status === 'failed') {
      // Email bounced - don't count
      continue;
    }
    // 'sent', 'opened', 'clicked' but not expired yet - skip for now
  }
  
  if (totalWeight === 0) return 50;  // Default for new couriers
  
  const avgScore = totalScore / totalWeight;
  return Math.round(avgScore * 100);  // Convert to 0-100 scale
}

// Example:
// 100 review requests sent
// 5 reviews: [1, 1, 2, 5, 5] = avg 2.8 / 5 = 0.56
// 95 non-responses = 0.75 each
// Total: (5 * 0.56 + 95 * 0.75) / 100 = 0.74
// TrustScore: 74% ✅ Much more realistic!
```

---

## 📊 **TRUSTSCORE COMPONENTS**

### **Weighted Formula:**

```typescript
function calculateCompleteTrustScore(courier_id: string): TrustScore {
  const weights = {
    reviews: 0.40,           // 40% - Customer reviews (with non-responses)
    onTimeDelivery: 0.25,    // 25% - On-time delivery rate
    completionRate: 0.20,    // 20% - Order completion rate
    claimRate: 0.10,         // 10% - Claim rate (inverse)
    responseTime: 0.05       // 5% - Response time to issues
  };
  
  // 1. Review score (with non-responses)
  const reviewScore = calculateReviewScoreWithNonResponses(courier_id);
  
  // 2. On-time delivery
  const onTimeRate = calculateOnTimeRate(courier_id);
  
  // 3. Completion rate
  const completionRate = calculateCompletionRate(courier_id);
  
  // 4. Claim rate (inverse - lower is better)
  const claimRate = calculateClaimRate(courier_id);
  const claimScore = 100 - (claimRate * 100);
  
  // 5. Response time
  const responseScore = calculateResponseScore(courier_id);
  
  // Calculate weighted TrustScore
  const trustScore = 
    (reviewScore * weights.reviews) +
    (onTimeRate * weights.onTimeDelivery) +
    (completionRate * weights.completionRate) +
    (claimScore * weights.claimRate) +
    (responseScore * weights.responseTime);
  
  return {
    overall: Math.round(trustScore),
    components: {
      reviews: reviewScore,
      onTimeDelivery: onTimeRate,
      completionRate: completionRate,
      claimRate: claimScore,
      responseTime: responseScore
    },
    breakdown: {
      total_requests: getTotalRequests(courier_id),
      responses: getResponseCount(courier_id),
      non_responses: getNonResponseCount(courier_id),
      response_rate: getResponseRate(courier_id)
    }
  };
}
```

---

## 📧 **EMAIL TRACKING ANALYTICS**

### **Review Request Funnel:**

```sql
-- Analytics: Review request funnel
SELECT 
  courier_id,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE email_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE status = 'responded') as responded,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  ROUND(COUNT(*) FILTER (WHERE status = 'responded')::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 2) as response_rate,
  ROUND(COUNT(*) FILTER (WHERE status = 'opened')::NUMERIC / 
        NULLIF(COUNT(*) FILTER (WHERE email_status = 'delivered'), 0) * 100, 2) as open_rate,
  ROUND(COUNT(*) FILTER (WHERE status = 'clicked')::NUMERIC / 
        NULLIF(COUNT(*) FILTER (WHERE status = 'opened'), 0) * 100, 2) as click_rate
FROM review_requests
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY courier_id;

-- Results:
-- Courier A: 100 requests, 80 delivered, 40 opened, 20 clicked, 8 responded, 72 expired
-- Response rate: 8%
-- Open rate: 50%
-- Click rate: 50%
```

### **Dashboard for Couriers:**

```tsx
<Box>
  <Typography variant="h6">Review Request Performance</Typography>
  
  <Grid container spacing={2}>
    <Grid item xs={3}>
      <MetricCard
        title="Requests Sent"
        value={100}
        icon={<EmailIcon />}
      />
    </Grid>
    <Grid item xs={3}>
      <MetricCard
        title="Open Rate"
        value="50%"
        icon={<OpenEmailIcon />}
      />
    </Grid>
    <Grid item xs={3}>
      <MetricCard
        title="Response Rate"
        value="8%"
        icon={<ReviewIcon />}
      />
    </Grid>
    <Grid item xs={3}>
      <MetricCard
        title="Non-Responses"
        value={72}
        subtitle="Counted as 75% satisfaction"
        icon={<InfoIcon />}
      />
    </Grid>
  </Grid>
  
  {/* Funnel visualization */}
  <ReviewFunnel
    sent={100}
    delivered={80}
    opened={40}
    clicked={20}
    responded={8}
  />
</Box>
```

---

## 🎯 **NON-RESPONSE SCORE CALIBRATION**

### **How to Determine the Right Score:**

```typescript
// A/B test different non-response scores
const NON_RESPONSE_SCORES = {
  conservative: 0.70,  // 70% - assume slightly dissatisfied
  moderate: 0.75,      // 75% - assume neutral/satisfied
  optimistic: 0.80     // 80% - assume satisfied
};

// Validate by comparing to actual response patterns
async function validateNonResponseScore() {
  // Get orders where consumer eventually responded (late)
  const lateResponses = await supabase
    .from('review_requests')
    .select('*, reviews(*)')
    .not('review_id', 'is', null)
    .gt('responded_at', 'expires_at');  // Responded after expiry
  
  // Calculate average rating of late responses
  const avgLateRating = lateResponses.data.reduce(
    (sum, r) => sum + r.reviews.rating, 0
  ) / lateResponses.data.length;
  
  const normalizedScore = avgLateRating / 5;
  
  console.log(`Late response average: ${normalizedScore}`);
  // If result is ~0.75, then 75% is correct non-response score
}
```

### **Recommended Approach:**

```typescript
// Use 75% (3.75/5 stars) as baseline
const NON_RESPONSE_SCORE = 0.75;

// Rationale:
// - Not angry enough to complain (would be 1-2 stars)
// - Not excited enough to praise (would be 5 stars)
// - Service was acceptable/satisfactory
// - Aligns with "neutral" on 5-star scale
```

---

## 📋 **ADMIN DASHBOARD**

### **Review Request Monitoring:**

```tsx
<Box>
  <Typography variant="h5">Review Request Analytics</Typography>
  
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Courier</TableCell>
        <TableCell>Requests Sent</TableCell>
        <TableCell>Response Rate</TableCell>
        <TableCell>Avg Rating (Responses)</TableCell>
        <TableCell>TrustScore (With Non-Responses)</TableCell>
        <TableCell>Impact</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>PostNord</TableCell>
        <TableCell>1,000</TableCell>
        <TableCell>10%</TableCell>
        <TableCell>4.2 / 5 (84%)</TableCell>
        <TableCell>77%</TableCell>
        <TableCell>
          <Chip label="-7%" color="warning" size="small" />
          <Typography variant="caption">
            Non-responses lowered score
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>DHL</TableCell>
        <TableCell>500</TableCell>
        <TableCell>15%</TableCell>
        <TableCell>3.5 / 5 (70%)</TableCell>
        <TableCell>71%</TableCell>
        <TableCell>
          <Chip label="+1%" color="success" size="small" />
          <Typography variant="caption">
            Non-responses raised score
          </Typography>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</Box>
```

---

## ✅ **BENEFITS**

1. **More accurate TrustScore** - Accounts for silent majority
2. **Prevents negative bias** - Only angry customers don't skew results
3. **Complete tracking** - Know exactly what happened with each request
4. **Email optimization** - Improve open/click rates
5. **Courier insights** - See why TrustScore is what it is
6. **Fair comparison** - All couriers measured same way

---

## 🚀 **IMPLEMENTATION**

**Phase 2: Engagement Features (3-4 weeks)**

**Database:**
```sql
CREATE TABLE review_requests (...);
ALTER TABLE reviews ADD COLUMN request_id UUID;
```

**Email Integration:**
- SendGrid or Mailgun with webhook tracking
- Review request email template
- Tracking open/click events

**TrustScore Calculation:**
- Include non-responses at 75% score
- Recalculate daily
- Show breakdown to couriers

---

## 📊 **EXAMPLE SCENARIO**

### **Courier A (Good Service, Low Response Rate):**

```
100 deliveries last month
10 review requests responded (10% response rate)
  - 8 × 5 stars
  - 2 × 4 stars
  - Average: 4.8 / 5 = 96%

90 non-responses
  - Counted as 75% each

TrustScore:
  (10 × 0.96 + 90 × 0.75) / 100 = 0.771
  = 77% TrustScore

Without non-responses:
  96% TrustScore (misleading - only 10 samples)

With non-responses:
  77% TrustScore (realistic - 100 samples)
```

---

**Document:** `docs/daily/2025-11-08/REVIEW_TRACKING_AND_TRUSTSCORE.md`

**This prevents the "only angry people review" bias!** 🎯
