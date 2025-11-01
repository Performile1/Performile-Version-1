# SHOPIFY APP DEPLOYMENT GUIDE

**Date:** November 1, 2025, 9:18 PM  
**Status:** Ready to Deploy  
**Scopes:** Already configured ✅

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Navigate to Shopify App Directory**

```bash
cd apps/shopify/performile-delivery
```

---

### **Step 2: Deploy the App**

```bash
npm run deploy
```

**What happens:**
1. Shopify CLI will ask you to login (opens browser)
2. Select your Shopify Partner account
3. Select the app to deploy to
4. Confirm deployment

---

### **Step 3: Approve New Scopes**

After deployment, you need to **uninstall and reinstall** the app to approve new scopes:

**In Shopify Admin:**
1. Go to **Apps** → **Performile Delivery**
2. Click **Uninstall app**
3. Go to **Shopify App Store** (or use install link)
4. Click **Install app**
5. **Approve new scopes:**
   - ✅ `read_checkouts`
   - ✅ `write_checkouts`
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_customers`
   - ✅ `read_shipping`
   - ✅ `write_shipping`

---

### **Step 4: Configure Extension Settings**

**In Shopify Admin → Checkout Settings:**

1. Find **Performile Delivery Ratings** extension
2. Click **Settings**
3. Configure:
   - **API URL:** `https://frontend-two-swart-31.vercel.app`
   - **Merchant ID:** (your merchant UUID from database)
   - **Enable Analytics:** `true`

**Get your Merchant ID:**
```sql
SELECT user_id, email FROM users WHERE user_role = 'merchant';
```

---

### **Step 5: Test Checkout**

1. Go to your Shopify store
2. Add a product to cart
3. Go to checkout
4. **Verify:**
   - ✅ Courier options appear
   - ✅ TrustScore displayed
   - ✅ No 401 errors in console
   - ✅ Selection tracked in database

**Check Database:**
```sql
SELECT * FROM checkout_courier_analytics 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📋 CURRENT CONFIGURATION

### **Scopes (Already Added)** ✅

```toml
[access_scopes]
scopes = "read_orders,write_orders,read_customers,read_shipping,write_shipping,read_checkouts,write_checkouts"
```

### **Webhooks** ✅

```toml
[[webhooks.subscriptions]]
topics = [ "orders/create", "orders/updated" ]
uri = "/api/webhooks/orders"
```

### **App URL** ✅

```toml
application_url = "https://performile-delivery-jm98ihmmx-rickard-wigrunds-projects.vercel.app"
```

---

## 🔧 TROUBLESHOOTING

### **Issue: 401 Unauthorized in Checkout**

**Cause:** Extension calling authenticated endpoint

**Solution:**
- Use public endpoint: `/api/public/checkout-analytics-track`
- No JWT token required
- Merchant ID from extension settings

---

### **Issue: Extension Not Showing**

**Cause:** Not enabled in checkout settings

**Solution:**
1. Shopify Admin → **Settings** → **Checkout**
2. Scroll to **Checkout extensions**
3. Find **Performile Delivery Ratings**
4. Click **Enable**

---

### **Issue: No Analytics Data**

**Cause:** Extension not configured or API URL wrong

**Solution:**
1. Check extension settings (API URL, Merchant ID)
2. Check browser console for errors
3. Verify database table exists:
   ```sql
   SELECT * FROM checkout_courier_analytics LIMIT 1;
   ```

---

## 📊 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] App deployed successfully
- [ ] New scopes approved
- [ ] Extension enabled in checkout
- [ ] Extension settings configured
- [ ] Checkout shows courier options
- [ ] TrustScore displayed
- [ ] No console errors
- [ ] Analytics data flowing to database
- [ ] RLS policies working (merchant can see own data)

---

## 🎯 SUCCESS CRITERIA

**Deployment is successful when:**

1. ✅ App deployed to Shopify
2. ✅ New scopes approved
3. ✅ Extension visible in checkout
4. ✅ Courier options displayed
5. ✅ TrustScore shown
6. ✅ Analytics tracked in database
7. ✅ No errors in console
8. ✅ Merchant can view analytics

---

## 📝 POST-DEPLOYMENT

### **Monitor Analytics**

```sql
-- Check analytics data
SELECT 
  DATE(event_timestamp) as date,
  COUNT(*) as total_displays,
  COUNT(*) FILTER (WHERE was_selected = true) as selections,
  ROUND(COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / COUNT(*) * 100, 2) as conversion_rate
FROM checkout_courier_analytics
GROUP BY DATE(event_timestamp)
ORDER BY date DESC;
```

### **Test Merchant Access**

```sql
-- As merchant (using RLS)
SET ROLE merchant;
SELECT * FROM checkout_courier_analytics WHERE merchant_id = 'your-merchant-id';
```

### **Test Courier Access**

```sql
-- As courier (using RLS)
SET ROLE courier;
SELECT * FROM checkout_courier_analytics WHERE courier_id = 'your-courier-id';
```

---

## 🚨 IMPORTANT NOTES

### **Two Vercel Projects**

Remember the architecture:

**Project 1 - Main Platform:**
- URL: `https://frontend-two-swart-31.vercel.app`
- Contains: All APIs, business logic
- Extension calls this for analytics

**Project 2 - Shopify App:**
- URL: `https://performile-delivery-jm98ihmmx-rickard-wigrunds-projects.vercel.app`
- Contains: OAuth, webhooks, extension hosting
- Extension hosted here

**Extension Flow:**
1. Extension hosted on Project 2
2. Extension calls APIs on Project 1
3. Analytics saved to database
4. Merchant views data via Project 1

---

## 📚 RELATED DOCUMENTATION

- `docs/2025-11-01/SHOPIFY_COMPLETE_FIX_SUMMARY.md` - Previous fixes
- `docs/2025-11-01/SHOPIFY_TWO_VERCEL_PROJECTS.md` - Architecture
- `docs/2025-11-01/CHECKOUT_ANALYTICS_ACCESS_CONTROL.md` - RLS policies
- `api/public/checkout-analytics-track.ts` - Public endpoint

---

## ✅ DEPLOYMENT COMMAND

**Run this in terminal:**

```bash
cd apps/shopify/performile-delivery
npm run deploy
```

**Then follow the prompts!**

---

*Ready to deploy? Run the command above!* 🚀
