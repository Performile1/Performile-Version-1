# 🧪 Plugin Testing Guide - Shopify & WooCommerce

**Status:** Both plugins exist and ready for testing  
**Date:** October 13, 2025

---

## 📦 **What We Have**

### ✅ **Shopify App** (With Analytics Tracking!)
**Location:** `apps/shopify/performile-delivery/`

**Features:**
- ✅ Checkout UI extension
- ✅ Displays top-rated couriers
- ✅ Fetches ratings by postal code
- ✅ Saves courier selection
- ✅ **NEW: Tracks checkout positions** 🎉
- ✅ **NEW: Tracks selections** 🎉
- ✅ **NEW: Captures order data** 🎉

**Status:** **READY TO TEST** with analytics!

---

### ✅ **WooCommerce Plugin** (Needs Analytics Tracking)
**Location:** `plugins/woocommerce/performile-delivery/`

**Features:**
- ✅ WordPress plugin
- ✅ Displays couriers in checkout
- ✅ WooCommerce integration
- ❌ **NOT YET: Analytics tracking** (needs to be added)

**Status:** **Works but no analytics yet**

---

## 🚀 **Testing Shopify App (With Analytics)**

### **Prerequisites:**

1. **Shopify Partner Account**
   - Sign up at https://partners.shopify.com
   - Create a development store

2. **Shopify CLI Installed**
   ```bash
   npm install -g @shopify/cli
   ```

3. **Backend Running**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Database Schema Deployed**
   - Run `courier-checkout-analytics-FRESH.sql` in Supabase

---

### **Step 1: Install Shopify App**

```bash
cd apps/shopify/performile-delivery

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
shopify app dev
```

**What happens:**
- CLI will prompt you to select a store
- App will be installed on your dev store
- Extension will be deployed
- Browser will open to app settings

---

### **Step 2: Configure App Settings**

In Shopify Admin:

1. Go to **Apps** → **Performile Delivery**
2. Configure settings:
   - **merchant_id**: Your merchant UUID from database
   - **api_url**: `https://frontend-two-swart-31.vercel.app/api`
   - **num_couriers**: 3
   - **title**: "Top Rated Couriers in Your Area"

3. **Enable the extension:**
   - Go to **Settings** → **Checkout**
   - Find "Performile Delivery Ratings"
   - Enable it
   - Position: After shipping method

---

### **Step 3: Test Checkout Flow**

1. **Create test products:**
   - Product A: $50, weight: 2kg
   - Product B: $30, weight: 1kg

2. **Add to cart and checkout:**
   - Add both products to cart
   - Click "Checkout"
   - Enter shipping address:
     - Postal code: 10001 (or any valid code)
     - City: New York
     - Country: USA

3. **Wait for couriers to load:**
   - Should see 3 couriers displayed
   - Each with ratings, reviews, delivery time

4. **Check browser console:**
   ```javascript
   // Should see tracking calls:
   // POST /api/courier/checkout-analytics/track (3 times for display)
   ```

5. **Select a courier:**
   - Click on courier #2
   - Should highlight as selected

6. **Check console again:**
   ```javascript
   // Should see selection tracking:
   // POST /api/courier/checkout-analytics/track (1 time for selection)
   ```

---

### **Step 4: Verify Database**

```sql
-- Check display tracking (should have 3 records)
SELECT 
  position_shown,
  courier_id,
  was_selected,
  checkout_session_id,
  order_value,
  items_count,
  package_weight_kg,
  delivery_postal_code,
  delivery_city,
  delivery_country,
  created_at
FROM courier_checkout_positions
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results:**
- ✅ 3 records with `was_selected = false` (positions 1, 2, 3)
- ✅ 1 record with `was_selected = true` (position 2)
- ✅ Same `checkout_session_id` for all 4 records
- ✅ `order_value` = 80.00 (50 + 30)
- ✅ `items_count` = 2
- ✅ `package_weight_kg` = 3.0 (2 + 1)
- ✅ `delivery_postal_code` = "10001"
- ✅ `delivery_city` = "New York"
- ✅ `delivery_country` = "US"

---

### **Step 5: View Dashboard**

1. Log in as courier (one of the tracked couriers)
2. Navigate to `/courier/checkout-analytics`
3. Verify data appears:
   - Summary cards show metrics
   - Position distribution chart
   - Top merchants table

---

## 🛒 **Testing WooCommerce Plugin (Without Analytics)**

### **Prerequisites:**

1. **WordPress Site**
   - Local: Use Local by Flywheel or XAMPP
   - Staging: Use staging site

2. **WooCommerce Installed**
   - Install WooCommerce plugin
   - Complete setup wizard

3. **Backend Running**
   ```bash
   cd backend
   npm run dev
   ```

---

### **Step 1: Install Plugin**

**Option A: Manual Installation**
```bash
# Zip the plugin
cd plugins/woocommerce
zip -r performile-delivery.zip performile-delivery/

# Upload to WordPress:
# 1. Go to Plugins → Add New → Upload
# 2. Choose performile-delivery.zip
# 3. Click "Install Now"
# 4. Click "Activate"
```

**Option B: Direct Copy**
```bash
# Copy to WordPress plugins directory
cp -r plugins/woocommerce/performile-delivery /path/to/wordpress/wp-content/plugins/

