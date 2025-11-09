# 💳 VIPPS PAYMENT INTEGRATION

**Date:** November 9, 2025  
**Status:** COMPLETE ✅  
**API Version:** ePayment API v1

---

## 📋 OVERVIEW

Vipps is Norway's leading mobile payment solution with 4+ million users. This integration enables Norwegian merchants and couriers to pay for Performile subscriptions using Vipps.

**Features:**
- ✅ One-time payments for subscriptions
- ✅ Automatic subscription activation
- ✅ Webhook handling for payment events
- ✅ Refund support
- ✅ Test and production environments

---

## 🔧 SETUP

### **1. Vipps Account Setup**

**Requirements:**
1. Norwegian business (organization number)
2. Vipps merchant account
3. API credentials from Vipps Portal

**Get Credentials:**
1. Go to [Vipps Portal](https://portal.vipps.no)
2. Navigate to "Utvikler" (Developer)
3. Create API keys
4. Note down:
   - Client ID
   - Client Secret
   - Subscription Key (Ocp-Apim-Subscription-Key)
   - Merchant Serial Number (MSN)

---

### **2. Environment Variables**

Add to `.env` or Vercel environment variables:

```bash
# Vipps Configuration
VIPPS_ENV=test                          # 'test' or 'production'
VIPPS_CLIENT_ID=your-client-id
VIPPS_CLIENT_SECRET=your-client-secret
VIPPS_SUBSCRIPTION_KEY=your-subscription-key
VIPPS_MERCHANT_SERIAL_NUMBER=123456
```

**Test Environment:**
- API Base URL: `https://apitest.vipps.no`
- Use test credentials from Vipps Test Portal

**Production Environment:**
- API Base URL: `https://api.vipps.no`
- Use production credentials from Vipps Portal

---

### **3. Database Migration**

Run the Vipps database migration:

```bash
psql $DATABASE_URL -f database/migrations/add_vipps_payments.sql
```

**What it creates:**
- `vipps_payments` table
- Indexes for performance
- RLS policies for security
- Columns on `users` and `subscriptions` tables

---

### **4. Webhook Configuration**

**In Vipps Portal:**
1. Go to "Webhooks" section
2. Add webhook URL: `https://your-domain.com/api/vipps/webhook`
3. Select events:
   - `epayments.payment.authorized.v1`
   - `epayments.payment.captured.v1`
   - `epayments.payment.cancelled.v1`
   - `epayments.payment.aborted.v1`
   - `epayments.payment.expired.v1`
   - `epayments.payment.refunded.v1`

**Webhook Authentication:**
- Vipps sends `Authorization: Bearer <token>` header
- Verify this header in webhook handler

---

## 🚀 USAGE

### **Frontend Integration**

**1. Create Payment:**

```typescript
// In subscription page or checkout
const createVippsPayment = async (planId: string) => {
  try {
    const response = await fetch('/api/vipps/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        planId: planId,
        returnUrl: `${window.location.origin}/subscription/success`,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect user to Vipps checkout
      window.location.href = data.data.checkoutUrl;
    } else {
      console.error('Failed to create payment:', data.error);
    }
  } catch (error) {
    console.error('Error creating Vipps payment:', error);
  }
};
```

**2. Handle Return:**

```typescript
// On /subscription/success page
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  
  if (reference) {
    // Check payment status
    checkPaymentStatus(reference);
  }
}, []);

const checkPaymentStatus = async (reference: string) => {
  // Poll for payment status
  // Webhook will activate subscription in background
  // Show success message to user
};
```

---

## 📊 API ENDPOINTS

### **POST /api/vipps/create-payment**

Create a new Vipps payment for subscription.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "planId": "uuid",
  "returnUrl": "https://your-domain.com/subscription/success"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://api.vipps.no/dwo-api-application/v1/deeplink/vippsgateway?v=2&token=...",
    "reference": "SUB-user-id-1699564800000",
    "paymentId": "vipps-payment-id"
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to create Vipps payment",
  "message": "Detailed error message"
}
```

---

### **POST /api/vipps/webhook**

Webhook endpoint for Vipps payment events.

**Authentication:** Vipps Authorization header

**Request Body:**
```json
{
  "name": "epayments.payment.captured.v1",
  "reference": "SUB-user-id-1699564800000",
  "timestamp": "2025-11-09T14:05:00Z",
  "idempotencyKey": "unique-key"
}
```

**Response:**
```json
{
  "success": true
}
```

**Handled Events:**
- `epayments.payment.authorized.v1` - Payment authorized
- `epayments.payment.captured.v1` - Payment captured (activates subscription)
- `epayments.payment.cancelled.v1` - Payment cancelled by user
- `epayments.payment.aborted.v1` - Payment aborted
- `epayments.payment.expired.v1` - Payment expired
- `epayments.payment.refunded.v1` - Payment refunded (deactivates subscription)

---

## 🔄 PAYMENT FLOW

### **Happy Path:**

```
1. User clicks "Pay with Vipps"
   ↓
