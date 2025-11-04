# REVIEW SYSTEM STATUS & GAPS ANALYSIS - November 4, 2025

**Date:** November 4, 2025, 4:33 PM  
**Purpose:** Analyze current review/rating system and identify missing features  
**Priority:** HIGH - Critical for launch

---

## 🎯 YOUR QUESTIONS ANSWERED

### **Q1: Is TrustScore, Review, Rating, and ETA working?**

**TrustScore:** ✅ **WORKING**
- Function exists: `calculate_courier_trustscore()`
- Database column: `couriers.trust_score`
- Calculation: Based on ratings, on-time delivery, completion rate
- Status: Functional but needs UI integration

**Reviews:** ⚠️ **PARTIALLY WORKING**
- Table exists: `reviews`
- Can create reviews manually
- Missing: Automated review request system
- Missing: Review request emails/SMS

**Ratings:** ✅ **WORKING**
- Part of reviews table
- Average rating calculated
- Displayed in UI

**ETA:** ⚠️ **PARTIALLY WORKING**
- Static ETA in `orders.estimated_delivery`
- Missing: Real-time ETA updates from courier APIs
- Missing: ETA change tracking

---

### **Q2: Do we send out rating/review links after set days?**

**Answer:** ❌ **NOT IMPLEMENTED YET**

**What EXISTS:**
- ✅ Database tables for review requests
- ✅ Settings table for automation
- ❌ No automated sending system
- ❌ No email/SMS integration
- ❌ No background job/worker

---

### **Q3: Should this be in merchant settings?**

**Answer:** ✅ **YES - NEEDS TO BE BUILT**

**What's MISSING:**
- Merchant settings UI for review automation
- Configuration options
- Email/SMS template customization
- Timing settings

---

## 📊 CURRENT STATUS

### **✅ WHAT EXISTS (Database)**

#### **1. Review Request Tables**

**reviewrequestsettings:**
```sql
- settings_id UUID
- user_id UUID (merchant/courier)
- user_role VARCHAR(50)
- auto_request_enabled BOOLEAN (default: false)
- request_delay_days INTEGER (default: 3)
- request_method VARCHAR(50) (email, sms, both)
- email_template_id UUID
- sms_template_id UUID
- max_requests_per_order INTEGER (default: 2)
- request_interval_days INTEGER (default: 7)
- only_request_delivered BOOLEAN (default: true)
- include_review_link BOOLEAN (default: true)
- custom_message TEXT
- created_at, updated_at TIMESTAMP
```

**reviewrequests:**
```sql
- request_id UUID
- order_id UUID
- requester_id UUID (merchant/courier)
- recipient_id UUID (customer)
- request_type VARCHAR(50) (email, sms, in_app)
- status VARCHAR(50) (pending, sent, opened, completed, declined, expired)
- scheduled_for TIMESTAMP
- sent_at TIMESTAMP
- opened_at TIMESTAMP
- completed_at TIMESTAMP
- review_id UUID (if completed)
- metadata JSONB
- created_at TIMESTAMP
```

**reviewrequestresponses:**
```sql
- response_id UUID
- request_id UUID
- action VARCHAR(50) (opened, clicked, declined, completed)
- action_timestamp TIMESTAMP
- metadata JSONB
- created_at TIMESTAMP
```

#### **2. TrustScore Function**
```sql
CREATE OR REPLACE FUNCTION calculate_courier_trustscore(p_courier_id UUID)
RETURNS NUMERIC AS $$
-- Calculates TrustScore based on:
-- - Average rating (40%)
-- - On-time delivery rate (30%)
-- - Completion rate (20%)
-- - Total reviews (10%)
$$;
```

---

### **❌ WHAT'S MISSING**

#### **1. Automated Review Request System**

**Missing Components:**
- ❌ Background worker/cron job
- ❌ Email sending integration
- ❌ SMS sending integration
- ❌ Review request scheduler
- ❌ Retry logic for failed sends

