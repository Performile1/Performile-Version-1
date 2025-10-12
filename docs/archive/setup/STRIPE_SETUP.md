# Stripe Payment Integration Setup Guide

## ✅ What's Already Done

The Stripe integration is fully coded and ready to use:
- ✅ Stripe SDK installed (`@stripe/stripe-js` + `stripe`)
- ✅ Checkout session creation
- ✅ Customer portal for subscription management
- ✅ Webhook handler for Stripe events
- ✅ Database schema updated
- ✅ UI components created

## 🎯 Setup Steps (15 minutes)

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up for free account
3. Complete business verification (can use test mode immediately)

### Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. Copy these keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Add to Environment Variables

**Local Development (.env.local):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Vercel Production:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | pk_live_xxx | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | sk_live_xxx | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | whsec_xxx | Production, Preview, Development |

### Step 4: Set Up Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://frontend-two-swart-31.vercel.app/api/stripe/webhook`
4. **Events to send:** Select these:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to environment variables as `STRIPE_WEBHOOK_SECRET`

### Step 5: Run Database Migration

Run this SQL in your Supabase database:
```bash
psql $DATABASE_URL < database/add-stripe-fields.sql
```

Or manually in Supabase SQL Editor:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255) UNIQUE;
```

### Step 6: Configure Stripe Products (Optional)

The system will auto-create Stripe prices from your subscription plans, but you can also:

1. Go to Stripe Dashboard → **Products**
2. Create products manually
3. Copy price IDs and update `subscription_plans` table:
```sql
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxx' 
WHERE plan_id = 1;
```

### Step 7: Test the Integration

**Test Mode (Recommended First):**
1. Use test API keys (`pk_test_` and `sk_test_`)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any CVC

**Test Flow:**
1. Go to subscription page
2. Click "Subscribe" on a plan
3. Should redirect to Stripe Checkout
4. Enter test card details
5. Complete checkout
6. Should redirect back to dashboard
7. Check database - subscription should be created

## 📊 What Happens When User Subscribes

1. **User clicks "Subscribe"** → Creates Stripe checkout session
2. **Redirects to Stripe** → User enters payment details
3. **Stripe processes payment** → Sends webhook to your server
4. **Webhook handler** → Creates/updates subscription in database
5. **User redirected back** → Dashboard shows active subscription

## 🔄 Subscription Lifecycle

### Events Handled:

**checkout.session.completed**
- Triggered when user completes checkout
- Logs the completion

**customer.subscription.created/updated**
- Creates or updates subscription in database
- Sets status (active, trialing, past_due, etc.)
- Records billing period dates

**customer.subscription.deleted**
- Marks subscription as cancelled
- Records cancellation date

**invoice.payment_succeeded**
- Resets usage counters for new billing period
- Confirms payment received

**invoice.payment_failed**
- Updates status to past_due
- Triggers notification (TODO)

## 💳 Customer Portal

Users can manage their subscription via Stripe Customer Portal:
- Update payment method
- View invoices
- Cancel subscription
- Update billing info

Access via: `/api/stripe/create-portal-session`

## 🎁 Free Trial

- **14-day free trial** included automatically
- No credit card required during trial
- After trial, first payment is charged
- Can cancel anytime during trial

## 🔒 Security Features

✅ **Webhook signature verification** - Ensures events are from Stripe
✅ **Secure API keys** - Stored in environment variables
✅ **Customer validation** - Links Stripe customers to users
✅ **Metadata tracking** - Stores user_id and plan_id in Stripe

## 📈 Monitoring

**Stripe Dashboard:**
- View all payments
- Track subscriptions
- Monitor failed payments
- Download reports

**Your Database:**
- `user_subscriptions` table tracks all subscriptions
- `usage_logs` table tracks usage
- Real-time status updates via webhooks

## 🐛 Troubleshooting

**Issue: Webhook not receiving events**
- Check webhook URL is correct
- Verify webhook secret is set
- Check Stripe webhook logs

**Issue: Payment fails**
- Check API keys are correct
- Verify test mode vs live mode
- Check Stripe dashboard for errors

**Issue: Subscription not created**
- Check webhook handler logs
- Verify database connection
- Check user_id and plan_id in metadata

## 💰 Pricing

**Stripe Fees:**
- 2.9% + $0.30 per successful charge
- No monthly fees
- No setup fees

**Free Tier:**
- Unlimited API calls
- Test mode forever free
- Production mode: pay per transaction

## 🚀 Going Live

1. **Switch to live mode** in Stripe Dashboard
2. **Get live API keys** (pk_live_ and sk_live_)
3. **Update environment variables** in Vercel
4. **Update webhook URL** to production
5. **Test with real card** (small amount)
6. **Monitor first few transactions**

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

**Total Setup Time:** 15 minutes  
**Status:** Ready to accept payments! 💳
