# Analytics Hero & Dashboard Spec

**Date:** 2025-11-11  
**Owner:** Cascade (with product input from Performile team)

---

## 1. Background & Problem Statement
- The marketing hero currently highlights a QR-first return flow uplift (“+18% Checkout conversions when QR-ready drop-off shown first”), implemented in `LandingPageMUI` as part of the analytics trust signal strip.@apps/web/src/pages/LandingPageMUI.tsx#620-703
- The platform’s actual telemetry already captures courier impressions and selections via the checkout extensions.@apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx#66-139
- Stakeholder feedback indicates the QR-first message is too niche; analytics should showcase broader value to merchants, couriers, and admins.

**Goal:** Reframe the hero and supporting analytics story to highlight universally relevant KPIs, aligned with in-product dashboards and future upsell paths.

---

## 2. Objectives
1. Present a composite hero KPI that reflects cross-role value (not limited to returns/QR flows).
2. Showcase three analytics pillars—checkout service mix, performance analytics, consumer experience—in both marketing copy and product dashboards.
3. Define exact KPI formulas, segments, and data sources to avoid speculative numbers.
4. Identify upsell hooks for advanced analytics subscriptions (merchant and courier tiers).

---

## 3. Hero KPI & Snapshot Redesign
### 3.1 Primary Metric (Hero Stat)
- **Name:** “Top Couriers Chosen by Shoppers This Week”
- **Definition:** Percentage share of courier selections captured via checkout analytics for the trailing 7 days.
- **Formula:** `courier_selection_count / total_checkout_sessions` within trailing 7-day window, grouped by courier.
- **Aggregation Source:** Checkout analytics events collected via `/public/checkout-analytics-track` and stored in Supabase `checkout_analytics` table (confirmed data logging from extension logic).
- **Display:** Replace existing `+18%` figure with dynamic top courier + share (e.g., “PostNord · 32% of selections”). Secondary text describes time window and dataset.
- **Status Chip:** Keep `Live` indicator to reinforce real-time feed.

### 3.2 Secondary Snapshot Metrics
- **Option A:** “On-Time Delivery Rate (Last 30 Days)” sourced from order performance metrics (uses existing admin dashboard averages).@apps/web/src/pages/analytics/AdminAnalytics.tsx#186-257
- **Option B:** “Checkout Satisfaction Score” (requires survey integration – mark as future enhancement).
- Render as stacked rows (similar to current PostNord/Bring/Porterbuddy breakdown) but with real aggregated values and supporting KPIs: impressions, selections, conversion rate per courier.

### 3.3 Data Freshness
- Hero pulls from nightly aggregated view with real-time delta overlay (to avoid jitter while staying current).
- Show `Snapshot · Last 24 hours` subtitle but confirm underlying window per metric (7-day share vs. 24h); adjust copy to match chosen window.

---

## 4. Analytics Pillars (Marketing + Product Alignment)
### 4.1 Checkout Service Mix
- **Audience:** Admin (platform-wide), Merchant (own store), Courier (own services).
- **Key KPIs:**
  - Service selection share per courier/service family.
  - Impressions vs. selections (conversion) per position.
  - Postal code heatmap for top service usage.
- **Data Sources:** Checkout analytics events (`checkout_analytics`), merchant-specific endpoints (`/merchant/checkout-analytics`).@apps/web/src/pages/merchant/MerchantCheckoutAnalytics.tsx#54-114
- **UI Surfaces:**
  - Marketing hero secondary rows.
  - Merchant dashboard pie/bar charts.
  - Admin analytics “Top Performing Couriers” tab.@apps/web/src/pages/analytics/AdminAnalytics.tsx#294-344
- **Upsell Hook:** Offer advanced benchmarking pack (“Unlock regional competitor comparisons & historical exports”).

### 4.2 Performance Analytics
- **Audience:** Admin, Merchant, Courier.
- **Key KPIs:** On-time rate, completion rate, cancellation rate, trust score trend, average rating.
- **Data Sources:** Order status aggregation, courier performance RPC (`update_courier_metrics`).@api/lib/webhooks/WebhookRouter.ts#220-246 @apps/web/src/pages/Dashboard.tsx#232-247
- **UI Surfaces:**
  - Dashboard stat cards (already present for merchants).
  - Admin “Performance Metrics” card group.
- **Upsell Hook:** SLA breach alerts, monthly SLA reports, long-term history exports.

