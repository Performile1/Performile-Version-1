# Performile Delivery - Shopify App Deployment Guide

**Date:** October 27, 2025  
**Version:** 1.0.0  
**Status:** 🚀 READY FOR DEPLOYMENT

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **✅ Prerequisites**

- [ ] Shopify Partners account created
- [ ] Development store created
- [ ] Node.js 20.x installed
- [ ] Shopify CLI installed (`npm install -g @shopify/cli`)
- [ ] Performile production API accessible
- [ ] Database for session storage (Supabase)
- [ ] Hosting platform selected (Vercel/Heroku/Railway)

### **✅ Required Credentials**

- [ ] Shopify API Key
- [ ] Shopify API Secret
- [ ] Performile API URL
- [ ] Database connection string
- [ ] Hosting platform account

---

## 🎯 DEPLOYMENT OPTIONS

### **Option A: Vercel (Recommended)** ⭐

**Pros:**
- ✅ Serverless (no server management)
- ✅ Auto-scaling
- ✅ Free tier available
- ✅ Easy GitHub integration
- ✅ Fast global CDN

**Cons:**
- ❌ 10-second function timeout (may need upgrade)
- ❌ Cold starts

**Cost:** Free for development, $20/month for Pro

---

### **Option B: Railway**

**Pros:**
- ✅ Always-on server (no cold starts)
- ✅ Simple deployment
- ✅ Built-in database
- ✅ Good for Node.js apps

**Cons:**
- ❌ $5/month minimum

**Cost:** $5-20/month

---

### **Option C: Heroku**

**Pros:**
- ✅ Mature platform
- ✅ Good documentation
- ✅ Add-ons ecosystem

**Cons:**
- ❌ No free tier
- ❌ More expensive

**Cost:** $7-25/month

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Prepare the App**

#### **1.1 Install Dependencies**

```bash
cd apps/shopify/performile-delivery
npm install
```

#### **1.2 Create Environment File**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=read_orders,write_orders,read_customers,read_shipping
HOST=https://your-app-url.com

# Server Configuration
PORT=3000
NODE_ENV=production

# Performile API
PERFORMILE_API_URL=https://frontend-two-swart-31.vercel.app/api
PERFORMILE_API_KEY=your_performile_api_key

# Database (for session storage)
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

### **Step 2: Create Shopify App**

#### **2.1 Login to Shopify Partners**

1. Go to https://partners.shopify.com
2. Click "Apps" → "Create app"
3. Choose "Create app manually"
4. Fill in app details:
   - **App name:** Performile Delivery Ratings
   - **App URL:** https://your-app-url.com
   - **Allowed redirection URL(s):** https://your-app-url.com/auth/callback

#### **2.2 Get API Credentials**

1. Copy **API key** → Add to `.env` as `SHOPIFY_API_KEY`
2. Copy **API secret key** → Add to `.env` as `SHOPIFY_API_SECRET`

#### **2.3 Configure App Settings**

1. **App setup:**
   - Embedded app: Yes
   - App URL: https://your-app-url.com
   
2. **API access scopes:**
   - `read_orders`
   - `write_orders`
   - `read_customers`
   - `read_shipping`

3. **Webhooks:**
   - `orders/create` → https://your-app-url.com/api/webhooks/orders
   - `orders/updated` → https://your-app-url.com/api/webhooks/orders

---

### **Step 3: Deploy to Hosting Platform**

#### **Option A: Deploy to Vercel**

**3.1 Install Vercel CLI**

```bash
npm install -g vercel
```

**3.2 Create `vercel.json`**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**3.3 Deploy**

```bash
vercel
```

Follow prompts:
- Link to existing project? No
- Project name: performile-delivery-shopify
- Directory: ./
- Override settings? No

**3.4 Add Environment Variables**

```bash
vercel env add SHOPIFY_API_KEY
vercel env add SHOPIFY_API_SECRET
vercel env add DATABASE_URL
vercel env add PERFORMILE_API_URL
```

**3.5 Deploy to Production**

```bash
vercel --prod
```

Copy the production URL (e.g., `https://performile-delivery-shopify.vercel.app`)

---

#### **Option B: Deploy to Railway**

**3.1 Install Railway CLI**

```bash
npm install -g @railway/cli
```

**3.2 Login**

```bash
railway login
```

**3.3 Initialize Project**

```bash
railway init
```

**3.4 Add Environment Variables**

