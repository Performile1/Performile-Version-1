# Shopify CLI Deployment Guide

## 🚀 Quick Start with Shopify CLI

### **Prerequisites**
- Shopify Partners account
- Node.js 20.x installed
- Shopify CLI installed

---

## 📦 **Step 1: Install Shopify CLI**

```bash
npm install -g @shopify/cli @shopify/app
```

Verify installation:
```bash
shopify version
```

---

## 🔐 **Step 2: Login to Shopify Partners**

```bash
shopify auth login
```

This opens your browser to authenticate. Login with your Partners account credentials.

---

## 🔗 **Step 3: Link Your App**

```bash
cd apps/shopify/performile-delivery
shopify app config link
```

**You'll be prompted:**

1. **Select organization:** Choose your Partners org
2. **Select app:** 
   - Choose existing app, OR
   - Create new app
3. **Confirm details**

**What happens:**
- Updates `shopify.app.toml` with your app's client ID
- Links local code to Partners app
- Ready for development

---

## 🛠️ **Step 4: Start Development Server**

```bash
shopify app dev
```

**This will:**
- Start Express server on localhost
- Create a secure tunnel (like ngrok)
- Give you a preview URL
- Auto-update app URLs in Partners
- Watch for file changes (hot reload)

**Output example:**
```
✔ Performile Delivery is running
  Preview URL: https://abc123.ngrok.io
  Install URL: https://abc123.ngrok.io/auth?shop=your-store.myshopify.com
```

---

## 📱 **Step 5: Install on Development Store**

1. **Copy the Install URL** from CLI output
2. **Open in browser**
3. **Select your development store**
4. **Click "Install app"**
5. **Approve permissions**

---

## ✅ **Step 6: Enable Checkout Extension**

1. **Go to Shopify Admin** of your dev store
2. **Settings → Checkout**
3. **Scroll to "Checkout extensions"**
4. **Find "Performile Courier Ratings"**
5. **Click "Add"**
6. **Drag to desired position**
7. **Click "Save"**

---

## 🧪 **Step 7: Test the App**

1. **Add product to cart**
2. **Go to checkout**
3. **Enter shipping address with postal code**
4. **Verify courier ratings appear**
5. **Select a courier**
6. **Complete test order**
7. **Check order attributes**

---

## 🚀 **Step 8: Deploy to Production**

### **Option A: Shopify Hosting** (Recommended for simple apps)

```bash
shopify app deploy
```

This deploys your app to Shopify's infrastructure.

### **Option B: Vercel** (Recommended for this app)

```bash
# 1. Build the app
npm run build

# 2. Deploy to Vercel
vercel --prod

# 3. Update app URLs in Partners
# Go to Partners → Your App → App setup
# Update App URL and Redirect URLs
```

---

## 🔧 **Development Workflow**

### **Daily Development:**

```bash
# 1. Start dev server
shopify app dev

# 2. Make changes to code
# Files auto-reload

# 3. Test in browser
# Use the preview URL

# 4. Check logs in terminal
```

### **Testing Changes:**

```bash
# Extension changes
# Edit: extensions/checkout-ui/src/Checkout.jsx
# Auto-reloads in checkout

# Server changes  
# Edit: index.js
# Server auto-restarts
```

---

## 📊 **Useful Commands**

### **App Information**
```bash
shopify app info
```
Shows app details, URLs, and configuration.

### **Generate Extension**
```bash
shopify app generate extension
```
Creates a new extension (if you need more).

### **View Logs**
```bash
shopify app logs
```
Shows app logs and errors.

### **Update Configuration**
```bash
shopify app config push
```
Pushes local config to Partners.

---

## 🐛 **Troubleshooting**

### **Issue: "App not found"**

**Solution:**
```bash
shopify app config link
# Re-link to correct app
```

### **Issue: "Tunnel connection failed"**

**Solution:**
```bash
# Stop dev server (Ctrl+C)
# Restart
shopify app dev
```

### **Issue: "Extension not showing in checkout"**

**Solution:**
1. Check extension is enabled in Settings → Checkout
2. Clear browser cache
3. Try incognito mode
4. Check extension code for errors

### **Issue: "OAuth error"**

**Solution:**
1. Check redirect URLs match in Partners
2. Verify API credentials
3. Re-authenticate: `shopify auth logout` then `shopify auth login`

---

## 🔄 **Update Workflow**

### **Making Changes:**

1. **Edit code** (server or extension)
2. **Changes auto-reload** in dev mode
3. **Test in browser**
4. **Commit to git**
5. **Deploy when ready**

### **Deploying Updates:**

```bash
# For Shopify hosting
shopify app deploy

# For Vercel
vercel --prod
```

---

## 📝 **Environment Variables**

### **Local Development (.env)**

```env
SHOPIFY_API_KEY=from_partners_dashboard
SHOPIFY_API_SECRET=from_partners_dashboard
SCOPES=read_orders,write_orders,read_customers,read_shipping
HOST=https://your-tunnel-url.ngrok.io

PORT=3000
NODE_ENV=development

PERFORMILE_API_URL=https://frontend-two-swart-31.vercel.app/api
DATABASE_URL=your_database_url
```

### **Production (Vercel)**

Set via Vercel dashboard or CLI:
```bash
vercel env add SHOPIFY_API_KEY
vercel env add SHOPIFY_API_SECRET
vercel env add DATABASE_URL
vercel env add PERFORMILE_API_URL
vercel env add NODE_ENV
```

---

## 🎯 **Best Practices**

### **Development:**
- ✅ Use `shopify app dev` for local testing
- ✅ Test on multiple dev stores
- ✅ Check mobile responsiveness
- ✅ Monitor console for errors

### **Production:**
- ✅ Deploy to Vercel (more reliable than Shopify hosting)
- ✅ Set up error monitoring (Sentry)
- ✅ Enable analytics
- ✅ Monitor webhook delivery

### **Code Quality:**
- ✅ Implement session storage
- ✅ Add webhook verification
- ✅ Handle API errors gracefully
- ✅ Add loading states

---

## 📚 **Resources**

### **Shopify CLI Documentation**
- [CLI Reference](https://shopify.dev/docs/api/shopify-cli)
- [App Development](https://shopify.dev/docs/apps)
- [Checkout Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)

### **Performile Resources**
- API Documentation: `docs/API.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Status: `SHOPIFY_DEPLOYMENT_STATUS.md`

---

## ✅ **Checklist**

### **Setup:**
- [ ] Shopify CLI installed
- [ ] Authenticated with Partners
- [ ] App linked via `config link`
- [ ] Dev server running
- [ ] App installed on dev store

### **Development:**
- [ ] Extension appears in checkout
- [ ] Courier ratings load
- [ ] Selection saves to order
- [ ] Mobile responsive
- [ ] Error handling works

### **Production:**
- [ ] Session storage implemented
- [ ] Webhook verification added
- [ ] Analytics endpoint created
- [ ] Deployed to Vercel
- [ ] App URLs updated in Partners

### **Submission:**
- [ ] App tested thoroughly
- [ ] Screenshots created
- [ ] Privacy policy published
- [ ] Support documentation ready
- [ ] Submitted to App Store

---

**Next Steps:**
1. Wait for CLI installation to complete
2. Run `shopify auth login`
3. Run `shopify app config link`
4. Run `shopify app dev`
5. Test on development store

**Estimated Time:** 15-20 minutes to get running
