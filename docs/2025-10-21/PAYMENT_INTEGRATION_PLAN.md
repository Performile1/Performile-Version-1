# 💳 PAYMENT INTEGRATION - COMPLETE IMPLEMENTATION PLAN

**Date:** October 21, 2025, 9:15 PM  
**Priority:** 🔴 CRITICAL BLOCKER  
**Status:** Not Started (0%)  
**Estimated Time:** 2-3 days  
**Target Completion:** October 24, 2025

---

## 🎯 OVERVIEW

Payment integration is the **#1 critical blocker** for MVP launch. Without this, users cannot subscribe to plans and no revenue can be generated.

**Impact:**
- 🔴 Blocks MVP launch
- 🔴 Blocks revenue generation
- 🔴 Users cannot pay for subscriptions
- 🔴 Business cannot operate

---

## 📊 CURRENT STATE

### **What We Have:**
- ✅ Subscription plans defined (7 plans)
- ✅ User authentication working
- ✅ Database schema for subscriptions
- ✅ Frontend subscription selection
- ✅ User registration flow

### **What's Missing:**
- ❌ Stripe integration
- ❌ Payment method collection
- ❌ Subscription activation
- ❌ Webhook handlers
- ❌ Invoice generation
- ❌ Payment history
- ❌ Failed payment handling

---

## 🏗️ IMPLEMENTATION PHASES

### **PHASE 1: STRIPE SETUP** (1 hour)

#### **1.1 Create Stripe Account** (15 min)
```bash
# Steps:
1. Go to https://stripe.com
2. Sign up for account
3. Complete business verification
4. Enable test mode
```

#### **1.2 Get API Keys** (5 min)
```bash
# Get from Stripe Dashboard:
- Test Publishable Key: pk_test_...
- Test Secret Key: sk_test_...
- Live Publishable Key: pk_live_...
- Live Secret Key: sk_live_...
```

#### **1.3 Configure Products in Stripe** (30 min)
```typescript
// Create products for each plan:

MERCHANT PLANS:
1. Starter Plan - $29/month or $290/year
2. Growth Plan - $79/month or $790/year
3. Enterprise Plan - $199/month or $1,990/year

COURIER PLANS:
1. Individual Plan - $19/month or $190/year
2. Professional Plan - $49/month or $490/year
3. Fleet Plan - $99/month or $990/year
4. Enterprise Plan - $249/month or $2,490/year
```

#### **1.4 Configure Webhook Endpoint** (10 min)
```bash
# Webhook URL:
https://your-domain.vercel.app/api/webhooks/stripe

# Events to subscribe to:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- payment_intent.succeeded
- payment_intent.payment_failed
```

---

### **PHASE 2: DATABASE SCHEMA** (30 min)

✅ **COMPLETED** - Migration file created!

**File:** `database/migrations/2025-10-21_payment_integration.sql`

**Tables Created:**
1. `payment_methods` - Store user payment methods
2. `payments` - Record all transactions
3. `invoices` - Store subscription invoices
4. `webhook_events` - Log Stripe webhooks

**Functions Created:**
1. `set_default_payment_method()` - Set user's default payment
2. `get_payment_summary()` - Get user's payment summary

**Next Step:** Run migration in Supabase

---

### **PHASE 3: BACKEND API** (1 day)

#### **3.1 Install Dependencies** (5 min)
```bash
cd api
npm install stripe @stripe/stripe-js
```

#### **3.2 Create Stripe Service** (1 hour)

**File:** `api/services/stripeService.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  // Create customer
  async createCustomer(userId: string, email: string, name: string) {
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  // Create subscription
  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId: string
  ) {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });
  }

  // Attach payment method
  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, priceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
    });
  }

  // Get upcoming invoice
  async getUpcomingInvoice(customerId: string) {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  }
}
```

#### **3.3 Create Payment Endpoints** (3 hours)