**Needed:**
```typescript
// Backend worker
// File: backend/src/workers/review-request-worker.ts

export class ReviewRequestWorker {
  async processScheduledRequests() {
    // 1. Find orders ready for review request
    // 2. Check merchant settings
    // 3. Create review request
    // 4. Send email/SMS
    // 5. Update status
  }
  
  async scheduleReviewRequest(orderId: string) {
    // Calculate send time based on settings
    // Create pending request
  }
}
```

---

#### **2. Merchant Settings UI**

**Missing Page:** `apps/web/src/pages/settings/ReviewSettings.tsx`

**Required Features:**
- ☐ Enable/disable automated reviews
- ☐ Set delay days (after delivery)
- ☐ Choose method (email, SMS, both)
- ☐ Customize message template
- ☐ Set max requests per order
- ☐ Set retry interval
- ☐ Preview email/SMS
- ☐ Test send functionality

---

#### **3. Email/SMS Templates**

**Missing Tables:**
```sql
CREATE TABLE IF NOT EXISTS email_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(user_id),
    template_type VARCHAR(50), -- 'review_request', 'review_reminder'
    subject VARCHAR(200),
    body_html TEXT,
    body_text TEXT,
    variables JSONB, -- {customer_name}, {order_number}, {review_link}
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(user_id),
    template_type VARCHAR(50),
    message TEXT, -- Max 160 characters
    variables JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### **4. Email/SMS Service Integration**

**Options:**

**For Email:**
- SendGrid (recommended)
- AWS SES
- Mailgun
- Postmark

**For SMS:**
- Twilio (recommended)
- AWS SNS
- MessageBird
- Vonage

**Implementation:**
```typescript
// backend/src/services/email-service.ts
export class EmailService {
  async sendReviewRequest(request: ReviewRequest) {
    // Use SendGrid API
    // Send personalized email
    // Track delivery status
  }
}

// backend/src/services/sms-service.ts
export class SMSService {
  async sendReviewRequest(request: ReviewRequest) {
    // Use Twilio API
    // Send SMS with review link
    // Track delivery status
  }
}
```

---

#### **5. Review Link Generation**

**Missing:**
```typescript
// Generate unique review link
// Format: https://performile.com/review/{token}

export function generateReviewLink(orderId: string): string {
  const token = generateSecureToken(orderId);
  return `https://performile.com/review/${token}`;
}

// Review page that accepts token
// apps/web/src/pages/Review.tsx
```

---

#### **6. Tracking Status Updates**

**Missing Integration:**
- ❌ Webhook from tracking system
- ❌ Trigger review request on "delivered"
- ❌ Handle "lost" or "missing" status

**Needed:**
```typescript
// When order status changes to "delivered"
async function onOrderDelivered(orderId: string) {
  // Get merchant settings
  const settings = await getMerchantReviewSettings(merchantId);
  
  if (settings.auto_request_enabled) {
    // Schedule review request
    const sendDate = addDays(new Date(), settings.request_delay_days);
    await scheduleReviewRequest(orderId, sendDate);
  }
}
```

---

#### **7. Real-time ETA Updates**

**Missing:**
- ❌ Courier API integration for live tracking
- ❌ ETA update worker
- ❌ ETA change notifications

**Needed:**
```sql
CREATE TABLE IF NOT EXISTS eta_updates (
    update_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id),
    courier_id UUID REFERENCES couriers(courier_id),
    previous_eta TIMESTAMP WITH TIME ZONE,
    new_eta TIMESTAMP WITH TIME ZONE,
    change_reason VARCHAR(100), -- 'delay', 'early', 'reroute'
    source VARCHAR(50), -- 'courier_api', 'manual', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 WHAT YOU'RE MISSING (Additional Suggestions)

### **1. Review Incentives**

**Missing:**
- ☐ Discount codes for leaving reviews
- ☐ Loyalty points for reviews
- ☐ Entry into prize draw

