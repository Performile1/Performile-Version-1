# Proximity System - Complete Documentation

**Date:** October 17, 2025  
**Status:** Ready for Approval  
**Migration File:** `create_proximity_system.sql`

---

## 📊 OVERVIEW

The Proximity System enables intelligent courier matching based on:
- **Geographic distance** (Haversine formula)
- **Postal code ranges** (configurable per merchant/courier)
- **Service areas** (city, region, country)
- **Match scoring** (distance + postal match + ratings)

---

## 🗄️ DATABASE CHANGES

### New Tables (3)

#### 1. **proximity_settings**
Stores proximity preferences for merchants and couriers.

| Column | Type | Description |
|--------|------|-------------|
| setting_id | UUID | Primary key |
| user_id | UUID | FK to users |
| entity_type | VARCHAR(20) | 'merchant' or 'courier' |
| entity_id | UUID | FK to merchants/couriers |
| delivery_range_km | INTEGER | Max delivery distance (0-1000) |
| postal_code_ranges | JSONB | Array of postal code ranges |
| latitude | DECIMAL(10,8) | Latitude coordinate |
| longitude | DECIMAL(11,8) | Longitude coordinate |
| address | TEXT | Full address |
| city | VARCHAR(100) | City name |
| country | VARCHAR(100) | Country name |
| postal_code | VARCHAR(20) | Postal code |
| auto_accept_within_range | BOOLEAN | Auto-accept nearby orders |
| notify_on_nearby_orders | BOOLEAN | Send notifications |
| priority_zones | JSONB | Priority postal codes |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- Unique: (entity_type, entity_id)
- Check: entity_type IN ('merchant', 'courier')
- Check: delivery_range_km BETWEEN 0 AND 1000
- Check: Valid coordinates (-90 to 90, -180 to 180)

**Indexes:**
- idx_proximity_user_id
- idx_proximity_entity
- idx_proximity_coords (spatial)
- idx_proximity_active
- idx_proximity_postal_code
- idx_proximity_city

#### 2. **postal_codes**
Reference data for postal code geocoding.

| Column | Type | Description |
|--------|------|-------------|
| postal_code_id | UUID | Primary key |
| postal_code | VARCHAR(20) | Postal code |
| city | VARCHAR(100) | City name |
| state_province | VARCHAR(100) | State/province |
| country | VARCHAR(100) | Country |
| latitude | DECIMAL(10,8) | Center latitude |
| longitude | DECIMAL(11,8) | Center longitude |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- Unique: (postal_code, country)

**Indexes:**
- idx_postal_codes_code
- idx_postal_codes_city
- idx_postal_codes_country
- idx_postal_codes_coords (spatial)

#### 3. **proximity_matches**
Tracks courier-order matching history.

| Column | Type | Description |
|--------|------|-------------|
| match_id | UUID | Primary key |
| order_id | UUID | FK to orders |
| merchant_id | UUID | FK to merchants |
| courier_id | UUID | FK to couriers |
| distance_km | DECIMAL(10,2) | Distance in kilometers |
| within_postal_range | BOOLEAN | Postal code match |
| match_score | INTEGER | Score 0-100 |
| match_status | VARCHAR(20) | Status |
| matched_at | TIMESTAMP | Match timestamp |
| responded_at | TIMESTAMP | Response timestamp |
| match_criteria | JSONB | Match details |

**Match Status Values:**
- `suggested` - Courier suggested for order
- `accepted` - Courier accepted order
- `rejected` - Courier rejected order
- `expired` - Match expired

**Indexes:**
- idx_proximity_matches_order
- idx_proximity_matches_merchant
- idx_proximity_matches_courier
- idx_proximity_matches_status
- idx_proximity_matches_score

### Altered Tables (2)

#### 1. **merchants** (4 columns added)
- `delivery_range_km` INTEGER DEFAULT 50
- `postal_code_ranges` JSONB DEFAULT '[]'
- `latitude` DECIMAL(10,8)
- `longitude` DECIMAL(11,8)

