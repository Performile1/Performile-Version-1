# HOW TO RUN PARCEL LOCATION CACHE MIGRATION - November 4, 2025

**Date:** November 4, 2025, 5:01 PM  
**Status:** ✅ READY TO RUN  
**File:** `database/migrations/2025-11-04_create_parcel_location_cache.sql`

---

## ✅ SCHEMA VERIFICATION COMPLETE

Your `orders` table has the required columns:
- ✅ `postal_code` (character varying)
- ✅ `delivery_postal_code` (character varying)
- ✅ `delivery_address` (text)
- ✅ `delivery_city` (character varying)
- ✅ `delivery_country` (character varying)

**You're good to go!**

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### **Step 2: Copy the Migration**
1. Open: `database/migrations/2025-11-04_create_parcel_location_cache.sql`
2. Copy ALL the contents (492 lines)
3. Paste into Supabase SQL Editor

### **Step 3: Run the Migration**
1. Click "Run" button (or press Ctrl+Enter)
2. Wait for completion (should take 5-10 seconds)

### **Step 4: Verify Success**
Look for this output at the bottom:
```
==============================================
PARCEL LOCATION CACHE - DEPLOYMENT VERIFICATION
==============================================
Table exists: true
Search function exists: true
Sample locations: 2
==============================================
✅ Parcel location cache deployed successfully!
```

---

## 🎯 WHAT THIS MIGRATION CREATES

### **Tables (2):**

1. **parcel_location_cache** (20 columns)
   - Caches parcel shop and locker locations
   - PostGIS distance search
   - 24-hour cache expiration
   - Sample data: 2 locations (DPD shop + Bring locker)

2. **courier_api_requests** (10 columns)
   - Logs all courier API calls
   - Monitors performance
   - Tracks errors

### **Functions (3):**

1. **search_parcel_locations()**
   - Search by coordinates + radius
   - Returns sorted by distance
   - Filters by type and courier

2. **search_parcel_locations_by_postal()**
   - Search by postal code
   - Returns all locations in area

3. **clean_expired_parcel_cache()**
   - Removes expired cache entries
   - Run daily via cron

### **Indexes (7):**
- PostGIS GIST index for distance search
- Postal code, type, courier, carrier
- Active locations, expiration date

### **Sample Data (2 locations):**
- DPD Pickup - Rema 1000 Majorstuen (parcel shop)
- Bring Parcel Locker - Majorstuen T-bane (24/7 locker)

---

## 🧪 TEST THE MIGRATION

After running, test with these queries:

### **Test 1: Search near Oslo city center**
```sql
SELECT * FROM search_parcel_locations(
    59.9139,  -- latitude
    10.7522,  -- longitude
    5000,     -- radius in meters
    20        -- limit
);
```

**Expected:** 2 sample locations

---

### **Test 2: Search for parcel lockers only**
```sql
SELECT * FROM search_parcel_locations(
    59.9139, 
    10.7522, 
    5000, 
    20, 
    'parcel_locker'  -- type filter
);
```

**Expected:** 1 location (Bring locker)

---

### **Test 3: Search by postal code**
```sql
SELECT * FROM search_parcel_locations_by_postal('0366', 20);
```

**Expected:** 2 locations in Oslo 0366 area

---

### **Test 4: View all cached locations**
```sql
SELECT 
    location_id,
    name,
    location_type,
    carrier,
    postal_code,
    city,
    available_24_7
FROM parcel_location_cache
WHERE is_active = true
ORDER BY name;
```

**Expected:** 2 rows

---

### **Test 5: Check cache expiration**
```sql
SELECT 
    name,
    cache_expires_at,
    cache_expires_at > NOW() as is_valid
FROM parcel_location_cache;
```

**Expected:** Both should show `is_valid = true`

---

## 🚨 TROUBLESHOOTING

### **Error: "extension cube does not exist"**
**Solution:** Extensions are in public schema, migration handles this automatically.

### **Error: "relation parcel_location_cache already exists"**
**Solution:** Migration uses `IF NOT EXISTS`, safe to re-run.

### **Error: "function ll_to_earth does not exist"**
**Solution:** earthdistance extension not loaded. Check extensions:
```sql
SELECT * FROM pg_extension WHERE extname IN ('cube', 'earthdistance');
```

### **No sample data created**
**Solution:** Check if couriers exist:
```sql
SELECT courier_id, courier_code, courier_name 
FROM couriers 
WHERE courier_code IN ('dpd', 'bring');
```

---

## 📊 NEXT STEPS AFTER MIGRATION

### **1. Build Backend Service (Week 3)**
- Create `CourierLocationService` class
- Integrate courier APIs (DPD, PostNord, Bring, Instabox, Budbee)
- Implement cache refresh logic
- Add API endpoints

### **2. Build Frontend Map (Week 3)**
- Create `ParcelLocationMap` component
- Integrate Leaflet.js or Google Maps
- Add location search
- Show closest locations

### **3. Integrate in Checkout (Week 3)**
- Add parcel shop/locker selection
- Show map with nearby locations
- Display opening hours
- Calculate walking distance

### **4. Setup Cache Refresh (Week 3)**
- Create cron job to refresh cache
- Run `clean_expired_parcel_cache()` daily
- Monitor API usage
- Track cache hit rate

---

## 💰 COST ESTIMATE

**Database Migration:** FREE (already done)  
**Backend Integration:** $600 (12 hours)  
**Frontend Map:** $400 (8 hours)  
**Checkout Integration:** $400 (8 hours)  
**Total:** $1,400 (28 hours)

---

## ✅ SUCCESS CRITERIA

After migration completes:
- [ ] Tables created successfully
- [ ] Functions work correctly
- [ ] Sample data inserted
- [ ] PostGIS indexes created
- [ ] RLS policies active
- [ ] Test queries return results

---

**READY TO RUN!** 🚀

Open Supabase SQL Editor and paste the migration file.
