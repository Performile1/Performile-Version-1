# Email & Notification Strategy - Performile Platform

**Date:** October 6, 2025, 16:31  
**Status:** Implementation Plan

---

## 🎯 **User Flow Overview**

### Order Creation Flow
```
E-commerce Store (Shopify/WooCommerce)
    ↓
Order Created
    ↓
Webhook → Performile API
    ↓
1. Create Order in Performile DB
2. Send Review Request Link to Customer
3. Schedule Reminder (5-10 days)
    ↓
Customer Receives Email with Review Link
    ↓
Customer Clicks → Opens Review Form
    ↓
Customer Submits Review
    ↓
Review Saved → Courier/Merchant Notified
```

---

## 📧 **Email Types & Triggers**

### 1. Welcome Email
**Trigger:** New user registration  
**Recipient:** New user  
**Content:**
- Welcome message
- Platform overview
- Getting started guide
- Login link

**Priority:** Medium

---

### 2. Order Confirmation (From E-commerce)
**Trigger:** Order created via webhook  
**Recipient:** Customer  
**Content:**
- Order details
- Tracking information
- **Review request link** (unique per order)
- Expected delivery date

**Priority:** HIGH - Critical for review collection

**Implementation:**
```
POST /api/webhooks/shopify (or /woocommerce)
↓
1. Parse order data
2. Create order in DB
3. Generate unique review link: 
   https://performile.app/review/{order_id}/{token}
4. Send email with review link
5. Schedule reminder for 7 days later
```

---

### 3. Review Request Reminder
**Trigger:** 5-10 days after order delivery  
**Recipient:** Customer  
**Content:**
- Reminder about order
- Review request link (same as original)
- Incentive (optional: "Help us improve!")

**Priority:** HIGH - Increases review completion rate

**Implementation:**
- Use cron job or scheduled task
- Check orders delivered 7 days ago
- Send reminder if no review submitted
- Mark as "reminder_sent" in DB

---

### 4. Review Request (Direct from Performile)
**Trigger:** Manual or automated from merchant dashboard  
**Recipient:** Customer  
**Content:**
- Personalized message from merchant
- Review link
- Order details

**Priority:** Medium

---

### 5. Password Reset
**Trigger:** User clicks "Forgot Password"  
**Recipient:** User  
**Content:**
- Reset link (expires in 1 hour)
- Security message
- Support contact

**Priority:** HIGH - Critical for user access

---

### 6. Notification Emails
**Trigger:** Various platform events  
**Recipient:** Users (based on preferences)  
**Content:**
- New review received
- Order status update
- Message received
- Trust score updated

**Priority:** Medium

**Implementation:**
- Add email option to existing notification system
- User preference: Email + In-app, Email only, In-app only, Push only

---

### 7. PWA Push Notifications (Future)
**Trigger:** Same as notification emails  
**Recipient:** Users with PWA installed  
**Content:** Same as in-app notifications

**Priority:** LOW - After PWA is ready

---

## 🔧 **Technical Implementation**

### Phase 1: Email Service Setup (30 min)
1. Create Resend account
2. Verify domain
3. Install Resend SDK
4. Add API key to environment variables

### Phase 2: Email Templates (1 hour)
1. Create React Email templates
2. Design responsive layouts
3. Add branding (logo, colors)
4. Test rendering

### Phase 3: E-commerce Webhook Integration (2 hours)
1. Update `/api/webhooks/index.ts`
2. Add Shopify webhook handler
3. Add WooCommerce webhook handler
4. Parse order data
5. Generate review links
6. Send order confirmation email
7. Schedule review reminder

### Phase 4: Review Request Automation (1 hour)
1. Create cron job endpoint: `/api/cron/send-review-reminders`
2. Query orders delivered 7 days ago
3. Check if review exists
4. Send reminder email
5. Update order status

### Phase 5: Notification Email Integration (30 min)
1. Update notification system
2. Add email sending option
3. Add user preferences
4. Test email delivery

### Phase 6: Testing (30 min)
1. Test all email types
2. Verify links work
3. Check spam scores
4. Test automation

---

## 📋 **Database Changes Needed**

### Orders Table - Add Columns
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_link_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_link_token VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
```

### Users Table - Add Preferences
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;
```

---

## 🔗 **API Endpoints Needed**

### New Endpoints
1. `POST /api/webhooks/shopify` - Handle Shopify order webhooks
2. `POST /api/webhooks/woocommerce` - Handle WooCommerce order webhooks
3. `GET /api/cron/send-review-reminders` - Automated reminder job
4. `POST /api/email/send` - Generic email sending
5. `GET /api/review/{order_id}/{token}` - Public review form

### Existing Endpoints to Update
1. `/api/webhooks/index.ts` - Add order creation logic
2. `/api/notifications/index.ts` - Add email option

---

## 📧 **Email Templates to Create**

1. **welcome.tsx** - Welcome new users
2. **order-confirmation.tsx** - Order created with review link
3. **review-reminder.tsx** - Reminder to leave review
4. **password-reset.tsx** - Password reset link
5. **notification.tsx** - Generic notification template
6. **review-request.tsx** - Direct review request from merchant

---

## ⏰ **Automation Schedule**

### Cron Jobs Needed
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-review-reminders",
      "schedule": "0 10 * * *" // Daily at 10 AM
    }
  ]
}
```

---

## 🎨 **Email Design Guidelines**

### Branding
- Use Performile colors (purple gradient)
- Include logo
- Professional but friendly tone
- Mobile-responsive

### Content
- Clear call-to-action buttons
- Short paragraphs
- Personalized (use customer name)
- Include unsubscribe link (legal requirement)

### Technical
- Plain text fallback
- Test in multiple email clients
- Keep under 102KB (Gmail clipping)
- Optimize images

---

## 🔐 **Security Considerations**

### Review Links
- Generate unique token per order
- Token expires after 30 days
- One-time use (optional)
- Validate token before showing form

### Email Sending
- Rate limiting (prevent spam)
- Verify email addresses
- SPF/DKIM/DMARC records
- Monitor bounce rates

---

## 📊 **Success Metrics**

### Email Performance
- Open rate: Target 25%+
- Click rate: Target 10%+
- Bounce rate: Keep under 5%
- Unsubscribe rate: Keep under 1%

### Review Collection
- Review completion rate: Target 15%+
- Reminder effectiveness: Target 5% additional
- Average time to review: Track

---

## 🚀 **Implementation Priority**

### HIGH Priority (Do First)
1. ✅ Set up Resend
2. ✅ E-commerce webhook integration
3. ✅ Order confirmation with review link
4. ✅ Review reminder automation
5. ✅ Password reset email

### MEDIUM Priority (Do Next)
6. Welcome email
7. Notification emails
8. Direct review requests

### LOW Priority (Future)
9. PWA push notifications
10. SMS notifications
11. Advanced email analytics

---

## 💡 **Recommendations**

### For Beta Launch (Oct 12)
**Must Have:**
- ✅ E-commerce webhook integration
- ✅ Review request emails
- ✅ Password reset emails

**Nice to Have:**
- Welcome emails
- Notification emails

**Can Wait:**
- PWA push notifications
- SMS

### Email Service Choice
**Resend** - Recommended
- Easy setup
- Good deliverability
- React Email templates
- Generous free tier (3,000 emails/month)
- Great developer experience

---

## 📝 **Next Steps**

1. Set up Resend account
2. Create email templates
3. Implement webhook handlers
4. Build review reminder automation
5. Test end-to-end flow
6. Deploy to production

**Estimated Time:** 5-6 hours total

---

**Ready to start implementation?** 🚀
