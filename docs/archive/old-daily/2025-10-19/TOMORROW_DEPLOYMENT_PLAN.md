# 🚀 TOMORROW'S DEPLOYMENT PLAN - October 20, 2025

**Created:** October 19, 2025, 10:00 PM  
**Status:** Ready for Execution  
**Priority:** High

---

## 🎯 MAIN OBJECTIVES

### **1. Deploy Public Pages to Vercel**
- Deploy Home, Contact, Info pages to Vercel
- Keep login/frontend at current location
- Separate public marketing site from app

### **2. Prepare for performile.com Migration**
- Plan domain structure
- DNS configuration
- SSL certificates
- Deployment strategy

### **3. Week 4 Testing**
- Run Playwright tests
- Verify all features work
- Document results

---

## 📅 DETAILED SCHEDULE

### **MORNING SESSION (9:00 AM - 12:00 PM)**

#### **9:00 - 9:30 AM: Fix Subscription Plans System**

**CRITICAL ISSUES FOUND:**

1. **No Public API** - Public pricing page can't fetch plans
2. **No Plans in Database** - subscription_plans table is empty or missing plans
3. **No Role-Specific Plans** - Need separate plans for Merchant and Courier
4. **Wrong API Endpoint** - Using `/admin/subscriptions` which requires auth

---

**Task 1: Create Subscription Plans in Database (15 min)**

**SQL to Run:**
```sql
-- Insert Merchant Plans
INSERT INTO subscription_plans (
  plan_name, plan_slug, user_type, tier,
  monthly_price, annual_price,
  features, max_orders_per_month, max_emails_per_month,
  is_active, is_popular
) VALUES
-- Merchant Starter
('Starter', 'merchant-starter', 'merchant', 'basic',
 29, 290,
 '["100 orders/month", "Basic analytics", "Email support", "API access"]'::jsonb,
 100, 500, true, false),

-- Merchant Professional (Most Popular)
('Professional', 'merchant-professional', 'merchant', 'professional',
 79, 790,
 '["1,000 orders/month", "Advanced analytics", "Priority support", "Webhook integration", "Custom branding"]'::jsonb,
 1000, 5000, true, true),

-- Merchant Enterprise
('Enterprise', 'merchant-enterprise', 'merchant', 'enterprise',
 199, 1990,
 '["Unlimited orders", "Premium analytics", "24/7 support", "Dedicated account manager", "White-label solution"]'::jsonb,
 999999, 999999, true, false),

-- Courier Basic
('Basic', 'courier-basic', 'courier', 'basic',
 19, 190,
 '["50 deliveries/month", "Basic tracking", "Email support", "Mobile app access"]'::jsonb,
 50, 200, true, false),

-- Courier Pro (Most Popular)
('Pro', 'courier-pro', 'courier', 'professional',
 49, 490,
 '["500 deliveries/month", "Advanced tracking", "Priority support", "Route optimization", "Performance analytics"]'::jsonb,
 500, 2000, true, true),

-- Courier Premium
('Premium', 'courier-premium', 'courier', 'enterprise',
 99, 990,
 '["Unlimited deliveries", "Premium features", "24/7 support", "API access", "Custom integrations"]'::jsonb,
 999999, 999999, true, false);
```

---

**Task 2: Create Public Subscriptions API (5 min)**

**File to Create:** `api/subscriptions/public.ts`

```typescript
import { Request, Response } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_type } = req.query;

    let query = supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });

    // Filter by user type if provided
    if (user_type && (user_type === 'merchant' || user_type === 'courier')) {
      query = query.eq('user_type', user_type);
    }

    const { data: plans, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      plans: plans || [],
    });
  } catch (error: any) {
    console.error('Error fetching public plans:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
      message: error.message,
    });
  }
}
```

---

**Task 3: Update SubscriptionPlans.tsx (5 min)**

```typescript
// Change from:
const response = await apiClient.get('/admin/subscriptions');

// To:
const response = await apiClient.get('/api/subscriptions/public', {
  params: { user_type: user?.user_role }
});
```

---

**Task 4: Update BillingPortal.tsx (5 min)**

Same fix - use public API instead of admin API for fetching available plans to upgrade to.

---