**Implementation:**
```sql
CREATE TABLE IF NOT EXISTS review_incentives (
    incentive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(user_id),
    incentive_type VARCHAR(50), -- 'discount', 'points', 'prize_draw'
    value DECIMAL(10,2), -- Discount amount or points
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **2. Review Moderation**

**Missing:**
- ☐ Auto-moderation for profanity
- ☐ Merchant response to reviews
- ☐ Flag inappropriate reviews
- ☐ Review verification (confirmed purchase)

**Implementation:**
```sql
ALTER TABLE reviews
ADD COLUMN is_verified BOOLEAN DEFAULT false,
ADD COLUMN is_flagged BOOLEAN DEFAULT false,
ADD COLUMN flag_reason TEXT,
ADD COLUMN merchant_response TEXT,
ADD COLUMN merchant_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN moderation_status VARCHAR(50) DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'
```

---

### **3. Review Analytics**

**Missing:**
- ☐ Review request conversion rate
- ☐ Average time to review
- ☐ Review sentiment analysis
- ☐ Most common complaints/praises

**Implementation:**
```sql
CREATE TABLE IF NOT EXISTS review_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(user_id),
    period_start DATE,
    period_end DATE,
    
    -- Request metrics
    requests_sent INTEGER DEFAULT 0,
    requests_opened INTEGER DEFAULT 0,
    requests_completed INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    
    -- Review metrics
    total_reviews INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),
    avg_time_to_review_hours INTEGER,
    
    -- Sentiment
    positive_reviews INTEGER DEFAULT 0,
    neutral_reviews INTEGER DEFAULT 0,
    negative_reviews INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **4. Multi-Channel Review Requests**

**Missing:**
- ☐ In-app notifications
- ☐ WhatsApp messages
- ☐ Push notifications (mobile app)

**Future Channels:**
- WhatsApp Business API
- Push notifications (Firebase)
- In-app notification center

---

### **5. Review Reminders**

**Missing:**
- ☐ Automatic reminder if no response
- ☐ Configurable reminder schedule
- ☐ Different message for reminders

**Implementation:**
```typescript
// Send reminder after X days if not completed
async function sendReviewReminder(requestId: string) {
  const request = await getReviewRequest(requestId);
  
  if (request.status === 'sent' && !request.completed_at) {
    const daysSinceSent = daysBetween(request.sent_at, new Date());
    const settings = await getMerchantSettings(request.requester_id);
    
    if (daysSinceSent >= settings.reminder_interval_days) {
      await sendReminderEmail(request);
      await updateRequestStatus(requestId, 'reminded');
    }
  }
}
```

---

### **6. Review Widgets**

**Missing:**
- ☐ Embeddable review widget for merchant websites
- ☐ Review carousel
- ☐ Review badge (average rating)
- ☐ Recent reviews feed

**Implementation:**
```html
<!-- Embeddable widget -->
<script src="https://performile.com/widgets/reviews.js"></script>
<div id="performile-reviews" data-merchant-id="uuid"></div>
```

---

### **7. Review Import**

**Missing:**
- ☐ Import reviews from other platforms
- ☐ Sync with Google Reviews
- ☐ Sync with Trustpilot
- ☐ Bulk upload CSV

---

### **8. Photo/Video Reviews**

**Missing:**
- ☐ Allow customers to upload photos
- ☐ Allow video reviews
- ☐ Photo gallery in reviews
- ☐ Incentivize photo reviews

**Implementation:**
```sql
CREATE TABLE IF NOT EXISTS review_media (
    media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(review_id),
    media_type VARCHAR(20), -- 'photo', 'video'
    media_url TEXT,
    thumbnail_url TEXT,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **9. Courier-Specific Reviews**

**Current:** Reviews are for orders/merchants  
**Missing:** Separate reviews for couriers

**Implementation:**
```sql
CREATE TABLE IF NOT EXISTS courier_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id),
    courier_id UUID REFERENCES couriers(courier_id),
    customer_id UUID REFERENCES users(user_id),
    
    -- Ratings (1-5)
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    delivery_speed_rating INTEGER,
    package_condition_rating INTEGER,
    driver_professionalism_rating INTEGER,
    communication_rating INTEGER,
    
    -- Review
    review_text TEXT,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **10. Review Request A/B Testing**

**Missing:**
- ☐ Test different email subjects
- ☐ Test different send times
- ☐ Test different incentives
- ☐ Track which performs best

---

## 📋 IMPLEMENTATION PRIORITY

