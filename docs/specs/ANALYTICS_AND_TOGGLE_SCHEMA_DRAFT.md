# Analytics & Feature Toggle Schema Draft (W3D2)

**Date:** 2025-11-11  
**Owner:** Cascade (draft for review)  
**Status:** Draft – pending validation + migration sign-off  

---

## 1. Objectives
- Capture checkout and ranking usage events to power dashboards and regression alerts.
- Provide admin-managed feature toggles (global + merchant overrides) without relying on external services.
- Maintain full compliance with Performile spec-driven, database-first rules: validate existing structures before applying migrations; use additive changes only.

---

## 2. Proposed Database Objects

### 2.1 Event Logging
```sql
-- Check for existing tables touching checkout analytics before creation
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'checkout_%'
ORDER BY table_name;

-- Draft table (add via migration once validation complete)
CREATE TABLE IF NOT EXISTS checkout_events (
  event_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_session_id UUID NOT NULL,
  merchant_id        UUID NOT NULL,
  postal_area        VARCHAR(3) NOT NULL,
  postal_code        VARCHAR(16) NOT NULL,
  event_type         TEXT NOT NULL CHECK (event_type IN (
                         'courier_list_viewed',
                         'courier_selected',
                         'courier_reordered',
                         'dynamic_rank_fallback',
                         'checkout_completed'
                       )),
  courier_id         UUID,
  rank_position      INTEGER,
  final_score        NUMERIC,
  fallback_reason    TEXT,
  dynamic_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata           JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_events_session
  ON checkout_events (checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_checkout_events_merchant
  ON checkout_events (merchant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_events_type_time
  ON checkout_events (event_type, occurred_at DESC);
```

#### Notes
- `checkout_session_id` links back to existing checkout analytics (confirm table name `checkout_courier_analytics`).
- `metadata` can store A/B bucket, device type, page variant.
- For Supabase RLS: plan policy allowing merchants to read their own events; admin role full access.

### 2.2 Aggregated View (optional)
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS checkout_event_daily_stats AS
SELECT
  merchant_id,
  date_trunc('day', occurred_at) AS event_date,
  event_type,
  COUNT(*) AS event_count,
  COUNT(*) FILTER (WHERE dynamic_enabled) AS dynamic_event_count,
  COUNT(*) FILTER (WHERE event_type = 'courier_selected' AND fallback_reason IS NOT NULL) AS fallback_selected_count
FROM checkout_events
GROUP BY merchant_id, event_date, event_type;
```
- Refresh via `REFRESH MATERIALIZED VIEW CONCURRENTLY checkout_event_daily_stats;` scheduled nightly.

### 2.3 Feature Toggle Tables

```sql
-- Discover existing tables to avoid duplicates
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%feature%'
ORDER BY table_name;

CREATE TABLE IF NOT EXISTS platform_feature_flags (
  feature_key        TEXT PRIMARY KEY,
  description        TEXT NOT NULL,
  default_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_stage      TEXT NOT NULL DEFAULT 'beta', -- e.g., alpha/beta/ga
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_feature_flag_overrides (
  feature_key        TEXT NOT NULL REFERENCES platform_feature_flags(feature_key) ON DELETE CASCADE,
  scope_type         TEXT NOT NULL CHECK (scope_type IN ('merchant', 'role', 'user')),
  scope_id           UUID NOT NULL,
  enabled            BOOLEAN NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (feature_key, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_scope
  ON platform_feature_flag_overrides (scope_type, scope_id);
```

#### Notes
- `rollout_stage` helps admin UI categorize flags.
- Overrides allow individual merchants or roles (e.g., `admin`, `beta_tester`) to opt-in/out.
- Admin UI will manage these tables; backend resolver order: explicit override → role override → default.

### 2.4 Admin Audit Log (optional)
```sql
CREATE TABLE IF NOT EXISTS admin_configuration_audit (
  audit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id           UUID NOT NULL,
  action_type        TEXT NOT NULL,
  feature_key        TEXT,
  previous_value     JSONB,
  new_value          JSONB,
  notes              TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_time
  ON admin_configuration_audit (actor_id, occurred_at DESC);
```
- Provides traceability for toggles/subscription edits per compliance rules.

---

## 3. API / RLS Considerations
- **Service role access:** Only serverless functions (via service key) can insert into `checkout_events` to prevent spoofing.
- **Merchant access:** RLS policy example:
  ```sql
  CREATE POLICY checkout_events_select_merchants
  ON checkout_events
  FOR SELECT
  USING (merchant_id = auth.uid()); -- adjust if merchants use organization IDs
  ```
- **Admin access:** Use dedicated role or bypass via service key for managing feature flags.

---

## 4. Migration Plan Checklist
1. Run discovery queries (above) to confirm tables don’t already exist.
2. Prepare migration file `database/migrations/2025-11-XX_add_checkout_events.sql` with `CREATE TABLE IF NOT EXISTS` statements.
3. Add RLS policies + indexes in same migration; enable RLS where required.
4. Update API layer:
   - `POST /api/analytics/events` (internal) to log checkout events.
   - `GET /api/admin/feature-flags` and `POST /api/admin/feature-flags/:id` for admin UI.
5. Seed `platform_feature_flags` with initial rows (`dynamic_courier_ranking`, `parcel_capability_filters`, etc.).
6. Document in master + investor updates once deployed.

---

## 5. Pending Questions
- Confirm merchant identifier used in auth context (is it `merchant_id` or `organization_id`).
- Determine retention policy for `checkout_events` (e.g., automatic archive after 180 days).
- Decide if overrides should support timeboxed windows (add `expires_at` column if needed).
- Align event taxonomy with Shopify/WooCommerce extension payloads.

---

*End of draft — ready for validation and migration authoring.*
