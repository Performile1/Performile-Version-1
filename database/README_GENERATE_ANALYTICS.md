# Generate Checkout Analytics Sample Data

## 🎯 Purpose

This script generates sample `checkout_courier_analytics` data from your existing orders to populate the **Performance by Location** feature.

## 📋 What It Does

1. ✅ Takes your existing orders (35 in Sweden, etc.)
2. ✅ Creates 2-4 courier display events per order (simulating checkout)
3. ✅ Marks the actual courier as selected
4. ✅ Generates realistic timestamps and session data
5. ✅ Populates data for Market List and Heatmap views

## 🚀 How To Run

### **Option 1: Supabase SQL Editor (Recommended)**

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `GENERATE_CHECKOUT_ANALYTICS_SAMPLE_DATA.sql`
5. Paste into the editor
6. Click **Run** (or press `Ctrl+Enter`)
7. Wait for completion (~5-10 seconds)

### **Option 2: Command Line**

```bash
psql "postgresql://postgres:[password]@[host]:6543/postgres" -f database/GENERATE_CHECKOUT_ANALYTICS_SAMPLE_DATA.sql
```

## 📊 What You'll See

### **During Execution:**
```
=== CURRENT STATE ===
Orders with country: 35
Checkout analytics entries: 0
Active couriers: 11

=== GENERATING CHECKOUT ANALYTICS DATA ===
Starting data generation...
Processed 30 analytics events...
Processed 60 analytics events...
Processed 90 analytics events...

=== GENERATION COMPLETE ===
Total analytics events created: 105
```

### **Summary Tables:**
- **By Country:** Shows events per country
- **By Courier:** Shows display/selection rates
- **By Postal Code:** Shows top 10 locations

### **Verification:**
```
✅ Ready for Performance by Location
countries_with_data: 2
postal_codes_with_data: 25
couriers_with_data: 8
```

## 🎨 After Running

### **Go to Analytics Dashboard:**

1. Navigate to `/analytics`
2. Click **Market Insights** tab
3. See your markets in the list:
   ```
   🇸🇪 Sweden
   35 orders | 8 couriers | 85% on-time
   ```
4. **Click on Sweden** to filter
5. See data populate in the table
6. **Toggle to Heatmap** to see visual representation

### **What You'll See:**

**Table View:**
| Courier | Postal Code | City | Displays | Selections | Rate |
|---------|-------------|------|----------|------------|------|
| Budbee | 11122 | Stockholm | 15 | 8 | 53% |
| PostNord | 11122 | Stockholm | 15 | 5 | 33% |
| ... | ... | ... | ... | ... | ... |

**Heatmap View:**
- 🟢 Green cards: High selection rate (75%+)
- 🟡 Yellow cards: Medium selection rate (25-74%)
- 🔴 Red cards: Low selection rate (<25%)

## ⚠️ Safety

- ✅ **Safe to run multiple times** - Only generates if data is missing
- ✅ **Non-destructive** - Only inserts, never deletes
- ✅ **Realistic data** - Based on actual orders
- ✅ **Limits to 100 orders** - For performance

## 🔍 Verification Queries

After running, you can verify with:

```sql
-- Check total analytics events
SELECT COUNT(*) FROM checkout_courier_analytics;

-- Check by country
SELECT 
  delivery_country,
  COUNT(*) as events,
  COUNT(DISTINCT courier_id) as couriers
FROM checkout_courier_analytics
GROUP BY delivery_country;

-- Check selection rates
SELECT 
  c.courier_name,
  COUNT(*) FILTER (WHERE was_displayed) as displays,
  COUNT(*) FILTER (WHERE was_selected) as selections,
  ROUND(
    (COUNT(*) FILTER (WHERE was_selected)::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE was_displayed), 0)) * 100, 
    1
  ) as rate_pct
FROM checkout_courier_analytics cca
JOIN couriers c ON c.courier_id = cca.courier_id
GROUP BY c.courier_name;
```

## 🎉 Success!

Once the script completes, your **Performance by Location** feature will be fully populated with realistic test data!

**Features now working:**
- ✅ Market list with statistics
- ✅ Performance by Location table
- ✅ Performance by Location heatmap
- ✅ Country filtering
- ✅ Time range filtering
- ✅ Subscription limits (admin = unlimited)

## 📝 Notes

- Data is generated from **last 100 orders** for performance
- Each order gets **2-4 courier displays** (realistic checkout scenario)
- **One courier is marked as selected** (the one that got the order)
- Timestamps are set **5 minutes before order** (realistic checkout timing)
- Session IDs are unique per order (tracks individual checkouts)

---

**Ready to see your analytics in action!** 🚀