**File:** `api/payments/create-subscription.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { StripeService } from '../services/stripeService';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const stripeService = new StripeService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, planId, paymentMethodId } = req.body;

    // Get user details
    const userResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE user_id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    // Get plan details
    const planResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE subscription_plan_id = $1',
      [planId]
    );
    const plan = planResult.rows[0];

    // Create or get Stripe customer
    let customerId;
    const existingCustomer = await pool.query(
      'SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (existingCustomer.rows.length > 0 && existingCustomer.rows[0].stripe_customer_id) {
      customerId = existingCustomer.rows[0].stripe_customer_id;
    } else {
      const customer = await stripeService.createCustomer(
        userId,
        user.email,
        `${user.first_name} ${user.last_name}`
      );
      customerId = customer.id;
    }

    // Attach payment method
    await stripeService.attachPaymentMethod(paymentMethodId, customerId);

    // Create subscription
    const subscription = await stripeService.createSubscription(
      customerId,
      plan.stripe_price_id,
      paymentMethodId
    );

    // Save to database
    await pool.query(
      `INSERT INTO user_subscriptions (
        user_id, subscription_plan_id, stripe_subscription_id, 
        stripe_customer_id, status, current_period_start, current_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        subscription_plan_id = $2,
        stripe_subscription_id = $3,
        stripe_customer_id = $4,
        status = $5,
        current_period_start = $6,
        current_period_end = $7,
        updated_at = NOW()`,
      [
        userId,
        planId,
        subscription.id,
        customerId,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
      ]
    );

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
      },
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return res.status(500).json({
      error: 'Failed to create subscription',
      details: error.message,
    });
  }
}
```

**Additional Endpoints Needed:**
1. `POST /api/payments/create-payment-intent` - Create payment intent
2. `POST /api/payments/add-payment-method` - Add payment method
3. `POST /api/payments/set-default-payment-method` - Set default
4. `POST /api/payments/cancel-subscription` - Cancel subscription
5. `POST /api/payments/update-subscription` - Change plan
6. `GET /api/payments/payment-methods` - List payment methods
7. `GET /api/payments/invoices` - List invoices
8. `GET /api/payments/payment-history` - Payment history

#### **3.4 Webhook Handler** (2 hours)

**File:** `api/webhooks/stripe.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Pool } from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log webhook event
  await pool.query(
    `INSERT INTO webhook_events (stripe_event_id, event_type, event_data)
     VALUES ($1, $2, $3)`,
    [event.id, event.type, JSON.stringify(event.data)]
  );

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    await pool.query(
      'UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE stripe_event_id = $1',
      [event.id]
    );

    return res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    await pool.query(
      `UPDATE webhook_events 
       SET processing_error = $1, retry_count = retry_count + 1 
       WHERE stripe_event_id = $2`,
      [error.message, event.id]
    );
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await pool.query(
    `UPDATE user_subscriptions 
     SET status = $1, 
         current_period_start = $2, 
         current_period_end = $3,
         updated_at = NOW()
     WHERE stripe_subscription_id = $4`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id,
    ]
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await pool.query(
    `UPDATE user_subscriptions 
     SET status = 'canceled', 
         canceled_at = NOW(),
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Save invoice
  await pool.query(
    `INSERT INTO invoices (
      user_id, stripe_invoice_id, invoice_number, 
      amount_due, amount_paid, status, period_start, period_end,
      invoice_pdf_url, hosted_invoice_url
    ) VALUES (
      (SELECT user_id FROM user_subscriptions WHERE stripe_customer_id = $1),
      $2, $3, $4, $5, $6, $7, $8, $9, $10
    )
    ON CONFLICT (stripe_invoice_id) DO UPDATE SET
      amount_paid = $5,
      status = $6,
      paid_at = NOW(),
      updated_at = NOW()`,
    [
      invoice.customer,
      invoice.id,
      invoice.number,
      invoice.amount_due / 100,
      invoice.amount_paid / 100,
      invoice.status,
      new Date(invoice.period_start * 1000),
      new Date(invoice.period_end * 1000),
      invoice.invoice_pdf,
      invoice.hosted_invoice_url,
    ]
  );

  // Record payment
  await pool.query(
    `INSERT INTO payments (
      user_id, stripe_invoice_id, amount, status, paid_at
    ) VALUES (
      (SELECT user_id FROM user_subscriptions WHERE stripe_customer_id = $1),
      $2, $3, 'succeeded', NOW()
    )`,
    [invoice.customer, invoice.id, invoice.amount_paid / 100]
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await pool.query(
    `INSERT INTO payments (
      user_id, stripe_invoice_id, amount, status, failure_message
    ) VALUES (
      (SELECT user_id FROM user_subscriptions WHERE stripe_customer_id = $1),
      $2, $3, 'failed', $4
    )`,
    [
      invoice.customer,
      invoice.id,
      invoice.amount_due / 100,
      'Payment failed',
    ]
  );
}
```

---

### **PHASE 4: FRONTEND INTEGRATION** (1 day)

#### **4.1 Install Stripe Elements** (5 min)
```bash
cd apps/web
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### **4.2 Create Payment Form Component** (2 hours)

**File:** `apps/web/src/components/payments/PaymentForm.tsx`

```typescript
import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button, CircularProgress, Alert } from '@mui/material';

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        onError(submitError.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!stripe || isProcessing}
        sx={{ mt: 3 }}
      >
        {isProcessing ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};
```

#### **4.3 Create Subscription Flow** (3 hours)

**File:** `apps/web/src/pages/SubscriptionCheckout.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { apiClient } from '@/services/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Card, CardContent, Typography } from '@mui/material';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const SubscriptionCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const selectedPlan = location.state?.plan;
    if (!selectedPlan) {
      navigate('/subscription/plans');
      return;
    }

    setPlan(selectedPlan);
    createPaymentIntent(selectedPlan);
  }, []);

  const createPaymentIntent = async (plan: any) => {
    try {
      const response = await apiClient.post('/payments/create-payment-intent', {
        planId: plan.subscription_plan_id,
        billingCycle: 'monthly', // or 'yearly'
      });
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    }
  };

  const handleSuccess = () => {
    navigate('/subscription/success');
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (!clientSecret || !plan) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Complete Your Subscription
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">{plan.plan_name}</Typography>
            <Typography variant="h4" color="primary">
              ${plan.monthly_price}/month
            </Typography>
          </Box>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onSuccess={handleSuccess} onError={handleError} />
          </Elements>
        </CardContent>
      </Card>
    </Container>
  );
};
```

#### **4.4 Additional Components** (2 hours)

1. **Payment Methods List** - `PaymentMethodsList.tsx`
2. **Add Payment Method** - `AddPaymentMethod.tsx`
3. **Billing History** - `BillingHistory.tsx`
4. **Invoice Details** - `InvoiceDetails.tsx`
5. **Subscription Success** - `SubscriptionSuccess.tsx`
6. **Payment Failed** - `PaymentFailed.tsx`

---

### **PHASE 5: TESTING** (4 hours)

#### **5.1 Test Payment Flow** (2 hours)

**Test Cases:**
1. ✅ Successful payment with card
2. ✅ Failed payment (insufficient funds)
3. ✅ Declined card
4. ✅ 3D Secure authentication
5. ✅ Subscription activation
6. ✅ Invoice generation
7. ✅ Email notifications
8. ✅ Webhook processing

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
3D Secure: 4000 0025 0000 3155
```

#### **5.2 Test Webhooks** (1 hour)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_failed
```

#### **5.3 Edge Cases** (1 hour)

1. ✅ User cancels during payment
2. ✅ Network timeout
3. ✅ Duplicate submissions
4. ✅ Invalid payment method
5. ✅ Expired card
6. ✅ Subscription already exists

---

## 📋 IMPLEMENTATION CHECKLIST

### **Setup (1 hour)**
- [ ] Create Stripe account
- [ ] Get API keys (test & live)
- [ ] Configure products in Stripe
- [ ] Set up webhook endpoint
- [ ] Add environment variables

### **Database (30 min)**
- [ ] Run payment migration
- [ ] Verify tables created
- [ ] Test RLS policies
- [ ] Add Stripe IDs to subscription_plans

### **Backend (1 day)**
- [ ] Install Stripe SDK
- [ ] Create StripeService
- [ ] Create payment endpoints (8 endpoints)
- [ ] Implement webhook handler
- [ ] Test API endpoints
- [ ] Error handling
- [ ] Logging

### **Frontend (1 day)**
- [ ] Install Stripe Elements
- [ ] Create PaymentForm component
- [ ] Create checkout flow
- [ ] Payment methods management
- [ ] Billing history page
- [ ] Success/failure pages
- [ ] Loading states
- [ ] Error handling

### **Testing (4 hours)**
- [ ] Test payment flow
- [ ] Test webhooks
- [ ] Test edge cases
- [ ] Test error scenarios
- [ ] User acceptance testing

### **Documentation (1 hour)**
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Troubleshooting guide

---

## 🚀 DEPLOYMENT STEPS

### **1. Environment Variables**

**Vercel:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend (.env):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **2. Database Migration**
```bash
# Run in Supabase SQL Editor
\i database/migrations/2025-10-21_payment_integration.sql
```

### **3. Stripe Configuration**
1. Add products & prices
2. Configure webhook endpoint
3. Test webhook delivery
4. Enable live mode (when ready)

### **4. Deploy**
```bash
git add .
git commit -m "feat: Add Stripe payment integration"
git push origin main
```

---

## 💰 COST ESTIMATES

### **Stripe Fees:**
- **Card payments:** 2.9% + $0.30 per transaction
- **ACH/Bank:** 0.8% (capped at $5)
- **International cards:** +1.5%

### **Example Calculations:**

**$29/month plan:**
- Stripe fee: $1.14
- Net revenue: $27.86
- Margin: 96%

**$199/month plan:**
- Stripe fee: $6.07
- Net revenue: $192.93
- Margin: 97%

### **Monthly Volume Estimates:**

| Users | Revenue | Stripe Fees | Net Revenue |
|-------|---------|-------------|-------------|
| 10 | $790 | $34 | $756 |
| 50 | $3,950 | $168 | $3,782 |
| 100 | $7,900 | $336 | $7,564 |
| 500 | $39,500 | $1,680 | $37,820 |

---

## 🎯 SUCCESS CRITERIA

**Payment integration is complete when:**

1. ✅ Users can add payment methods
2. ✅ Users can subscribe to plans
3. ✅ Payments are processed successfully
4. ✅ Subscriptions are activated automatically
5. ✅ Invoices are generated
6. ✅ Webhooks are processed correctly
7. ✅ Failed payments are handled
8. ✅ Users can view billing history
9. ✅ Users can cancel subscriptions
10. ✅ Admin can view all payments

---

## 🚨 CRITICAL NOTES

### **Security:**
- ✅ Never store card details in database
- ✅ Always use Stripe.js for card collection
- ✅ Verify webhook signatures
- ✅ Use HTTPS only
- ✅ Implement rate limiting
- ✅ Log all payment attempts

### **Compliance:**
- ✅ PCI DSS compliance (handled by Stripe)
- ✅ GDPR compliance (data handling)
- ✅ Terms of service
- ✅ Privacy policy
- ✅ Refund policy

### **User Experience:**
- ✅ Clear error messages
- ✅ Loading indicators
- ✅ Success confirmation
- ✅ Email notifications
- ✅ Invoice downloads
- ✅ Easy cancellation

---

## 📞 SUPPORT RESOURCES

### **Stripe Documentation:**
- API Reference: https://stripe.com/docs/api
- Subscriptions: https://stripe.com/docs/billing/subscriptions
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

### **Stripe Dashboard:**
- Test Mode: https://dashboard.stripe.com/test
- Live Mode: https://dashboard.stripe.com

### **Support:**
- Stripe Support: https://support.stripe.com
- Community: https://stripe.com/community

---

## 🎉 NEXT STEPS

### **After Payment Integration:**

1. **Usage Tracking** (2 days)
   - Track orders/month
   - Enforce plan limits
   - Usage dashboard

2. **Email Integration** (1 day)
   - Welcome emails
   - Payment confirmations
   - Invoice emails

3. **Billing History** (1 day)
   - View past invoices
   - Download PDFs
   - Payment history

4. **MVP Launch** 🚀
   - All critical features complete
   - Ready for users
   - Revenue generation starts!

---

**Created:** October 21, 2025, 9:30 PM  
**Priority:** 🔴 CRITICAL  
**Status:** Ready to implement  
**Target:** Complete by October 24, 2025

# 🚀 LET'S BUILD THIS!