```bash
railway variables set SHOPIFY_API_KEY=your_key
railway variables set SHOPIFY_API_SECRET=your_secret
railway variables set DATABASE_URL=your_db_url
railway variables set PERFORMILE_API_URL=https://frontend-two-swart-31.vercel.app/api
railway variables set NODE_ENV=production
```

**3.5 Deploy**

```bash
railway up
```

Copy the production URL from Railway dashboard.

---

### **Step 4: Update Shopify App Configuration**

#### **4.1 Update App URLs**

1. Go to Shopify Partners → Your App → App setup
2. Update:
   - **App URL:** https://your-production-url.com
   - **Allowed redirection URL(s):** https://your-production-url.com/auth/callback

#### **4.2 Update `shopify.app.toml`**

```toml
name = "performile-delivery"
client_id = "YOUR_ACTUAL_CLIENT_ID"
application_url = "https://your-production-url.com"
embedded = true

[access_scopes]
scopes = "read_orders,write_orders,read_customers,read_shipping"

[auth]
redirect_urls = [
  "https://your-production-url.com/auth/callback"
]

[webhooks]
api_version = "2024-01"

[[webhooks.subscriptions]]
topics = [ "orders/create", "orders/updated" ]
uri = "/api/webhooks/orders"

[build]
automatically_update_urls_on_dev = true
dev_store_url = "your-dev-store.myshopify.com"
```

---

### **Step 5: Test on Development Store**

#### **5.1 Install App**

1. Go to Shopify Partners → Your App
2. Click "Select store" → Choose your development store
3. Click "Install app"
4. Approve permissions

#### **5.2 Enable Checkout Extension**

1. In Shopify Admin → Settings → Checkout
2. Scroll to "Checkout extensions"
3. Find "Performile Courier Ratings"
4. Click "Add" or "Enable"
5. Drag to desired position in checkout
6. Click "Save"

#### **5.3 Test Checkout Flow**

1. Add product to cart
2. Go to checkout
3. Enter shipping address with postal code
4. Verify courier ratings appear
5. Complete test order
6. Check order attributes for saved courier data

---

### **Step 6: Configure Extension Settings**

#### **6.1 Customize Display**

In Shopify Admin → Settings → Checkout → Extensions:

1. Click on "Performile Courier Ratings"
2. Configure:
   - **Section Title:** "Top Rated Couriers in Your Area"
   - **Number of Couriers:** 3
   - **API URL:** https://frontend-two-swart-31.vercel.app/api
   - **Merchant ID:** your_merchant_id

3. Click "Save"

---

## 🧪 TESTING CHECKLIST

### **Functional Testing**

- [ ] App installs successfully
- [ ] OAuth flow works
- [ ] Checkout extension appears
- [ ] Courier ratings load when postal code entered
- [ ] Ratings display correctly (stars, reviews, delivery time)
- [ ] Courier selection saves to order attributes
- [ ] Webhooks receive order data
- [ ] Analytics tracking works

### **Error Handling**

- [ ] Invalid postal code shows no error (hides gracefully)
- [ ] API timeout handled
- [ ] No couriers found handled
- [ ] Network errors don't break checkout

### **Performance**

- [ ] Ratings load in <3 seconds
- [ ] No checkout slowdown
- [ ] Mobile responsive
- [ ] Works on all browsers

---

## 📊 MONITORING & ANALYTICS

### **Key Metrics to Track**

1. **Installation Metrics:**
   - App installs
   - Active stores
   - Uninstall rate

2. **Usage Metrics:**
   - Checkout views with extension
   - Courier ratings displayed
   - Courier selections made
   - Conversion rate impact

3. **Performance Metrics:**
   - API response times
   - Error rates
   - Webhook success rate

### **Monitoring Tools**

- **Vercel Analytics** (if using Vercel)
- **Shopify App Analytics** (Partners dashboard)
- **Performile Dashboard** (courier analytics)
- **Error Tracking:** Sentry or similar

---

## 🚨 TROUBLESHOOTING

### **Issue: App won't install**

**Solution:**
- Check API credentials in `.env`
- Verify redirect URLs match exactly
- Check app is not in draft mode

### **Issue: Courier ratings not showing**

**Solution:**
- Check API endpoint is accessible
- Verify postal code format
- Check browser console for errors
- Verify extension is enabled in checkout settings

### **Issue: Webhooks not working**

**Solution:**
- Verify webhook URL is correct
- Check webhook signature verification
- Test webhook endpoint directly
- Check Shopify Partners → Webhooks for delivery status

### **Issue: Session errors**

**Solution:**
- Verify DATABASE_URL is correct
- Check database connection
- Implement session storage (currently TODO in code)

---