#### 2. **couriers** (4 columns added)
- `service_range_km` INTEGER DEFAULT 100
- `postal_code_ranges` JSONB DEFAULT '[]'
- `latitude` DECIMAL(10,8)
- `longitude` DECIMAL(11,8)

---

## 🔧 HELPER FUNCTIONS

### 1. **calculate_distance_km(lat1, lon1, lat2, lon2)**
Calculates distance between two coordinates using Haversine formula.

**Parameters:**
- lat1, lon1: First coordinate
- lat2, lon2: Second coordinate

**Returns:** DECIMAL (distance in kilometers)

**Example:**
```sql
SELECT calculate_distance_km(50.8503, 4.3517, 51.2194, 4.4025);
-- Returns: ~44 km (Brussels to Antwerp)
```

### 2. **is_postal_code_in_range(postal_code, postal_ranges)**
Checks if a postal code falls within defined ranges.

**Parameters:**
- postal_code: VARCHAR - Postal code to check
- postal_ranges: JSONB - Array of ranges

**Returns:** BOOLEAN

**Example:**
```sql
SELECT is_postal_code_in_range(
  '1500',
  '[{"start": "1000", "end": "1999"}]'::jsonb
);
-- Returns: true
```

### 3. **find_nearby_couriers(merchant_id, delivery_postal_code, max_distance_km, limit)**
Finds nearby couriers for a merchant's order.

**Parameters:**
- merchant_id: UUID - Merchant ID
- delivery_postal_code: VARCHAR - Delivery postal code (optional)
- max_distance_km: INTEGER - Maximum distance (default 50)
- limit: INTEGER - Max results (default 10)

**Returns:** TABLE with columns:
- courier_id
- courier_name
- distance_km
- within_postal_range
- avg_rating
- match_score (0-100)

**Match Score Calculation:**
```
Distance Score:
  ≤ 10 km  = 50 points
  ≤ 25 km  = 40 points
  ≤ 50 km  = 30 points
  > 50 km  = 20 points

Postal Match:
  Match    = 30 points
  No match = 0 points

Rating Score:
  (avg_rating * 4) points

Total: 0-100 points
```

**Example:**
```sql
SELECT * FROM find_nearby_couriers(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  '2000',
  100,
  10
);
```

### 4. **get_proximity_settings(entity_type, entity_id)**
Retrieves proximity settings for an entity.

**Parameters:**
- entity_type: VARCHAR - 'merchant' or 'courier'
- entity_id: UUID - Entity ID

**Returns:** TABLE with settings

**Example:**
```sql
SELECT * FROM get_proximity_settings('merchant', merchant_id);
```

---

## 🔒 SECURITY (RLS POLICIES)

### proximity_settings

| Policy | Operation | Rule |
|--------|-----------|------|
| proximity_select_own | SELECT | User can view own settings |
| proximity_update_own | UPDATE | User can update own settings |
| proximity_insert_own | INSERT | User can insert own settings |
| proximity_admin_all | ALL | Admin full access |

### postal_codes

| Policy | Operation | Rule |
|--------|-----------|------|
| postal_codes_public_select | SELECT | Public read access |
| postal_codes_admin_all | ALL | Admin full access |

### proximity_matches

| Policy | Operation | Rule |
|--------|-----------|------|
| proximity_matches_merchant_select | SELECT | Merchant can view own matches |
| proximity_matches_courier_select | SELECT | Courier can view own matches |
| proximity_matches_admin_all | ALL | Admin full access |

---

## 📋 USAGE EXAMPLES

### Example 1: Set Merchant Delivery Range