### 4.3 Consumer Experience Attributes
- **Audience:** Admin, Merchant.
- **Key KPIs:**
  - Locker proximity success (delivery to locker within configured radius).
  - Home/work delivery first-attempt success rate.
  - Return flow usage (QR vs. printed) for context (not hero metric).
- **Data Sources:** Postal code validator + order delivery events (`tracking_events`).@apps/shopify/performile-delivery/extensions/checkout-ui/src/components/PostalCodeValidator.jsx#15-112 @api/lib/webhooks/WebhookRouter.ts#220-244
- **UI Surfaces:** Marketing section below hero, consumer experience dashboard module (to be scoped).
- **Upsell Hook:** Journey segmentation add-on (“See cohorts by home vs. work deliveries, locker availability”).

---

## 5. KPI Requirements Matrix
| KPI | Formula | Segment Availability | Data Source | Notes |
| --- | --- | --- | --- | --- |
| Top couriers share | `selections_per_courier / total_selections (7d)` | Admin (global), Merchant (own), Courier (own services) | Checkout analytics events | Primary hero stat |
| Impressions vs. selections | `impressions`, `selections`, `conversion_rate` | Admin, Merchant, Courier | Checkout analytics events | Show top N couriers + positions |
| On-time delivery rate | `delivered_on_time / delivered_total (30d)` | Admin, Merchant, Courier | Order performance table (Supabase) | Already exposed in dashboards |
| Completion rate | `completed_orders / total_orders (30d)` | Admin, Merchant, Courier | Order performance | Support card in dashboards |
| Consumer locker proximity | `orders_to_lockers_within_radius / total_locker_orders` | Admin, Merchant | Postal code + courier metadata | Requires locker dataset confirmation |
| Home/work success | `first_attempt_success / home_or_work_orders` | Admin, Merchant | Tracking events + address tags | Needs home/work tagging support |
| QR return usage (context) | `qr_returns / total_returns` | Admin, Merchant | Return workflow logs | Support contextual storytelling |

---

## 6. Role-Based Access & Redaction Rules
- **Admin:** Full visibility. Show courier names and merchant IDs. Provide toggle for anonymized view when exporting.
- **Merchant:** Only own store data; anonymize competitor couriers when filtering by postal code (already implemented).@apps/web/src/pages/merchant/MerchantCheckoutAnalytics.tsx#73-83
- **Courier:** Only own fleets/services; allow aggregated merchant counts but no individual merchant identifiers (replace with tiers/segments).
- **Consumer:** No analytics dashboard (read-only marketing material only).

---

## 7. Upsell & Packaging Outline
- **Base Plan:** Real-time checkout analytics + performance KPIs (existing features).
- **Advanced Analytics Add-on:**
  - Benchmarking by region/industry.
  - Historical exports beyond 90 days.
  - SLA breach alerts + email summaries.
  - Consumer experience segmentation (home/work/locker).
- **Subscription Hooks:** CTA within dashboards (“Upgrade to unlock competitor benchmarks”), integrated with billing module (to be scoped).

---

## 8. Implementation Steps (High-Level)
1. **Data Validation**
   - Confirm Supabase tables/views cover each KPI.
   - Backfill historical aggregates for trailing 7d/30d metrics.
2. **API Enhancements**
   - Extend `/admin/analytics`, `/merchant/checkout-analytics`, `/courier/analytics` to return new metrics with role-based filters.
3. **Frontend Updates**
   - Update landing hero component to use new hero stat and layout.
   - Add pillar sections with real figures (or placeholder until API ready).
   - Ensure dashboard cards align with marketing copy for consistency.
4. **Documentation & Enablement**
   - Update knowledge base article `checkout-analytics` with new KPI definitions.
   - Create pricing sheet for analytics add-on.
5. **QA & Launch Checklist**
   - Verify metrics by role (admin/merchant/courier test accounts).
   - Run regression on checkout analytics logging (Shopify extension + API).
   - Coordinate with marketing for updated screenshots in hero.

---

## 9. Open Questions
1. Do we have an existing Supabase materialized view for courier selection share, or do we need to add one?
2. Locker/home/work tagging—does backend currently label addresses, or is additional instrumentation required?
3. What cadence should marketing update the hero numbers (real-time vs. daily digest)?
4. Monetization strategy—flat add-on vs. tiered per role?
5. Any legal/privacy considerations when exposing courier or merchant performance to external audiences?

---

## 10. Next Actions
- ✅ Draft spec (this document).  
- ⬜ Review with product/marketing for copy alignment.  
- ⬜ Schedule data validation session with analytics/engineering.  
- ⬜ Update DRI list and timeline once sign-off obtained.
