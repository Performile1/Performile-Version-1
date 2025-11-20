# Dynamic Courier Ranking Engine — Implementation Plan

**Date:** 2025-11-11  
**Owner:** Cascade (paired with product/engineering team)

---

## 1. Current Assets & Baseline
- **Database functions already present** (see `database/migrations/2025-11-10_fix_ranking_function.sql`).@database/migrations/2025-11-10_fix_ranking_function.sql#1-345
  - `calculate_courier_selection_rate(courier_id, postal_area, days_back)`
  - `calculate_position_performance(courier_id, postal_area, days_back)`
  - `update_courier_ranking_scores(postal_code := NULL, courier_id := NULL)` — outputs composite score and rank positions into `courier_ranking_scores`.
  - `save_ranking_snapshot()` — archives into `courier_ranking_history`.
- **Tables provisioned** (`database/CREATE_DYNAMIC_RANKING_TABLES.sql`) for scores + history, indexed by courier and postal segment.@database/CREATE_DYNAMIC_RANKING_TABLES.sql#13-100
- **Checkout telemetry available** via Shopify/WooCommerce extensions (`checkout_courier_analytics` writes) powering selection metrics.@apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx#47-139
- **Front-end surfaces** (e.g., `CourierSelectionCard`, `CourierComparisonView`) already accept rank/metrics but currently sorted by static trust score data.@apps/web/src/components/checkout/CourierSelectionCard.tsx#70-144 @apps/web/src/components/checkout/CourierComparisonView.tsx#161-184

### Gaps
1. No scheduled job or API trigger regularly invoking `update_courier_ranking_scores` per postal bucket.
2. Front-end still consumes legacy courier listing endpoint; ranking API contract not defined.
3. Missing configuration for weighting/feature flags (e.g., enabling dynamic ranking per merchant or experiment).
4. Lacks observability/logging to validate scoring inputs (conversion trends, data freshness).

---

## 2. Implementation Outline

### 2.1 Data Pipeline / Backend
1. **Supabase RPC Exposure**
   - Expose `update_courier_ranking_scores` and `save_ranking_snapshot` via REST (or a service key cron). Provide wrappers to restrict roles (admin/private service role only).
   - Consider parameterizing by postal-area prefix (e.g., first 3 digits) to balance cost vs. freshness.

2. **Scheduled Refresh**
   - Use Supabase cron or Vercel scheduled function to call RPC hourly per market (or nightly for low volume).
   - Store job metadata (last run, duration, errors) in `job_runs` table for ops visibility.

3. **API Endpoint**
   - New route: `GET /api/couriers/rankings` (serverless function).@docs/daily/2025-11-11/ANALYTICS_HERO_SPEC.md#71-86
   - Query params: `postal_code`, `merchant_id` (optional), `limit`, `role`. Returns top N couriers with score breakdown.
   - Add filter for merchant-specific weighting (if merchants override ranking via configuration).

4. **Event Logging**
   - When updating ranking scores, log into `courier_ranking_history` daily snapshot (already built) and push to analytics/logging (Supabase `job_logs`).
   - Add instrumentation to record RPC invocation success/failure.

### 2.2 Front-end Integration
1. **Checkout Selector**
   - Update `useCheckoutCouriers` (or relevant hook) to fetch `/api/couriers/rankings` using postal code + merchant context.
   - Fallback to static list if ranking API returns empty or feature flag disabled.
   - Display score badges (performance/conversion) and highlight reasons for placement.

2. **Analytics Dashboards**
   - Admin dashboard: add ranking widget referencing new endpoint.
   - Merchant portal: show ranking vs. selections to encourage optimisation.

3. **Feature Flagging**
   - Introduce config table: `merchant_ranking_settings` (columns: merchant_id, ranking_mode (static|dynamic), weighting overrides, feature_flag boolean).
   - Feature gate UI to allow opt-in testing before GA.

### 2.3 Observability & QA
- Add tests stubbing `update_courier_ranking_scores` for sample data, ensuring expected order.
- Build metrics dashboards: success rate of ranking job, age of last refresh per postal area, selection count thresholds (function assumes >=10 displays).
- Document manual validation checklist (data thresholds, fallback behaviour, RLS compliance).

---

## 3. Dependencies & Open Questions
1. **Checkout telemetry volume** — Do most postal areas reach 10 impressions/day? If not, need smoothing or fallback weighting.
2. **Merchant overrides** — Should merchants adjust weightings (trust vs. price) or exclude couriers manually?
3. **Geo granularity** — `courier_ranking_scores` uses `postal_code` currently. Confirm if we store full code or prefix (“ALL”). Need consistent bucket logic between function and API.
4. **Authentication** — Ensure ranking endpoint respects RLS: merchants only see their couriers; couriers see self; admin sees all (likely via service key or elevated role).
5. **Migration path** — Are existing courier API clients ready for new response schema? Need versioning/communication.

---

## 4. Next Actions
1. **Confirm data model alignment** — Validate that `courier_ranking_scores` schema matches analytics expectations (rename columns if needed: `postal_code` vs `postal_area`, `final_score`).
2. **Design API contract** — Draft TypeScript interface + route handler skeleton (`api/couriers/rankings.ts`). Include request validation and caching concerns.
3. **Set up scheduled job** — Decide on Supabase cron or Vercel Cron + service key; implement job runner calling RPC per market.
4. **Feature flag infrastructure** — Add table + admin UI for enabling dynamic ranking per merchant/source market.
5. **Front-end spike** — Update checkout hook to consume prototype endpoint behind feature flag for test merchant.
6. **QA/Telemetry plan** — Define validation queries (selection counts, ranking history rollup) and update daily playbook once live.

---

## 5. Related Documents
- `docs/daily/2025-11-11/ANALYTICS_HERO_SPEC.md` — ensures marketing copy aligns with new ranking metrics.@docs/daily/2025-11-11/ANALYTICS_HERO_SPEC.md#70-86
- `docs/daily/2025-11-11/TYPESCRIPT_ERRORS_TO_FIX.md` — track regression testing once dynamic ranking touches TypeScript endpoints.@docs/daily/2025-11-11/TYPESCRIPT_ERRORS_TO_FIX.md#1-112
- Future: add dedicated spec once API contract is signed off (e.g., `docs/specs/ranking_engine_v1.md`).

---

*Prepared for W3D2 dynamic ranking kickoff. Awaiting product sign-off and data validation before coding sprint.*