```sql
-- Insert or update merchant proximity settings
INSERT INTO proximity_settings (
  user_id,
  entity_type,
  entity_id,
  delivery_range_km,
  postal_code_ranges,
  latitude,
  longitude,
  address,
  city,
  country,
  postal_code
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'merchant',
  'merchant-uuid-here',
  50,
  '[{"start": "1000", "end": "1999"}, {"start": "2000", "end": "2999"}]'::jsonb,
  50.8503,
  4.3517,
  'Rue de la Loi 1',
  'Brussels',
  'Belgium',
  '1000'
)
ON CONFLICT (entity_type, entity_id) 
DO UPDATE SET
  delivery_range_km = EXCLUDED.delivery_range_km,
  postal_code_ranges = EXCLUDED.postal_code_ranges,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = NOW();
```

### Example 2: Find Nearby Couriers

```sql
-- Find couriers within 50km of merchant
SELECT 
  courier_id,
  courier_name,
  distance_km,
  within_postal_range,
  avg_rating,
  match_score
FROM find_nearby_couriers(
  (SELECT merchant_id FROM merchants WHERE merchant_name = 'My Store'),
  '2000',  -- Delivery postal code
  50,      -- Max 50km
  10       -- Top 10 results
)
ORDER BY match_score DESC;
```

### Example 3: Check Distance Between Locations

```sql
-- Calculate distance between two addresses
SELECT 
  m.merchant_name,
  c.courier_name,
  calculate_distance_km(
    m.latitude, m.longitude,
    c.latitude, c.longitude
  ) as distance_km
FROM merchants m
CROSS JOIN couriers c
WHERE m.merchant_id = 'merchant-uuid'
  AND c.courier_id = 'courier-uuid';
```

### Example 4: Track Match History

```sql
-- Insert a proximity match
INSERT INTO proximity_matches (
  order_id,
  merchant_id,
  courier_id,
  distance_km,
  within_postal_range,
  match_score,
  match_status,
  match_criteria
) VALUES (
  'order-uuid',
  'merchant-uuid',
  'courier-uuid',
  25.5,
  true,
  85,
  'suggested',
  '{"distance": 25.5, "postal_match": true, "rating": 4.5}'::jsonb
);

-- Update match when courier responds
UPDATE proximity_matches
SET 
  match_status = 'accepted',
  responded_at = NOW()
WHERE match_id = 'match-uuid';
```

---

## 🎯 USE CASES

### 1. **Merchant Dashboard**
- View delivery coverage map
- Set delivery range (km)
- Define postal code ranges
- See nearby couriers
- View match history

### 2. **Courier Dashboard**
- View service area map
- Set service range (km)
- Define coverage postal codes
- See nearby orders
- View match opportunities

### 3. **Order Assignment**
- Auto-suggest nearby couriers
- Sort by match score
- Filter by distance/postal code
- Track acceptance rate
- Optimize delivery routes

### 4. **Admin Dashboard**
- View all proximity settings
- Manage postal code database
- Monitor match statistics
- Analyze coverage gaps
- Generate reports

---

## 📊 SAMPLE DATA

The migration includes 9 sample postal codes for Belgium:

| Postal Code | City | Coordinates |
|-------------|------|-------------|
| 1000 | Brussels | 50.8503, 4.3517 |
| 2000 | Antwerp | 51.2194, 4.4025 |
| 3000 | Leuven | 50.8798, 4.7005 |
| 4000 | Liège | 50.6326, 5.5797 |
| 5000 | Namur | 50.4674, 4.8720 |
| 6000 | Charleroi | 50.4108, 4.4446 |
| 7000 | Mons | 50.4542, 3.9564 |
| 8000 | Bruges | 51.2093, 3.2247 |
| 9000 | Ghent | 51.0543, 3.7174 |

---

## ⚠️ DEPENDENCIES

### Required:
- ✅ `users` table (exists)
- ✅ `merchants` table (exists)
- ✅ `couriers` table (exists)
- ✅ `orders` table (exists)
- ✅ `reviews` table (exists)

