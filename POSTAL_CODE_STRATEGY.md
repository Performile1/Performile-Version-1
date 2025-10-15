# 📍 Postal Code System - Implementation Strategy

## 🎯 **How It Works**

### **Current Implementation: Hybrid Approach** ⭐

We use a **smart caching system** that combines the best of both worlds:

1. **Pre-populated major cities** (~200-500 postal codes)
2. **Lazy loading for everything else** via API
3. **Automatic caching** of all lookups

---

## 🔄 **User Flow**

### **Scenario 1: User in Stockholm (Pre-cached)**
```
User enters: 11122
  ↓
System checks database → FOUND ✅
  ↓
Returns instantly (< 10ms)
```

### **Scenario 2: User in Small Town (Not cached)**
```
User enters: 68432
  ↓
System checks database → NOT FOUND
  ↓
Fetches from OpenDataSoft API (~ 200ms)
  ↓
Caches in database
  ↓
Returns result
  ↓
Next user gets instant response ✅
```

---

## 📊 **Three Import Options**

### **Option 1: Lazy Loading Only** (Current Default)
**What:** Start with sample data, fetch from API as needed

**Pros:**
- ✅ Zero setup time
- ✅ Always fresh data
- ✅ Minimal storage

**Cons:**
- ⚠️ First lookup per postal code has API delay

**Best for:** MVP, testing, low traffic

---

### **Option 2: Import Major Cities** (Recommended)
**What:** Pre-import ~500 postal codes for top 20 cities

**How to run:**
```bash
# Set your database URL
export DATABASE_URL="your-postgres-connection-string"

# Run import script
node scripts/import-major-cities.js
```

**Pros:**
- ✅ Covers ~80% of Swedish population
- ✅ Fast for most users
- ✅ Small database footprint (~500 rows)
- ✅ Still uses API for edge cases

**Cons:**
- ⚠️ Takes 2-3 minutes to import

**Best for:** Production (recommended!)

---

### **Option 3: Full Import** (Optional)
**What:** Import ALL ~16,000 Swedish postal codes

**How to run:**
```bash
# Set your database URL
export DATABASE_URL="your-postgres-connection-string"

# Run full import (takes 5-10 minutes)
node scripts/bulk-import-postal-codes.js
```

**Pros:**
- ✅ 100% offline (no API dependency)
- ✅ Instant lookups for all postal codes
- ✅ No external API calls

**Cons:**
- ❌ Takes 5-10 minutes to import
- ❌ ~16,000 database rows
- ❌ Data can become stale

**Best for:** High-traffic production, offline requirements

---

## 🚀 **Recommended Setup**

### **For Development/Testing:**
```sql
-- Just run the table creation script
-- File: database/create-postal-codes-table.sql
-- Includes 50 sample postal codes
```

### **For Production:**
```bash
# 1. Create table (if not already done)
# Run: database/create-postal-codes-table.sql in Supabase

# 2. Import major cities
export DATABASE_URL="your-supabase-connection-string"
node scripts/import-major-cities.js

# Done! System will auto-cache other postal codes as needed
```

---

## 📈 **Performance Comparison**

| Scenario | Lazy Only | Major Cities | Full Import |
|----------|-----------|--------------|-------------|
| Setup time | 0 min | 2-3 min | 5-10 min |
| Database rows | ~50 | ~500 | ~16,000 |
| Stockholm lookup | 200ms (first), 10ms (cached) | 10ms | 10ms |
| Small town lookup | 200ms (first), 10ms (cached) | 200ms (first), 10ms (cached) | 10ms |
| API dependency | High | Low | None |
| Storage | Minimal | Small | Medium |

---

## 🎯 **When to Use Each Approach**

### **Lazy Loading (Default):**
- ✅ MVP/Testing
- ✅ Low traffic
- ✅ Want minimal setup
- ✅ Don't mind occasional API calls

### **Major Cities (Recommended):**
- ✅ Production launch
- ✅ Most users in major cities
- ✅ Want fast UX for 80% of users
- ✅ Acceptable to use API for edge cases

### **Full Import:**
- ✅ High traffic (1000+ users/day)
- ✅ Need 100% offline capability
- ✅ Want guaranteed performance
- ✅ Have database capacity

---

## 🔧 **How the API Fallback Works**

**Code flow in `/api/postal-codes/search`:**

```typescript
async function getPostalCodeCoordinates(postalCode) {
  // 1. Check database cache
  const cached = await db.query(
    'SELECT * FROM postal_codes WHERE postal_code = $1',
    [postalCode]
  );
  
  if (cached.rows[0]) {
    return cached.rows[0]; // ✅ Fast path (< 10ms)
  }
  
  // 2. Not in cache - fetch from API
  const response = await fetch(
    `https://public.opendatasoft.com/api/records/1.0/search/?...`
  );
  
  const data = await response.json();
  
  // 3. Cache for future use
  await db.query(
    'INSERT INTO postal_codes (...) VALUES (...)',
    [data]
  );
  
  return data; // ✅ Slower first time (~200ms), fast next time
}
```

---

## 📊 **Monitoring**

**Check cache hit rate:**
```sql
-- See most recently added postal codes (from API)
SELECT postal_code, city, created_at
FROM postal_codes
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Count by source
SELECT 
  CASE 
    WHEN created_at < '2025-10-15' THEN 'Pre-imported'
    ELSE 'API cached'
  END as source,
  COUNT(*) as count
FROM postal_codes
GROUP BY source;
```

---

## 🎯 **Our Recommendation**

**For Performile:**

1. **Now (Development):** Use lazy loading (already set up)
2. **Before Launch:** Run `import-major-cities.js` 
3. **After 6 months:** Evaluate if full import is needed based on:
   - API call frequency
   - User geographic distribution
   - Performance metrics

**This gives you 80% of the benefit with 20% of the effort!** 🚀

---

## 📝 **Summary**

- ✅ **System is ready** with lazy loading
- ✅ **Scripts provided** for major cities or full import
- ✅ **Automatic caching** means database grows organically
- ✅ **No API key needed** (OpenDataSoft is free)
- ✅ **Self-healing** (delete bad data, it re-fetches)

**Choose the approach that fits your needs!**