## 🔒 SECURITY CHECKLIST

- [ ] API keys stored in environment variables (not code)
- [ ] Webhook signatures verified
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection

---

## 📝 POST-DEPLOYMENT TASKS

### **1. Submit for Review**

1. Go to Shopify Partners → Your App
2. Click "Submit for review"
3. Fill in:
   - App description
   - Screenshots
   - Demo video
   - Privacy policy URL
   - Support email
4. Submit

**Review Timeline:** 2-4 weeks

### **2. Create App Listing**

1. App name and tagline
2. App icon (512x512px)
3. Screenshots (1280x720px, 3-5 images)
4. Feature list
5. Pricing tiers (if applicable)
6. Support documentation

### **3. Marketing Materials**

- [ ] Landing page
- [ ] Demo video
- [ ] Documentation site
- [ ] Support email/chat
- [ ] Social media accounts

---

## 💰 PRICING STRATEGY

### **Option 1: Free**

- Good for initial traction
- Build user base
- Collect feedback

### **Option 2: Freemium**

- Free: Up to 100 orders/month
- Pro: $19/month - Unlimited orders
- Enterprise: $49/month - Priority support

### **Option 3: Commission-Based**

- Free to install
- Small fee per order with courier selection
- Aligns incentives with merchants

**Recommendation:** Start with Free, add paid tiers after 100+ installs

---

## 📈 GROWTH STRATEGY

### **Phase 1: Launch (Month 1-2)**

- Submit to Shopify App Store
- Reach out to 10-20 beta merchants
- Collect feedback
- Fix bugs

**Goal:** 50 installs

### **Phase 2: Optimize (Month 3-4)**

- Improve based on feedback
- Add requested features
- Optimize performance
- Create case studies

**Goal:** 200 installs

### **Phase 3: Scale (Month 5-6)**

- Launch paid tiers
- Content marketing
- Shopify Partner webinars
- Influencer partnerships

**Goal:** 500+ installs

---

## 🎯 SUCCESS METRICS

### **Short-term (3 months)**

- 100+ app installs
- 4.5+ star rating
- <5% uninstall rate
- 50+ active merchants

### **Long-term (12 months)**

- 1,000+ app installs
- $5,000+ MRR (if paid)
- Featured in Shopify App Store
- 10+ case studies

---

## 📞 SUPPORT

### **For Merchants**

- **Email:** support@performile.com
- **Docs:** https://performile.com/docs/shopify
- **Chat:** In-app support

### **For Developers**

- **GitHub:** https://github.com/performile/shopify-app
- **Issues:** https://github.com/performile/shopify-app/issues
- **Slack:** #shopify-app channel

---

## 🔄 MAINTENANCE

### **Regular Tasks**

**Weekly:**
- Monitor error logs
- Check webhook delivery rates
- Review performance metrics

**Monthly:**
- Update dependencies
- Security patches
- Feature updates
- User feedback review

**Quarterly:**
- Shopify API version updates
- Major feature releases
- Performance optimization

---

## 📚 RESOURCES

### **Shopify Documentation**

- [App Development](https://shopify.dev/docs/apps)
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
- [App Bridge](https://shopify.dev/docs/api/app-bridge)
- [Webhooks](https://shopify.dev/docs/apps/webhooks)

### **Performile Documentation**

- [API Documentation](https://performile.com/docs/api)
- [Courier Ratings API](https://performile.com/docs/api/couriers)
- [Analytics API](https://performile.com/docs/api/analytics)

---

## ✅ DEPLOYMENT CHECKLIST

**Pre-Deployment:**
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] API endpoints verified
- [ ] Code reviewed and tested

**Deployment:**
- [ ] App deployed to hosting platform
- [ ] Shopify app created in Partners
- [ ] API credentials configured
- [ ] Webhooks configured
- [ ] Checkout extension uploaded

**Post-Deployment:**
- [ ] Installed on development store
- [ ] Checkout extension enabled
- [ ] End-to-end testing complete
- [ ] Error monitoring setup
- [ ] Analytics configured

**App Store Submission:**
- [ ] App listing created
- [ ] Screenshots uploaded
- [ ] Demo video created
- [ ] Privacy policy published
- [ ] Support documentation ready
- [ ] Submitted for review

---

**Status:** 📋 READY FOR DEPLOYMENT  
**Next Step:** Choose hosting platform and deploy  
**Estimated Time:** 2-3 hours for full deployment  
**Difficulty:** Medium

---

**Created:** October 27, 2025  
**Last Updated:** October 27, 2025  
**Version:** 1.0.0