### Optional:
- Geocoding service (Google Maps, OpenCage, Nominatim)
- Map display library (Google Maps, Mapbox, Leaflet)

---

## 🚀 ROLLBACK PLAN

If issues occur after migration:

```sql
-- 1. Drop policies
DROP POLICY IF EXISTS proximity_select_own ON proximity_settings;
DROP POLICY IF EXISTS proximity_update_own ON proximity_settings;
DROP POLICY IF EXISTS proximity_insert_own ON proximity_settings;
DROP POLICY IF EXISTS proximity_admin_all ON proximity_settings;
DROP POLICY IF EXISTS postal_codes_public_select ON postal_codes;
DROP POLICY IF EXISTS postal_codes_admin_all ON postal_codes;
DROP POLICY IF EXISTS proximity_matches_merchant_select ON proximity_matches;
DROP POLICY IF EXISTS proximity_matches_courier_select ON proximity_matches;
DROP POLICY IF EXISTS proximity_matches_admin_all ON proximity_matches;

-- 2. Drop triggers
DROP TRIGGER IF EXISTS trigger_update_proximity_settings_updated_at ON proximity_settings;
DROP TRIGGER IF EXISTS trigger_update_postal_codes_updated_at ON postal_codes;

-- 3. Drop functions
DROP FUNCTION IF EXISTS calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS is_postal_code_in_range(VARCHAR, JSONB);
DROP FUNCTION IF EXISTS find_nearby_couriers(UUID, VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_proximity_settings(VARCHAR, UUID);
DROP FUNCTION IF EXISTS update_proximity_settings_updated_at();

-- 4. Drop tables
DROP TABLE IF EXISTS proximity_matches CASCADE;
DROP TABLE IF EXISTS postal_codes CASCADE;
DROP TABLE IF EXISTS proximity_settings CASCADE;

-- 5. Remove columns from merchants
ALTER TABLE merchants 
DROP COLUMN IF EXISTS delivery_range_km,
DROP COLUMN IF EXISTS postal_code_ranges,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

-- 6. Remove columns from couriers
ALTER TABLE couriers 
DROP COLUMN IF EXISTS service_range_km,
DROP COLUMN IF EXISTS postal_code_ranges,
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;
```

**Recovery Time:** < 5 minutes  
**Data Loss:** Proximity settings and matches only  
**Impact:** Core functionality unaffected

---

## ✅ APPROVAL CHECKLIST

### Pre-Migration
- [x] Documentation complete
- [x] Dependencies verified
- [x] Migration SQL created
- [x] Verification SQL created
- [x] Rollback plan documented
- [x] Sample data prepared

### Migration Execution
- [ ] User approval obtained
- [ ] Backup database
- [ ] Run migration SQL
- [ ] Run verification SQL
- [ ] Test helper functions
- [ ] Verify RLS policies
- [ ] Test sample queries

### Post-Migration
- [ ] Create API endpoints
- [ ] Create frontend components
- [ ] Add geocoding integration
- [ ] Add map display
- [ ] Update documentation
- [ ] Train users

---

## 📈 PERFORMANCE CONSIDERATIONS

### Spatial Queries
- Indexed coordinates for fast lookups
- Haversine calculation is CPU-intensive
- Consider PostGIS for advanced spatial queries

### Optimization Tips
1. **Index Usage:** Ensure spatial indexes are used
2. **Limit Results:** Always use LIMIT in queries
3. **Cache Results:** Cache nearby courier lists
4. **Batch Geocoding:** Geocode addresses in batches
5. **Monitor Performance:** Track query execution times

---

## 🎓 NEXT STEPS

1. **Day 4:** Create backend API endpoints
2. **Day 5:** Create frontend components
3. **Day 6:** Add geocoding and maps
4. **Day 7:** Testing and documentation

---

**Status:** ✅ Ready for Approval  
**Risk Level:** MEDIUM (alters existing tables)  
**Recommendation:** Review and approve for Day 3 completion
