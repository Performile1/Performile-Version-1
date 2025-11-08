# QUICK START - Plugin Testing Today

**Date:** November 8, 2025 (Saturday)  
**Goal:** Test Performile with different payment providers

---

## 🚀 STEP 1: Deploy Shopify App (40 min)

```bash
cd apps/shopify/performile-delivery
npm install
vercel
```

Add environment variables in Vercel dashboard:
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Then: `vercel --prod`

---

## 🛍️ STEP 2: Create Test Stores

### **Priority Order:**
1. **Shopify + Klarna** (45 min)
2. **Shopify + Stripe** (30 min)
3. **Shopify + Adyen** (45 min)
4. **WooCommerce + Stripe** (45 min)

### **For Each Store:**
- [ ] Create development store
- [ ] Install payment provider
- [ ] Configure test credentials
- [ ] Install Performile app
- [ ] Test checkout flow
- [ ] Take screenshots
- [ ] Document results

---

## ✅ TEST CHECKLIST

For each store, verify:
- [ ] Courier selection appears in checkout
- [ ] Ratings display correctly
- [ ] Payment completes successfully
- [ ] Order saves courier selection
- [ ] No UI conflicts

---

## 📊 RESULTS TRACKING

Create `PAYMENT_COMPATIBILITY_RESULTS.md` with:
- Store name
- Payment provider
- ✅ Working / ❌ Issues
- Screenshots
- Notes

---

## 🎯 SUCCESS = 3-4 Stores Working

Minimum: Shopify + Klarna, Shopify + Stripe, WooCommerce + Stripe

---

**Ready? Start with deploying the Shopify app!**
