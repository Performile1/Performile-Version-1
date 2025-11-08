# PLUGIN TESTING PLAN - November 8, 2025

**Date:** Saturday, November 8, 2025  
**Focus:** Set up test stores with different payment providers  
**Goal:** Test Performile plugins with Klarna, Qliro, Adyen, Stripe, etc.  
**Duration:** 4-6 hours  

---

## 🎯 OBJECTIVE

Test Performile Shopify and WooCommerce plugins with different payment providers to ensure compatibility and proper checkout flow.

---

## 📋 CURRENT PLUGIN STATUS

### **Shopify Plugin** ✅
- **Status:** 100% Complete - Ready to Deploy
- **Location:** `apps/shopify/performile-delivery/`
- **Features:**
  - ✅ OAuth flow
  - ✅ Checkout UI extension
  - ✅ Courier ratings API
  - ✅ Session storage (Supabase)
  - ✅ Webhook verification
  - ⏸️ Analytics tracking (deferred)

### **WooCommerce Plugin** ✅
- **Status:** Ready for Testing
- **Location:** `plugins/woocommerce/performile-delivery/`
- **Features:**
  - ✅ WordPress plugin structure
  - ✅ WooCommerce integration
  - ✅ Checkout integration
  - ✅ Settings page

---

## 🛍️ TEST STORES TO SET UP

### **Priority 1: Shopify Stores** (3-4 hours)

#### **Store 1: Shopify + Klarna**
- **Platform:** Shopify Development Store
- **Payment:** Klarna Payments
- **Purpose:** Test Nordic payment integration
- **Setup Time:** 45 min

**Steps:**
1. Create Shopify development store
2. Install Klarna Payments app
3. Configure Klarna test credentials
4. Install Performile app
5. Test checkout flow
6. Verify courier selection appears
7. Complete test order

#### **Store 2: Shopify + Qliro**
- **Platform:** Shopify Development Store
- **Payment:** Qliro One
- **Purpose:** Test Swedish payment integration
- **Setup Time:** 45 min

**Steps:**
1. Create Shopify development store
2. Install Qliro One app (if available)
3. Configure Qliro test credentials
4. Install Performile app
5. Test checkout flow
6. Verify courier selection appears
7. Complete test order

#### **Store 3: Shopify + Adyen**
- **Platform:** Shopify Development Store
- **Payment:** Adyen
- **Purpose:** Test enterprise payment integration
- **Setup Time:** 45 min

**Steps:**
1. Create Shopify development store
2. Install Adyen app
3. Configure Adyen test credentials
4. Install Performile app
5. Test checkout flow
6. Verify courier selection appears
7. Complete test order

#### **Store 4: Shopify + Stripe**
- **Platform:** Shopify Development Store
- **Payment:** Stripe (Shopify Payments)
- **Purpose:** Test standard payment integration
- **Setup Time:** 30 min

**Steps:**
1. Create Shopify development store
2. Enable Shopify Payments (Stripe)
3. Configure test mode
4. Install Performile app
5. Test checkout flow
6. Verify courier selection appears
7. Complete test order

#### **Store 5: Shopify + No Payment** (Control)
- **Platform:** Shopify Development Store
- **Payment:** Manual payment / Cash on Delivery
- **Purpose:** Baseline test without payment provider
- **Setup Time:** 20 min

**Steps:**
1. Create Shopify development store
2. Enable manual payment methods only
3. Install Performile app
4. Test checkout flow
5. Verify courier selection appears
6. Complete test order

---

### **Priority 2: WooCommerce Stores** (2-3 hours)

#### **Store 6: WooCommerce + Klarna**
- **Platform:** WordPress + WooCommerce
- **Payment:** Klarna Checkout for WooCommerce
- **Purpose:** Test Nordic payment integration
- **Setup Time:** 60 min

**Steps:**
1. Set up WordPress + WooCommerce
2. Install Klarna Checkout plugin
3. Configure Klarna test credentials
4. Install Performile plugin
5. Test checkout flow
6. Verify courier selection appears
7. Complete test order

#### **Store 7: WooCommerce + Stripe**
- **Platform:** WordPress + WooCommerce
- **Payment:** WooCommerce Stripe Gateway
- **Purpose:** Test standard payment integration
- **Setup Time:** 45 min

**Steps:**
1. Set up WordPress + WooCommerce
2. Install Stripe Gateway plugin
3. Configure Stripe test credentials
4. Install Performile plugin
5. Test checkout flow
6. Verify courier selection appears
7. Complete test order

