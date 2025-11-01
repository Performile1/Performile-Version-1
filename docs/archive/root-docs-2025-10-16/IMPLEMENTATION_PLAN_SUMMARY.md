# IMPLEMENTATION PLAN SUMMARY
**Focus:** Trust Score, Subscriptions, Analytics, Lead Marketplace

---

## PHASE 1: TRUST SCORE SYSTEM (Week 1-2)

### Tables
- `courier_analytics`, `trustscorecache`

### Key Files to Create
1. `api/services/trustScoreService.js` - Calculation logic
2. `api/trust-score/[courierId].js` - API endpoints
3. `api/cron/recalculate-trust-scores.js` - Daily job
4. `components/TrustScore.jsx` - Display component
5. `app/leaderboard/page.jsx` - Leaderboard page

### Metrics to Calculate
- Average rating (40% weight)
- On-time delivery rate (30% weight)
- Completion rate (30% weight)
- Delivery speed, package condition, communication

---

## PHASE 2: SUBSCRIPTION MANAGEMENT (Week 3-4)

### Tables
- `user_subscriptions`, `subscription_plan_changes`, `subscription_cancellations`, `usage_logs`

### Key Files to Create
1. `api/services/subscriptionService.js` - Core logic
2. `api/subscriptions/index.js` - API endpoints
3. `app/pricing/page.jsx` - Plans page
4. `components/UsageDashboard.jsx` - Usage tracking

### Features
- Create/cancel subscriptions
- Track usage (orders, emails, SMS, push)
- Plan changes with proration
- Cancellation policies (immediate, 30 days, end of period)
- Stripe integration

---

## PHASE 3: ANALYTICS SYSTEM (Week 5-6)

### Tables
- `shopanalyticssnapshots`, `marketsharesnapshots`, `platform_analytics`

### Key Files to Create
1. `api/services/analyticsService.js` - Calculation logic
2. `api/analytics/shop/[shopId].js` - Shop analytics API
3. `api/analytics/market-share.js` - Market share API
4. `app/analytics/shop/page.jsx` - Shop dashboard
5. `components/charts/` - Chart components

### Metrics
- Orders, revenue, avg order value
- Delivery methods breakdown
- Market share by location
- Platform-wide metrics

---

## PHASE 4: LEAD MARKETPLACE (Week 7-8)

### Tables
- `leadsmarketplace`, `leaddownloads`, `paymenthistory`

### Key Files to Create
1. `api/services/leadMarketplaceService.js` - Core logic
2. `api/leads/index.js` - API endpoints
3. `app/marketplace/page.jsx` - Marketplace page
4. `app/leads/create/page.jsx` - Create lead form
5. `components/LeadCard.jsx` - Lead display

### Features
- Merchants create leads
- Couriers browse/purchase leads
- Stripe payment integration
- Lead expiration (30 days)
- Download tracking

---

## IMPLEMENTATION ORDER

**Week 1:** Trust Score calculation + API  
**Week 2:** Trust Score UI + Leaderboard  
**Week 3:** Subscription service + Stripe  
**Week 4:** Usage tracking + Dashboard  
**Week 5:** Analytics calculation + Jobs  
**Week 6:** Analytics dashboards + Charts  
**Week 7:** Lead marketplace backend  
**Week 8:** Lead marketplace UI + Payments  

---

## NEXT STEPS

1. Review this plan
2. Set up project structure
3. Start with Phase 1 (Trust Score)
4. Create detailed tickets for each feature
5. Set up Stripe test mode
6. Configure cron jobs for calculations

Ready to start implementing? 🚀