2. Frontend calls /api/vipps/create-payment
   ↓
3. Backend creates payment with Vipps API
   ↓
4. Backend stores payment in database (status: INITIATED)
   ↓
5. Backend returns checkoutUrl to frontend
   ↓
6. Frontend redirects user to Vipps app/web
   ↓
7. User approves payment in Vipps
   ↓
8. Vipps sends webhook: epayments.payment.authorized.v1
   ↓
9. Backend updates status to AUTHORIZED
   ↓
10. Vipps captures payment automatically
    ↓
11. Vipps sends webhook: epayments.payment.captured.v1
    ↓
12. Backend updates status to CAPTURED
    ↓
13. Backend activates subscription
    ↓
14. User redirected to success page
```

### **Cancellation Flow:**

```
1. User clicks "Pay with Vipps"
   ↓
2. Payment created (status: INITIATED)
   ↓
3. User redirected to Vipps
   ↓
4. User cancels payment
   ↓
5. Vipps sends webhook: epayments.payment.cancelled.v1
   ↓
6. Backend updates status to CANCELLED
   ↓
7. User redirected to cancel page
```

---

## 💾 DATABASE SCHEMA

### **vipps_payments Table:**

```sql
CREATE TABLE vipps_payments (
  payment_id UUID PRIMARY KEY,
  reference VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(plan_id),
  amount INTEGER NOT NULL,              -- Amount in øre (NOK cents)
  currency VARCHAR(3) NOT NULL,         -- 'NOK'
  status VARCHAR(50) NOT NULL,          -- Payment status
  vipps_payment_id VARCHAR(255),        -- Vipps internal ID
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Status Values:**
- `INITIATED` - Payment created, waiting for user
- `AUTHORIZED` - User approved, payment reserved
- `CAPTURED` - Payment completed successfully
- `CANCELLED` - User cancelled payment
- `EXPIRED` - Payment link expired
- `REFUNDED` - Payment refunded

---

## 🧪 TESTING

### **Test Environment:**

**Test Credentials:**
- Use test credentials from Vipps Test Portal
- Set `VIPPS_ENV=test`

**Test Phone Numbers:**
Vipps provides test phone numbers for different scenarios:
- `90000000` - Successful payment
- `90000001` - Payment cancelled by user
- `90000002` - Payment expired

**Test Cards:**
- Not needed - Vipps uses phone numbers

---

### **Test Cases:**

**1. Successful Payment:**
```
□ Create payment with test plan
□ Use test phone number 90000000
□ Approve payment in test app
□ Verify webhook received
□ Verify subscription activated
□ Verify user can access features
```

**2. Cancelled Payment:**
```
□ Create payment
□ Cancel in Vipps app
□ Verify webhook received
□ Verify status updated to CANCELLED
□ Verify subscription NOT activated
```

**3. Expired Payment:**
```
□ Create payment
□ Wait for expiration (15 minutes)
□ Verify webhook received
□ Verify status updated to EXPIRED
```

**4. Refund:**
```
□ Complete successful payment
□ Issue refund via Vipps Portal
□ Verify webhook received
□ Verify subscription deactivated
```

---

## 🔒 SECURITY

### **Best Practices:**

**1. Webhook Verification:**
- ✅ Verify `Authorization` header
- ✅ Check webhook signature (if provided)
- ✅ Validate reference exists in database
- ✅ Prevent replay attacks (idempotency key)

**2. API Security:**
- ✅ Store credentials in environment variables
- ✅ Never expose credentials in frontend
- ✅ Use HTTPS only
- ✅ Implement rate limiting

**3. Data Protection:**
- ✅ RLS policies on vipps_payments table
- ✅ Users can only see their own payments
- ✅ Admins can see all payments
- ✅ Log sensitive operations

---

## 📊 MONITORING

### **Key Metrics:**

**Payment Success Rate:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'CAPTURED') * 100.0 / COUNT(*) as success_rate
FROM vipps_payments
WHERE created_at > NOW() - INTERVAL '30 days';
```

**Average Payment Time:**
```sql
SELECT 
  AVG(updated_at - created_at) as avg_payment_time
