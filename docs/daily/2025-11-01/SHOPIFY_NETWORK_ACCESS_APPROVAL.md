# SHOPIFY NETWORK ACCESS APPROVAL

**Date:** November 1, 2025, 9:29 PM  
**Issue:** Network access needs approval for checkout extension  
**Status:** Pending approval

---

## 🔍 WHERE TO FIND NETWORK ACCESS

### **Option 1: Shopify Partner Dashboard**

1. Go to: https://partners.shopify.com/
2. Click **Apps** in the left sidebar
3. Click **Performile Delivery**
4. Click **Extensions** tab
5. Find **performile-courier-ratings**
6. Look for **Network access** or **Privacy & compliance** section
7. Click **Request network access** or **Configure**

---

### **Option 2: App Version Page**

1. Go to the version link from deployment:
   - https://dev.shopify.com/dashboard/189325961/apps/292520591361/versions/774839828481
2. Scroll down to find:
   - **Network access**
   - **Privacy settings**
   - **Extension configuration**
3. Click **Request access** or **Configure**

---

### **Option 3: Extension Settings**

1. Go to: https://partners.shopify.com/
2. **Apps** → **Performile Delivery**
3. **Extensions** → **performile-courier-ratings**
4. Click **Settings** or **Configure**
5. Look for:
   - **Network access**
   - **External domains**
   - **API endpoints**

---

## 📝 WHAT TO APPROVE

When you find the network access section, you need to approve:

**Domain to whitelist:**
```
https://frontend-two-swart-31.vercel.app
```

**Reason:**
- Extension needs to call analytics API
- Track courier selections in checkout
- Send data to your backend

---

## 🚨 IF YOU CAN'T FIND IT

### **Alternative: Skip Network Access for Now**

If you can't find the network access settings, you can:

1. **Publish the version anyway** (it might work without explicit approval)
2. **Test in development mode** first
3. **Contact Shopify Support** for help finding the setting

### **Publish Without Network Access:**

1. Go to: https://partners.shopify.com/
2. **Apps** → **Performile Delivery**
3. **Versions** tab
4. Find the latest version (performile-delivery-shopify-4)
5. Click **Publish** or **Make this version live**

---

## 🔧 ALTERNATIVE: USE SHOPIFY CLI

You can also try deploying with the `--force` flag:

```bash
cd apps/shopify/performile-delivery
npm run deploy -- --force
```

Or publish the version via CLI:

```bash
shopify app versions publish
```

---

## 📋 NETWORK ACCESS CONFIGURATION

If you find the network access form, configure:

**Allowed Domains:**
- `https://frontend-two-swart-31.vercel.app`

**Endpoints Used:**
- `/api/public/checkout-analytics-track` (POST)
- `/api/couriers/available` (GET)
- `/api/couriers/:id/trustscore` (GET)

**Purpose:**
- Track checkout analytics
- Display courier options
- Show TrustScore ratings

**Data Sent:**
- Merchant ID
- Courier ID
- Session ID
- Selection status
- Order context (value, items)

**Data Received:**
- Courier list
- TrustScore data
- Delivery estimates

---

## ✅ VERIFICATION

After approval/publication, verify:

1. **Check version status:**
   - Go to Partner Dashboard → Apps → Performile Delivery
   - Versions tab should show "Live" or "Published"

2. **Test in checkout:**
   - Go to your Shopify store
   - Add product to cart
   - Go to checkout
   - Verify courier options appear

3. **Check console:**
   - Open browser DevTools
   - Look for network requests to your API
   - Should see successful calls (200 status)

---

## 🎯 NEXT STEPS

### **If You Find Network Access:**
1. ✅ Approve the domain
2. ✅ Publish the version
3. ✅ Test in checkout

### **If You Can't Find It:**
1. ✅ Publish the version anyway
2. ✅ Test in checkout
3. ✅ If it works, great! If not, contact Shopify Support

### **After Publishing:**
1. ✅ Update app in your store (may need to reinstall)
2. ✅ Configure extension settings
3. ✅ Test checkout analytics
4. ✅ Verify database receives data

---

## 📞 SHOPIFY SUPPORT

If you still can't find it:

**Contact Shopify Partner Support:**
- https://partners.shopify.com/
- Click **Help** in top right
- Ask: "How do I approve network access for my checkout extension?"

**Provide:**
- App name: Performile Delivery
- Extension name: performile-courier-ratings
- Domain to approve: `https://frontend-two-swart-31.vercel.app`

---

## 💡 COMMON LOCATIONS

Network access settings are usually found in:

1. **Partner Dashboard** → Apps → Your App → **Extensions** → Configure
2. **Partner Dashboard** → Apps → Your App → **Versions** → Latest → Network
3. **Partner Dashboard** → Apps → Your App → **Settings** → Privacy
4. **App version page** → Scroll to **Privacy & compliance**
5. **Extension configuration** → **External connections**

---

**Try Option 1 first (Partner Dashboard → Apps → Extensions)!** 🔍
