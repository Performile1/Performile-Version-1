# Shopify App Deployment Guide

**Date:** October 31, 2025  
**Status:** Ready for Deployment  
**Completion:** 100% ✅

---

## 📋 Prerequisites

Before deploying, ensure you have:
- [ ] Shopify Partners account
- [ ] Vercel account
- [ ] Supabase project credentials
- [ ] Git repository access

---

## 🚀 Deployment Steps

### **Step 1: Create Shopify App (10 min)**

1. **Go to Shopify Partners:**
   - Visit: https://partners.shopify.com
   - Login or create account

2. **Create New App:**
   - Click "Apps" → "Create app"
   - Select "Create app manually"
   - App name: "Performile Delivery"
   - App URL: `https://your-app.vercel.app` (get this after Vercel deployment)

3. **Configure App:**
   - **App URL:** `https://your-app.vercel.app`
   - **Allowed redirection URL(s):**
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/auth/shopify/callback`
   
4. **Copy Credentials:**
   - Copy **API key**
   - Copy **API secret key**
   - Save these securely!

5. **Set Scopes:**
   - `read_orders`
   - `write_orders`
   - `read_customers`
   - `read_shipping`

---

### **Step 2: Deploy to Vercel (15 min)**

#### **A. Initial Deployment**

```bash
# Navigate to Shopify app directory
cd apps/shopify/performile-delivery

# Install dependencies
npm install

# Login to Vercel (if not already)
vercel login

# Deploy (first time)
vercel
```

**Follow prompts:**
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **performile-shopify-app**
- Directory? **./apps/shopify/performile-delivery**
- Override settings? **N**

**Copy the deployment URL** (e.g., `https://performile-shopify-app.vercel.app`)

---

#### **B. Add Environment Variables**

```bash
# Add Shopify credentials
vercel env add SHOPIFY_API_KEY
# Paste your Shopify API key

vercel env add SHOPIFY_API_SECRET
# Paste your Shopify API secret

# Add Supabase credentials
vercel env add SUPABASE_URL
# Paste your Supabase URL (e.g., https://xxx.supabase.co)

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase service role key

# Add host URL
vercel env add HOST
# Paste your Vercel URL (e.g., https://performile-shopify-app.vercel.app)
```

**For each variable, select:**
- Production: **Y**
- Preview: **Y**
- Development: **Y**

---

#### **C. Production Deployment**

```bash
# Deploy to production with environment variables
vercel --prod
```

**Copy the production URL** and update Shopify app settings.

---

### **Step 3: Update Shopify App URLs (5 min)**

1. **Go back to Shopify Partners**
2. **Update App URLs:**
   - App URL: `https://your-production-url.vercel.app`
   - Allowed redirection URLs:
     - `https://your-production-url.vercel.app/auth/callback`
     - `https://your-production-url.vercel.app/auth/shopify/callback`

3. **Save changes**

---

### **Step 4: Test on Development Store (10 min)**

#### **A. Create Development Store**

1. In Shopify Partners, click "Stores"
2. Click "Add store" → "Development store"
3. Fill in details and create

#### **B. Install App**

1. Go to your app in Partners
2. Click "Test your app"
3. Select your development store
4. Click "Install app"
5. Approve permissions

#### **C. Test Functionality**

1. **Test OAuth Flow:**
   - App should install successfully
   - No errors in console

2. **Test Checkout Extension:**
   - Create a test product
   - Add to cart
   - Go to checkout
   - Verify Performile courier selection appears

3. **Test Order Creation:**
   - Complete a test order
   - Verify order attributes are saved
   - Check Supabase for session data

---

## 🔧 Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SHOPIFY_API_KEY` | Shopify app API key | `abc123...` | ✅ Yes |
| `SHOPIFY_API_SECRET` | Shopify app API secret | `xyz789...` | ✅ Yes |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` | ✅ Yes |
| `HOST` | Vercel deployment URL | `https://your-app.vercel.app` | ✅ Yes |
| `PORT` | Server port (auto-set by Vercel) | `3000` | ❌ No |

---

## ✅ Deployment Checklist

### **Pre-Deployment:**
- [x] Code complete and tested locally
- [x] Environment variables documented
- [x] Session storage implemented
- [x] Webhook verification added
- [x] Dependencies installed

### **Shopify Setup:**
- [ ] Shopify Partners account created
- [ ] App created in Partners dashboard
- [ ] API credentials copied
- [ ] App scopes configured
- [ ] Redirect URLs configured

### **Vercel Deployment:**
- [ ] Vercel account set up
- [ ] Initial deployment completed
- [ ] Environment variables added
- [ ] Production deployment completed
- [ ] Deployment URL copied

### **Testing:**
- [ ] Development store created
- [ ] App installed on dev store
- [ ] OAuth flow tested
- [ ] Checkout extension tested
- [ ] Order creation tested
- [ ] Session storage verified
- [ ] Webhooks tested

### **Documentation:**
- [x] Deployment guide created
- [x] Environment variables documented
- [ ] Testing checklist completed
- [ ] Known issues documented

---

## 🐛 Troubleshooting

### **Issue: "Missing shop parameter"**
**Solution:** Ensure redirect URLs are correctly configured in Shopify Partners

### **Issue: "Invalid HMAC"**
**Solution:** Verify `SHOPIFY_API_SECRET` is correctly set in Vercel

### **Issue: "Supabase connection failed"**
**Solution:** 
- Check `SUPABASE_URL` is correct
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)

### **Issue: "Session not found"**
**Solution:** 
- Verify `shopintegrations` table exists in Supabase
- Check RLS policies allow app to write sessions

### **Issue: "Checkout extension not showing"**
**Solution:**
- Verify extension is published in Shopify
- Check theme compatibility
- Clear browser cache

---

## 📊 Post-Deployment Verification

### **1. Health Check**
```bash
curl https://your-app.vercel.app/health
```
**Expected:** `{"status":"ok","app":"Performile Delivery"}`

### **2. Check Vercel Logs**
- Go to Vercel dashboard
- Select your project
- Click "Logs"
- Verify no errors

### **3. Check Supabase**
```sql
-- Verify sessions table
SELECT * FROM shopintegrations LIMIT 5;

-- Should show installed shops
```

### **4. Test Order Flow**
1. Create test order in dev store
2. Verify courier selection appears
3. Complete order
4. Check order attributes saved

---

## 🚀 Going Live

### **When Ready for Production:**

1. **Create Production Shopify App:**
   - Submit app for review (if public)
   - Or keep as custom app for specific merchants

2. **Update Environment Variables:**
   - Use production Supabase credentials
   - Use production API endpoints

3. **Monitor:**
   - Set up error tracking (Sentry)
   - Monitor Vercel logs
   - Monitor Supabase logs
   - Track app installations

4. **Support:**
   - Create merchant onboarding guide
   - Set up support email
   - Document common issues

---

## 📚 Additional Resources

**Shopify:**
- [Shopify App Development Docs](https://shopify.dev/docs/apps)
- [Shopify API Reference](https://shopify.dev/docs/api)
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)

**Vercel:**
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

**Supabase:**
- [Supabase Docs](https://supabase.com/docs)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📞 Support

**If you encounter issues:**
1. Check Vercel logs
2. Check Supabase logs
3. Review this troubleshooting guide
4. Check Shopify app status in Partners dashboard

---

**Deployment Status:** ✅ READY  
**Estimated Time:** 40 minutes total  
**Difficulty:** Medium  
**Success Rate:** High (with proper setup)

---

*Last Updated: October 31, 2025*  
*Version: 1.0*  
*Status: Production Ready*