FROM vipps_payments
WHERE status = 'CAPTURED'
  AND created_at > NOW() - INTERVAL '30 days';
```

**Failed Payments:**
```sql
SELECT status, COUNT(*) as count
FROM vipps_payments
WHERE status IN ('CANCELLED', 'EXPIRED')
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY status;
```

---

## 🐛 TROUBLESHOOTING

### **Common Issues:**

**1. "Failed to authenticate with Vipps"**
- Check `VIPPS_CLIENT_ID` and `VIPPS_CLIENT_SECRET`
- Verify credentials are for correct environment (test/prod)
- Check subscription key is valid

**2. "Payment not found"**
- Verify reference format: `SUB-{user_id}-{timestamp}`
- Check database for payment record
- Verify webhook is hitting correct endpoint

**3. "Webhook not received"**
- Check webhook URL in Vipps Portal
- Verify HTTPS is enabled
- Check server logs for incoming requests
- Test webhook manually with curl

**4. "Subscription not activated"**
- Check webhook handler logs
- Verify `epayments.payment.captured.v1` event received
- Check subscription table for record
- Verify user_id and plan_id are correct

---

## 📚 RESOURCES

### **Official Documentation:**
- [Vipps ePayment API](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/)
- [Vipps Webhooks](https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/)
- [Vipps Test Environment](https://developer.vippsmobilepay.com/docs/developer-resources/test-environment/)

### **Support:**
- Vipps Developer Portal: https://portal.vipps.no
- Vipps Support: integration@vipps.no
- Vipps Slack: https://vippsas.slack.com

---

## ✅ CHECKLIST

### **Implementation:**
- ✅ API endpoints created
- ✅ Database migration created
- ✅ Webhook handler implemented
- ✅ Error handling added
- ✅ Logging implemented
- ✅ Documentation complete

### **Configuration:**
- ⏳ Vipps merchant account created
- ⏳ API credentials obtained
- ⏳ Environment variables set
- ⏳ Webhook URL configured
- ⏳ Test environment verified

### **Testing:**
- ⏳ Test payment flow
- ⏳ Test webhook events
- ⏳ Test cancellation
- ⏳ Test refund
- ⏳ Production verification

---

## 🎯 NEXT STEPS

**Immediate:**
1. Set up Vipps merchant account
2. Get API credentials
3. Configure environment variables
4. Run database migration
5. Test in test environment

**Before Production:**
1. Complete all test cases
2. Verify webhook handling
3. Set up monitoring
4. Configure production credentials
5. Update frontend to show Vipps option

---

**STATUS:** ✅ IMPLEMENTATION COMPLETE  
**TESTING:** ⏳ PENDING CREDENTIALS  
**PRODUCTION:** ⏳ PENDING TESTING

---

**Last Updated:** November 9, 2025, 2:15 PM
