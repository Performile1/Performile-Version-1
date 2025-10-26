# PRODUCTION SCHEMA DOCUMENTATION

**Date:** October 26, 2025  
**Purpose:** Document actual production database schema  
**Discovered via:** Schema discovery queries

---

## 🎯 CRITICAL: ACTUAL PRODUCTION SCHEMA

This document records the **ACTUAL** production schema, not what's in migration files.

**Why this matters:** We encountered 9+ errors during RLS implementation because migration files showed different column names than production.

---

## 📦 ORDERS TABLE (36 columns)

**Primary Key:** `order_id` (UUID)

**Foreign Keys:**
- `store_id` → `stores.store_id` (merchant's store)
- `courier_id` → `couriers.courier_id` (delivery service)
- `consumer_id` → `users.user_id` (customer who placed order)

**All Columns:**
```
order_id              UUID (PK)
store_id              UUID (FK → stores)
courier_id            UUID (FK → couriers)
consumer_id           UUID (FK → users) ⭐ THIS IS THE CUSTOMER
order_number          VARCHAR
customer_email        VARCHAR
customer_name         VARCHAR
customer_phone        VARCHAR
delivery_address      TEXT
order_status          VARCHAR
order_date            TIMESTAMP
delivery_date         TIMESTAMP
tracking_number       VARCHAR
created_at            TIMESTAMP
updated_at            TIMESTAMP
reference_number      VARCHAR
ship_date             TIMESTAMP
state_province        VARCHAR
level_of_service      VARCHAR
type_of_delivery      VARCHAR
package_weight        DECIMAL
package_dimensions    VARCHAR
package_value         DECIMAL
package_currency      VARCHAR
current_location      VARCHAR
last_scan_time        TIMESTAMP
delivery_signature    TEXT
delivery_photo_url    TEXT
special_instructions  TEXT
metadata              JSONB
country               VARCHAR
city                  VARCHAR
postal_code           VARCHAR
estimated_delivery    TIMESTAMP
pickup_address        TEXT
shipping_cost         DECIMAL
```

---

## 🏪 STORES TABLE (15 columns)

**Primary Key:** `store_id` (UUID)

**Foreign Keys:**
- `owner_user_id` → `users.user_id` (merchant who owns store)
- `subscription_plan_id` → `subscription_plans.plan_id`

**All Columns:**
```
store_id              UUID (PK)
store_name            VARCHAR
owner_user_id         UUID (FK → users) ⭐ THIS IS THE MERCHANT
subscription_plan_id  UUID (FK → subscription_plans)
website_url           VARCHAR
description           TEXT
logo_url              TEXT
is_active             BOOLEAN
created_at            TIMESTAMP
updated_at            TIMESTAMP
merchant_prefix       VARCHAR
delivery_range_km     INTEGER
postal_code_ranges    TEXT[]
latitude              DECIMAL
longitude             DECIMAL
```

---

## 🚚 COURIERS TABLE (27 columns)

**Primary Key:** `courier_id` (UUID)

**Foreign Keys:**
- `user_id` → `users.user_id` (courier user account)
- `subscription_plan_id` → `subscription_plans.plan_id`

**All Columns:**
```
courier_id                 UUID (PK)
courier_name               VARCHAR
user_id                    UUID (FK → users)
subscription_plan_id       UUID (FK → subscription_plans)
description                TEXT
logo_url                   TEXT
contact_email              VARCHAR
contact_phone              VARCHAR
is_active                  BOOLEAN
created_at                 TIMESTAMP
updated_at                 TIMESTAMP
courier_code               VARCHAR
website_url                VARCHAR
service_types              VARCHAR[]
coverage_countries         VARCHAR[]
tracking_url_template      TEXT
api_endpoint               TEXT
api_key_encrypted          TEXT
average_delivery_time_days DECIMAL
on_time_delivery_rate      DECIMAL
customer_rating            DECIMAL
metadata                   JSONB
has_api_integration        BOOLEAN
integration_status         VARCHAR
integration_type           VARCHAR
last_sync_at               TIMESTAMP
sync_frequency_minutes     INTEGER
```

---

## 👤 USERS TABLE (51 columns)

**Primary Key:** `user_id` (UUID)

**Key Column:**
- `user_role` (VARCHAR) - Values: 'merchant', 'courier', 'admin', 'consumer'

**Note:** Full column list available via schema discovery query

---

## 🔗 RELATIONSHIP SUMMARY

```
users (user_id)
  ↓
  ├─→ stores (owner_user_id) ⭐ Merchants own stores
  ├─→ couriers (user_id) ⭐ Couriers have user accounts
  └─→ orders (consumer_id) ⭐ Consumers place orders

stores (store_id)
  ↓
  └─→ orders (store_id) ⭐ Orders belong to stores

couriers (courier_id)
  ↓
  └─→ orders (courier_id) ⭐ Orders assigned to couriers
```

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ WRONG Column Names (from migrations):
- `orders.customer_id` - DOES NOT EXIST
- `orders.user_id` - DOES NOT EXIST
- `orders.merchant_id` - DOES NOT EXIST
- `stores.merchant_id` - DOES NOT EXIST
- `merchants` table - DOES NOT EXIST

### ✅ CORRECT Column Names (production):
- `orders.consumer_id` - Customer who placed order
- `orders.store_id` - Merchant's store
- `stores.owner_user_id` - Merchant who owns store
- `couriers.user_id` - Courier's user account

---

## 📊 DATA COUNTS (Oct 26, 2025)

| Table | Columns | Rows |
|-------|---------|------|
| orders | 36 | 23 |
| stores | 15 | 3 |
| couriers | 27 | 12 |
| users | 51 | 42 |

---

## 🎯 RLS POLICY PATTERNS

### Merchant sees their orders:
```sql
-- ✅ CORRECT
WHERE order_id IN (
  SELECT order_id FROM orders 
  WHERE store_id IN (
    SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
  )
)

-- ❌ WRONG (merchant_id doesn't exist)
WHERE merchant_id = auth.uid()
```

### Courier sees their orders:
```sql
-- ✅ CORRECT
WHERE order_id IN (
  SELECT order_id FROM orders 
  WHERE courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
)
```

### Consumer sees their orders:
```sql
-- ✅ CORRECT
WHERE consumer_id = auth.uid()

-- ❌ WRONG (customer_id doesn't exist)
WHERE customer_id = auth.uid()
```

---

## 🔍 SCHEMA DISCOVERY QUERIES

To verify current schema, run:

```sql
-- List all columns in a table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- List all foreign keys
SELECT 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage AS kcu
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'orders'
AND kcu.constraint_name LIKE '%fkey%';
```

---

## 📝 VERSION HISTORY

**v1.0 - October 26, 2025**
- Initial documentation
- Discovered via schema queries
- Corrected 9+ column name errors
- Documented for RLS policy implementation

---

## ⚡ QUICK REFERENCE

**Need to query orders for a merchant?**
```sql
SELECT * FROM orders 
WHERE store_id IN (
  SELECT store_id FROM stores WHERE owner_user_id = 'merchant-user-id'
);
```

**Need to query orders for a courier?**
```sql
SELECT * FROM orders 
WHERE courier_id IN (
  SELECT courier_id FROM couriers WHERE user_id = 'courier-user-id'
);
```

**Need to query orders for a consumer?**
```sql
SELECT * FROM orders 
WHERE consumer_id = 'consumer-user-id';
```

---

**ALWAYS verify schema before writing queries or RLS policies!**