# Activate in WordPress admin
```

---

### **Step 2: Configure Plugin**

In WordPress Admin:

1. Go to **Performile** → **Settings**
2. Configure:
   - **Enable**: Yes
   - **API Key**: Your Performile API key
   - **Number of Couriers**: 3
   - **Position**: Before payment
   - **Title**: "Top Rated Couriers in Your Area"

3. Click **Save Changes**

---

### **Step 3: Test Checkout**

1. **Create test products:**
   - Product A: $50
   - Product B: $30

2. **Add to cart and checkout:**
   - Add products to cart
   - Go to checkout
   - Enter shipping address with postal code

3. **Verify couriers display:**
   - Should see courier ratings section
   - Shows 3 top-rated couriers
   - Displays ratings, reviews, delivery time

4. **Complete order:**
   - Select courier
   - Complete payment
   - Order should be created

---

### **Step 4: Check Order Attributes**

In WordPress Admin:

1. Go to **WooCommerce** → **Orders**
2. Open the test order
3. Check order meta:
   - `_performile_courier_id`
   - `_performile_courier_name`

---

### **⚠️ WooCommerce Analytics NOT YET IMPLEMENTED**

The WooCommerce plugin currently:
- ✅ Displays couriers
- ✅ Saves selection
- ❌ Does NOT track positions
- ❌ Does NOT send analytics data

**To add analytics tracking to WooCommerce, we need to:**
1. Add tracking functions (similar to Shopify)
2. Call `/track` endpoint on display
3. Call `/track` endpoint on selection
4. Capture order data from WooCommerce

---

## 📊 **Comparison**

| Feature | Shopify | WooCommerce |
|---------|---------|-------------|
| Display Couriers | ✅ | ✅ |
| Save Selection | ✅ | ✅ |
| Track Positions | ✅ | ❌ |
| Track Selections | ✅ | ❌ |
| Capture Order Value | ✅ | ❌ |
| Capture Items Count | ✅ | ❌ |
| Capture Weight | ✅ | ❌ |
| Capture Address | ✅ | ❌ |
| Dashboard Analytics | ✅ | ❌ |

---

## 🎯 **Next Steps**

### **For Shopify (Ready Now!):**
1. ✅ Test in dev store
2. ✅ Verify analytics tracking
3. ✅ Check dashboard display
4. ⏳ Deploy to production
5. ⏳ Submit to Shopify App Store

### **For WooCommerce (Needs Work):**
1. ⏳ Add analytics tracking code
2. ⏳ Test tracking functionality
3. ⏳ Verify dashboard display
4. ⏳ Deploy to WordPress.org
5. ⏳ Submit for review

---

## 🐛 **Common Issues**

### **Shopify Issues:**

**1. Extension not showing in checkout**
- Check extension is enabled in Settings → Checkout
- Verify app is installed on store
- Clear browser cache

**2. Tracking not working**
- Check `merchant_id` is set in settings
- Verify backend is running
- Check CORS configuration
- Look for errors in browser console

**3. No couriers displayed**
- Verify postal code is valid
- Check API endpoint is accessible
- Ensure couriers exist for that postal code

---

### **WooCommerce Issues:**

**1. Plugin not activating**
- Check WooCommerce is installed
- Verify PHP version (7.4+)
- Check for plugin conflicts

**2. Couriers not showing**
- Verify API key is correct
- Check plugin is enabled
- Ensure position setting is correct

**3. Styling issues**
- Check theme compatibility
- Verify CSS is loading
- Test with default theme

---

## 📝 **Testing Checklist**

### **Shopify:**
- [ ] App installs successfully
- [ ] Extension appears in checkout
- [ ] Couriers load when address entered
- [ ] 3 display records created in database
- [ ] Selection tracking works
- [ ] Order data captured correctly
- [ ] Address data captured
- [ ] Dashboard shows data
- [ ] Charts render correctly
- [ ] No console errors

### **WooCommerce:**
- [ ] Plugin installs successfully
- [ ] Settings page accessible
- [ ] Couriers display in checkout
- [ ] Selection saved to order
- [ ] Order meta contains courier info
- [ ] No PHP errors
- [ ] Works with default theme

---

## 🚀 **Quick Start Commands**

### **Shopify:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Shopify App
cd apps/shopify/performile-delivery && shopify app dev

# Terminal 3: Database
psql -d performile -c "SELECT * FROM courier_checkout_positions ORDER BY created_at DESC LIMIT 5;"
```

### **WooCommerce:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: WordPress (if using Local)
# Start Local site

# Terminal 3: Database
psql -d performile -c "SELECT * FROM courier_checkout_positions ORDER BY created_at DESC LIMIT 5;"
```

---

## 📚 **Documentation Links**

**Shopify:**
- App README: `apps/shopify/performile-delivery/README.md`
- Extension Code: `apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx`
- Shopify Docs: https://shopify.dev/docs/apps/checkout

**WooCommerce:**
- Plugin Main File: `plugins/woocommerce/performile-delivery/performile-delivery.php`
- Checkout Class: `plugins/woocommerce/performile-delivery/includes/class-performile-checkout.php`
- WooCommerce Docs: https://woocommerce.com/document/

---

## ✅ **Success Criteria**

**Shopify (With Analytics):**
- ✅ Couriers display in checkout
- ✅ Analytics tracking works
- ✅ Database records created
- ✅ Dashboard shows data
- ✅ No errors in console
- ✅ Performance acceptable

**WooCommerce (Display Only):**
- ✅ Couriers display in checkout
- ✅ Selection saved to order
- ✅ No PHP errors
- ✅ Works with major themes
- ⏳ Analytics tracking (future)

---

**Ready to test! Start with Shopify since it has full analytics tracking! 🚀**