#### **9:15 - 9:30 AM: Vercel Public Site Deployment**

**Task:** Deploy public pages to Vercel as separate site

**Steps:**
1. Create new Vercel project for public site
2. Configure build settings:
   ```json
   {
     "buildCommand": "npm run build:public",
     "outputDirectory": "dist/public",
     "framework": "vite"
   }
   ```
3. Set environment variables
4. Deploy to Vercel
5. Test public URLs

**Expected URLs:**
- `https://performile-public.vercel.app/` (Home)
- `https://performile-public.vercel.app/contact` (Contact)
- `https://performile-public.vercel.app/info` (Info)
- `https://performile-public.vercel.app/pricing` (Pricing)

**Keep Separate:**
- Main app: `https://performile-platform.vercel.app/` (Login/Dashboard)
- Public site: `https://performile-public.vercel.app/` (Marketing)

---

#### **9:30 - 10:30 AM: Week 4 Playwright Testing**

**Task:** Run all Week 4 tests

**Commands:**
```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run tests
npx playwright test admin-service-analytics.spec.ts

# Generate report
npx playwright show-report
```

**Test Coverage:**
- Admin Service Analytics (19 tests)
- API Integration (2 tests)
- Performance (2 tests)

**Document:**
- Test results
- Any failures
- Screenshots of issues

---

#### **10:30 - 11:30 AM: Domain Migration Planning**

**Task:** Plan performile.com domain structure

**Domain Structure:**
```
performile.com                    → Public homepage (Home, Contact, Info)
app.performile.com                → Main application (Login, Dashboard)
api.performile.com                → API endpoints
docs.performile.com               → Documentation
status.performile.com             → Status page
```

**DNS Configuration:**
```
Type    Name    Value                           TTL
A       @       76.76.21.21 (Vercel IP)        3600
CNAME   app     cname.vercel-dns.com           3600
CNAME   api     cname.vercel-dns.com           3600
CNAME   www     performile.com                 3600
```

**SSL Certificates:**
- Automatic via Vercel
- Let's Encrypt
- Wildcard cert for subdomains

---

#### **11:30 AM - 12:00 PM: Documentation & Checklist**

**Task:** Create deployment checklist

**Checklist Items:**
- [ ] Vercel projects created
- [ ] Environment variables set
- [ ] DNS records configured
- [ ] SSL certificates verified
- [ ] Public site deployed
- [ ] App site deployed
- [ ] API endpoints working
- [ ] Database connections verified
- [ ] Email service configured
- [ ] Payment gateway configured
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

## 🏗️ TECHNICAL IMPLEMENTATION

### **1. Vercel Project Structure**

#### **Project 1: Public Site (performile-public)**
```
apps/
  public/
    src/
      pages/
        Home.tsx
        Contact.tsx
        Info.tsx
        Pricing.tsx
      components/
        PublicLayout.tsx
        PublicHeader.tsx
        PublicFooter.tsx
    vite.config.ts
    package.json
```

**Build Command:**
```bash
cd apps/public && npm install && npm run build
```

**Environment Variables:**
```
VITE_API_URL=https://api.performile.com
VITE_APP_URL=https://app.performile.com
```

---

#### **Project 2: Main App (performile-app)**
```
apps/
  web/
    src/
      pages/
        Dashboard.tsx
        Settings.tsx
        # All protected pages
    vite.config.ts
    package.json
```

**Build Command:**
```bash
cd apps/web && npm install && npm run build
```

**Environment Variables:**
```
VITE_API_URL=https://api.performile.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

### **2. Routing Strategy**

#### **Public Site Routes:**
```typescript
// apps/public/src/App.tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/info" element={<Info />} />
  <Route path="/pricing" element={<Pricing />} />
  <Route path="/login" element={<Navigate to="https://app.performile.com/login" />} />
  <Route path="/register" element={<Navigate to="https://app.performile.com/register" />} />