### **Phase 1: Critical (Week 2-3) - $800**

1. ✅ **Merchant Review Settings UI** (4 hours - $200)
   - Enable/disable automation
   - Set delay days
   - Choose method (email/SMS)
   - Customize message

2. ✅ **Email Integration** (6 hours - $300)
   - SendGrid setup
   - Email templates
   - Send review requests
   - Track delivery

3. ✅ **Review Request Scheduler** (4 hours - $200)
   - Background worker
   - Schedule based on delivery
   - Retry failed sends

4. ✅ **Review Link & Page** (2 hours - $100)
   - Generate secure tokens
   - Public review page
   - Submit review flow

---

### **Phase 2: Important (Week 4-5) - $600**

5. ✅ **SMS Integration** (4 hours - $200)
   - Twilio setup
   - SMS templates
   - Send SMS requests

6. ✅ **Review Reminders** (3 hours - $150)
   - Automatic reminders
   - Configurable schedule

7. ✅ **Review Analytics** (4 hours - $200)
   - Conversion tracking
   - Dashboard metrics
   - Performance reports

8. ✅ **Merchant Response** (2 hours - $100)
   - Reply to reviews
   - Public responses

---

### **Phase 3: Nice-to-Have (Post-Launch) - $1,200**

9. ✅ **Review Incentives** (4 hours - $200)
   - Discount codes
   - Loyalty points

10. ✅ **Photo/Video Reviews** (6 hours - $300)
    - Upload functionality
    - Media gallery

11. ✅ **Courier Reviews** (6 hours - $300)
    - Separate courier ratings
    - Courier-specific metrics

12. ✅ **Review Widgets** (6 hours - $300)
    - Embeddable widgets
    - Review badges

13. ✅ **Real-time ETA** (4 hours - $200)
    - Courier API integration
    - ETA tracking

---

## 🎯 IMMEDIATE ACTION ITEMS

### **This Week (Nov 4-8):**

**Day 1 (Today - Nov 4):**
- [ ] Create merchant review settings UI mockup
- [ ] Design email template
- [ ] Plan SendGrid integration

**Day 2 (Nov 5):**
- [ ] Build review settings page
- [ ] Integrate SendGrid
- [ ] Create default email template

**Day 3 (Nov 6):**
- [ ] Build review request scheduler
- [ ] Create review link generation
- [ ] Build public review page

**Day 4 (Nov 7):**
- [ ] Test automated review requests
- [ ] Add review analytics
- [ ] Document system

**Day 5 (Nov 8):**
- [ ] Polish and bug fixes
- [ ] End-to-end testing
- [ ] Week 2 retrospective

---

## 💰 BUDGET ALLOCATION

**Week 2 Budget:** $2,000  
**Review System:** $800 (40%)

**Breakdown:**
- Settings UI: $200
- Email integration: $300
- Scheduler: $200
- Review page: $100

**Week 3 Budget:** $1,000  
**Review System:** $600 (60%)

**Breakdown:**
- SMS integration: $200
- Reminders: $150
- Analytics: $200
- Merchant response: $100

---

## ✅ SUCCESS CRITERIA

### **Phase 1 Complete When:**
- [ ] Merchants can enable automated reviews
- [ ] Emails sent automatically after delivery
- [ ] Customers can leave reviews via link
- [ ] Reviews appear in system
- [ ] Conversion rate tracked

### **Phase 2 Complete When:**
- [ ] SMS requests working
- [ ] Reminders sent automatically
- [ ] Analytics dashboard shows metrics
- [ ] Merchants can respond to reviews

---

## 📚 RESOURCES NEEDED

### **Services:**
- SendGrid account (email)
- Twilio account (SMS)
- Background job system (Node-cron or similar)

### **Documentation:**
- SendGrid API docs
- Twilio API docs
- Review request best practices

---

*Analysis Created: November 4, 2025, 4:33 PM*  
*Status: Comprehensive gap analysis complete*  
*Priority: HIGH - Critical for launch*  
*Estimated Total Cost: $2,600*  
*Timeline: Week 2-5 (4 weeks)*