#### **Store 8: WooCommerce + No Payment** (Control)
- **Platform:** WordPress + WooCommerce
- **Payment:** Cash on Delivery
- **Purpose:** Baseline test without payment provider
- **Setup Time:** 30 min

**Steps:**
1. Set up WordPress + WooCommerce
2. Enable Cash on Delivery only
3. Install Performile plugin
4. Test checkout flow
5. Verify courier selection appears
6. Complete test order

---

## 🔧 SETUP REQUIREMENTS

### **Shopify Requirements:**
- [ ] Shopify Partner account
- [ ] Access to create development stores
- [ ] Performile app deployed to Vercel
- [ ] Test API credentials for payment providers

### **WooCommerce Requirements:**
- [ ] Local WordPress installation OR hosting
- [ ] WooCommerce plugin installed
- [ ] Performile WooCommerce plugin ready
- [ ] Test API credentials for payment providers

### **Payment Provider Credentials:**
- [ ] **Klarna:** Test merchant ID + shared secret
- [ ] **Qliro:** Test merchant ID + API key
- [ ] **Adyen:** Test merchant account + API key
- [ ] **Stripe:** Test publishable key + secret key

---

## 📊 TESTING CHECKLIST

For each store, verify:

### **Checkout Flow:**
- [ ] Performile courier selection appears
- [ ] Courier ratings display correctly
- [ ] Trust scores show properly
- [ ] Delivery time estimates accurate
- [ ] Price comparison visible
- [ ] User can select courier

### **Payment Integration:**
- [ ] Payment provider loads correctly
- [ ] No conflicts with Performile extension
- [ ] Checkout completes successfully
- [ ] Order created in both systems
- [ ] Webhook received (Shopify)
- [ ] Order data saved correctly

### **Data Capture:**
- [ ] Selected courier saved to order
- [ ] Trust score recorded
- [ ] Delivery estimate saved
- [ ] Postal code captured
- [ ] Analytics event tracked (if enabled)

### **UI/UX:**
- [ ] No layout conflicts
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error handling graceful
- [ ] Clear user instructions

---

## 📝 DOCUMENTATION TO CREATE

### **For Each Store:**
1. **Setup Guide** - Step-by-step setup instructions
2. **Screenshots** - Checkout flow with Performile + payment provider
3. **Test Results** - What worked, what didn't
4. **Issues Found** - Any bugs or conflicts
5. **Compatibility Notes** - Special considerations

### **Summary Documents:**
- `SHOPIFY_PAYMENT_COMPATIBILITY.md` - All Shopify results
- `WOOCOMMERCE_PAYMENT_COMPATIBILITY.md` - All WooCommerce results
- `PAYMENT_PROVIDER_TESTING_SUMMARY.md` - Overall findings

---

## 🎯 SUCCESS CRITERIA

### **Minimum Success:**
- ✅ 2 Shopify stores working (Klarna + Stripe)
- ✅ 1 WooCommerce store working (Stripe)
- ✅ No critical bugs found
- ✅ Basic documentation created

### **Target Success:**
- ✅ 4 Shopify stores working (Klarna, Qliro, Adyen, Stripe)
- ✅ 2 WooCommerce stores working (Klarna, Stripe)
- ✅ All checkout flows tested
- ✅ Complete documentation

### **Stretch Success:**
- ✅ All 8 stores set up and tested
- ✅ Screenshots captured for all
- ✅ Compatibility matrix created
- ✅ Integration guides written

---

## 🚀 DEPLOYMENT STEPS (If Needed)

### **Deploy Shopify App to Vercel:**

```bash
# Navigate to Shopify app
cd apps/shopify/performile-delivery

# Install dependencies
npm install

# Deploy to Vercel
vercel

# Add environment variables
vercel env add SHOPIFY_API_KEY
vercel env add SHOPIFY_API_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy to production
vercel --prod
```

**Time:** 40 minutes

---

## 📋 TODAY'S SCHEDULE

### **Morning (9:00 AM - 12:00 PM):** Shopify Stores
- **9:00 - 9:40:** Deploy Performile Shopify app to Vercel (if not done)
- **9:40 - 10:25:** Set up Store 1 (Shopify + Klarna)
- **10:25 - 11:10:** Set up Store 2 (Shopify + Qliro)
- **11:10 - 11:55:** Set up Store 3 (Shopify + Adyen)
- **11:55 - 12:00:** Break