</Routes>
```

#### **Main App Routes:**
```typescript
// apps/web/src/App.tsx
<Routes>
  <Route path="/login" element={<AuthPage />} />
  <Route path="/register" element={<AuthPage />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  {/* All other protected routes */}
</Routes>
```

---

### **3. Domain Migration Steps**

#### **Phase 1: Preparation (Week 1)**
1. Purchase performile.com domain (if not already owned)
2. Set up Vercel projects
3. Configure DNS records
4. Test on staging domains

#### **Phase 2: Staging Deployment (Week 2)**
1. Deploy to staging:
   - `staging.performile.com`
   - `app-staging.performile.com`
2. Full testing on staging
3. Fix any issues
4. User acceptance testing

#### **Phase 3: Production Deployment (Week 3)**
1. Schedule maintenance window
2. Update DNS records
3. Deploy to production
4. Monitor for issues
5. Rollback plan ready

#### **Phase 4: Post-Deployment (Week 4)**
1. Monitor performance
2. Check analytics
3. Verify all integrations
4. Update documentation
5. Announce launch

---

## 📊 DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [ ] Backup database
- [ ] Test all features locally
- [ ] Run all tests (Playwright)
- [ ] Update environment variables
- [ ] Verify API endpoints
- [ ] Check payment integration
- [ ] Test email sending
- [ ] Review security settings
- [x] **FIX: Session Expired Modal only shows on protected routes** ✅ (Fixed Oct 19)
- [ ] **FIX: Insert subscription plans into database** ⏳ (Scheduled for Oct 20, 9:00 AM)
  - [ ] 3 Merchant plans (Starter $29, Professional $79, Enterprise $199)
  - [ ] 3 Courier plans (Basic $19, Pro $49, Premium $99)
- [ ] **FIX: Create public subscriptions API endpoint** ⏳ (Scheduled for Oct 20, 9:00 AM)
- [ ] **FIX: Update SubscriptionPlans.tsx to use public API** ⏳ (Scheduled for Oct 20, 9:00 AM)
- [ ] **FIX: Update BillingPortal.tsx to use public API** ⏳ (Scheduled for Oct 20, 9:00 AM)

### **Deployment**
- [ ] Deploy public site to Vercel
- [ ] Deploy main app to Vercel
- [ ] Configure custom domains
- [ ] Set up SSL certificates
- [ ] Update DNS records
- [ ] Configure CDN
- [ ] Set up monitoring

### **Post-Deployment**
- [ ] Verify all pages load
- [ ] Test user registration
- [ ] Test user login
- [ ] Test payment flow
- [ ] Check email delivery
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Update status page

---

## 🔧 CONFIGURATION FILES

### **vercel.json (Public Site)**
```json
{
  "version": 2,
  "name": "performile-public",
  "builds": [
    {
      "src": "apps/public/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/login",
      "status": 301,
      "headers": {
        "Location": "https://app.performile.com/login"
      }
    },
    {
      "src": "/register",
      "status": 301,
      "headers": {
        "Location": "https://app.performile.com/register"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### **vercel.json (Main App)**
```json
{
  "version": 2,
  "name": "performile-app",
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

---

## 🌐 DNS CONFIGURATION

### **Domain: performile.com**

```
# Root domain (public site)
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

# WWW redirect
Type: CNAME
Name: www
Value: performile.com
TTL: 3600

# App subdomain
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600

# API subdomain
Type: CNAME
Name: api
Value: cname.vercel-dns.com
TTL: 3600

# Docs subdomain
Type: CNAME
Name: docs
Value: cname.vercel-dns.com
TTL: 3600

# Status subdomain
Type: CNAME
Name: status
Value: cname.vercel-dns.com
TTL: 3600
```

---

## 📈 MONITORING & ANALYTICS

### **Tools to Set Up:**
1. **Vercel Analytics**
   - Page views
   - Performance metrics
   - Error tracking

2. **Sentry**
   - Error monitoring
   - Performance monitoring
   - User feedback

3. **Google Analytics**
   - User behavior
   - Conversion tracking
   - Traffic sources

4. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - Status page

---

## 🔒 SECURITY CHECKLIST

- [ ] HTTPS enabled (SSL)
- [ ] CORS configured correctly
- [ ] API rate limiting
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Security headers set
- [ ] Content Security Policy
- [ ] Regular security audits
- [x] **Session Expired Modal only on protected routes** ✅

### **Session Expired Modal Fix (Completed Oct 19)**

**Issue:**
The "Session Expired" modal was showing on ALL pages, including public pages like Home, Contact, and Info. This created a poor user experience for visitors who weren't logged in.

**Solution:**
Modified `App.tsx` to only render `SessionExpiredModal` when user is authenticated:

```tsx
{/* Only show session modal on protected routes (when user is authenticated) */}
{isAuthenticated && <SessionExpiredModal />}
```

**Result:**
- ✅ Modal only shows for logged-in users
- ✅ Public pages (Home, Contact, Info) are not affected
- ✅ Better user experience for visitors
- ✅ Security maintained for authenticated sessions

**Modal Content:**
- Title: "Session Expired"
- Message: "Your session has expired due to inactivity. Please log in again to continue using Performile."
- Actions: "Log In Again" and "Close" buttons
- Tip: "Your session will automatically extend while you're active. Sessions expire after 15 minutes of inactivity for your security."

---

## 📝 DOCUMENTATION TO UPDATE

1. **README.md**
   - New domain structure
   - Deployment instructions
   - Environment setup

2. **API Documentation**
   - New API URLs
   - Authentication flow
   - Endpoint changes

3. **User Guide**
   - New login URL
   - Registration process
   - Feature documentation

4. **Developer Guide**
   - Local development setup
   - Deployment process
   - Troubleshooting

---

## 🎯 SUCCESS CRITERIA

### **Public Site:**
- ✅ All pages load in < 2 seconds
- ✅ Mobile responsive
- ✅ SEO optimized
- ✅ Contact form works
- ✅ Links to app work

### **Main App:**
- ✅ Login/registration works
- ✅ All features functional
- ✅ API calls successful
- ✅ Payment processing works
- ✅ Email delivery works

### **Performance:**
- ✅ Lighthouse score > 90
- ✅ Core Web Vitals pass
- ✅ No console errors
- ✅ Fast page loads

---

## 🚨 ROLLBACK PLAN

**If Issues Occur:**

1. **Immediate Actions:**
   - Revert DNS changes
   - Switch to previous deployment
   - Notify users via status page

2. **Investigation:**
   - Check error logs
   - Review deployment changes
   - Test in staging

3. **Fix & Redeploy:**
   - Fix identified issues
   - Test thoroughly
   - Deploy again

---

## 📞 SUPPORT CONTACTS

**Domain Registrar:**
- Provider: [Your registrar]
- Support: [Contact info]

**Hosting (Vercel):**
- Support: support@vercel.com
- Dashboard: vercel.com/dashboard

**Database (Supabase):**
- Support: support@supabase.io
- Dashboard: app.supabase.io

**Payment (Stripe):**
- Support: support@stripe.com
- Dashboard: dashboard.stripe.com

---

## ⏰ TIMELINE SUMMARY

**Tomorrow (Oct 20):**
- 9:00 AM - Deploy public site to Vercel
- 9:30 AM - Run Week 4 tests
- 10:30 AM - Plan domain migration
- 11:30 AM - Create documentation

**Next Week:**
- Day 1-2: Set up staging environment
- Day 3-4: Full testing on staging
- Day 5: Production deployment

**Following Week:**
- Monitor and optimize
- Fix any issues
- Gather user feedback

---

## 📋 FINAL CHECKLIST FOR TOMORROW

**Before Starting:**
- [ ] Coffee ready ☕
- [ ] All code committed
- [ ] Backup created
- [ ] Team notified

**During Work:**
- [ ] Follow schedule
- [ ] Document everything
- [ ] Test thoroughly
- [ ] Take breaks

**After Completion:**
- [ ] Update documentation
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Notify team

---

## 🎊 EXPECTED OUTCOMES

**By End of Tomorrow:**
- ✅ Public pages deployed to Vercel
- ✅ Week 4 tests completed
- ✅ Domain migration plan ready
- ✅ Documentation updated
- ✅ Ready for performile.com launch

---

**Created By:** Cascade AI  
**Date:** October 19, 2025, 10:00 PM  
**Status:** Ready for Tomorrow  
**Priority:** High

---

*"Good planning today leads to successful deployment tomorrow."*

**See you tomorrow! 🚀**

**NOW IT'S TIME FOR END OF DAY! 😊**