### **Afternoon (1:00 PM - 4:00 PM):** More Shopify + WooCommerce
- **1:00 - 1:30:** Set up Store 4 (Shopify + Stripe)
- **1:30 - 1:50:** Set up Store 5 (Shopify + No Payment)
- **1:50 - 2:50:** Set up Store 6 (WooCommerce + Klarna)
- **2:50 - 3:35:** Set up Store 7 (WooCommerce + Stripe)
- **3:35 - 4:00:** Set up Store 8 (WooCommerce + No Payment)

### **Evening (4:00 PM - 6:00 PM):** Documentation
- **4:00 - 5:00:** Create compatibility documents
- **5:00 - 5:30:** Capture screenshots
- **5:30 - 6:00:** Write summary report

---

## 🔍 WHAT TO LOOK FOR

### **Potential Issues:**
1. **Checkout Extension Conflicts**
   - Multiple extensions competing for space
   - Layout breaking with certain payment providers
   - JavaScript conflicts

2. **Timing Issues**
   - Performile loading before/after payment provider
   - Race conditions in checkout flow
   - Webhook timing

3. **Data Issues**
   - Courier selection not saving
   - Order attributes missing
   - Analytics not tracking

4. **UI Issues**
   - Mobile responsiveness
   - Loading states
   - Error messages

---

## 📊 TESTING MATRIX

| Store | Platform | Payment | Performile | Status | Issues | Notes |
|-------|----------|---------|------------|--------|--------|-------|
| 1 | Shopify | Klarna | ✅ | ⏳ | - | - |
| 2 | Shopify | Qliro | ✅ | ⏳ | - | - |
| 3 | Shopify | Adyen | ✅ | ⏳ | - | - |
| 4 | Shopify | Stripe | ✅ | ⏳ | - | - |
| 5 | Shopify | None | ✅ | ⏳ | - | - |
| 6 | WooCommerce | Klarna | ✅ | ⏳ | - | - |
| 7 | WooCommerce | Stripe | ✅ | ⏳ | - | - |
| 8 | WooCommerce | None | ✅ | ⏳ | - | - |

---

## 💡 TIPS FOR SUCCESS

### **Shopify:**
1. Use development stores (free, unlimited)
2. Enable test mode for all payment providers
3. Use Shopify's test credit cards
4. Check browser console for errors
5. Use Shopify CLI for faster development

### **WooCommerce:**
1. Use Local by Flywheel or XAMPP for local testing
2. Enable WooCommerce debug mode
3. Use test mode for payment gateways
4. Check WordPress debug log
5. Test on multiple browsers

### **General:**
1. Document everything as you go
2. Take screenshots at each step
3. Note any errors immediately
4. Test on mobile devices
5. Clear cache between tests

---

## 🎯 EXPECTED OUTCOMES

### **By End of Day:**
- ✅ 5-8 test stores set up
- ✅ Performile working with major payment providers
- ✅ Compatibility documented
- ✅ Issues identified and logged
- ✅ Screenshots captured
- ✅ Ready for Week 3 (checkout integrations)

### **Deliverables:**
1. Working test stores (5-8)
2. Compatibility matrix
3. Setup guides for each payment provider
4. Issue log
5. Screenshots
6. Summary report

---

## 📚 RESOURCES

### **Payment Provider Docs:**
- **Klarna:** https://docs.klarna.com/
- **Qliro:** https://developers.qliro.com/
- **Adyen:** https://docs.adyen.com/
- **Stripe:** https://stripe.com/docs

### **Platform Docs:**
- **Shopify:** https://shopify.dev/
- **WooCommerce:** https://woocommerce.com/documentation/

### **Performile Docs:**
- `apps/shopify/SHOPIFY_DEPLOYMENT_GUIDE.md`
- `apps/shopify/READY_TO_DEPLOY.md`
- `plugins/woocommerce/README.md` (if exists)

---

## 🚀 LET'S GET STARTED!

**First Step:** Deploy Performile Shopify app to Vercel (if not already done)

**Command:**
```bash
cd apps/shopify/performile-delivery
npm install
vercel
```

**Then:** Create first development store and start testing!

---

**Ready to begin? Let me know if you want me to help with:**
1. Deploying the Shopify app
2. Creating setup scripts
3. Writing test documentation
4. Anything else!
