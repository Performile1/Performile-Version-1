# Database Audit Scripts

## Overview

These scripts help you audit your Supabase database to see what tables, functions, and views exist vs what's expected.

---

## Quick Start

### Option 1: Quick Check (Recommended)
Run this for a fast overview:

```bash
psql $DATABASE_URL -f database/quick-database-check.sql
```

**Or via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `quick-database-check.sql`
3. Click "Run"

---

### Option 2: Full Audit
Run this for comprehensive analysis:

```bash
psql $DATABASE_URL -f database/audit-database-status.sql
```

---

## What Gets Checked

### Quick Check (`quick-database-check.sql`)
✅ All existing tables with row counts  
✅ Critical tables status (Users, Orders, Reviews, etc.)  
✅ New feature tables status (Market Share, Multi-Shop, Messaging)  
✅ Database functions  
✅ Views  
✅ Summary statistics  

**Runtime:** ~2 seconds

---

### Full Audit (`audit-database-status.sql`)
✅ All existing tables with sizes  
✅ Core tables (10 tables)  
✅ Messaging system tables (5 tables)  
✅ Review automation tables (3 tables)  
✅ Market share analytics tables (4 tables)  
✅ Multi-shop system tables (3 tables)  
✅ Marketplace tables (3 tables)  
✅ Database functions (10 expected)  
✅ Views (5 expected)  
✅ Indexes  
✅ Row Level Security (RLS) status  
✅ Triggers  
✅ Foreign key constraints  
✅ User statistics  
✅ Order statistics  
✅ Review statistics  
✅ Missing components report  

**Runtime:** ~5 seconds

---

## Expected Database Schema

### Core Tables (10)
- Users
- Couriers
- Merchants
- Orders
- Reviews
- Subscriptions
- PaymentHistory
- NotificationPreferences
- CourierDocuments
- AuditLogs

### Messaging System (5)
- Conversations
- ConversationParticipants
- Messages
- MessageReadReceipts
- MessageReactions

### Review Automation (3)
- ReviewRequests
- ReviewRequestSettings
- ReviewRequestResponses

### Market Share Analytics (4)
- ServiceTypes
- MerchantCourierCheckout
- OrderServiceType
- MarketShareSnapshots

### Multi-Shop System (3)
- MerchantShops
- ShopIntegrations
- ShopAnalyticsSnapshots

### Marketplace (3)
- LeadsMarketplace
- LeadPurchases
- CompetitorData

**Total Expected: 31+ tables**

---

## Expected Functions

1. `calculate_trust_score()` - TrustScore calculation
2. `calculate_checkout_share()` - Checkout market share
3. `calculate_order_share()` - Order market share
4. `calculate_delivery_share()` - Delivery market share
5. `get_market_share_report()` - Comprehensive market report
6. `create_market_share_snapshot()` - Daily snapshot
7. `get_shop_analytics()` - Shop analytics
8. `get_merchant_shops_analytics()` - All shops analytics
9. `get_ecommerce_platform_analytics()` - Platform stats
10. `create_shop_analytics_snapshot()` - Shop snapshot

---

## Expected Views

1. `vw_market_leaders` - Market leaders by delivery share
2. `vw_service_type_distribution` - Service type breakdown
3. `vw_geographic_coverage` - Geographic market coverage
4. `vw_merchant_shop_overview` - Shop summary
5. `vw_platform_integration_summary` - Platform usage

---

## How to Run

### Via Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste**
   - Copy contents of `quick-database-check.sql`
   - Paste into editor
   - Click "Run" or press Ctrl+Enter

4. **View Results**
   - Results appear in tabs below
   - Each section is a separate result set

---

### Via Command Line

1. **Get Database URL**
   ```bash
   # From Supabase Dashboard → Settings → Database
   # Copy "Connection string" (Direct connection)
   ```

2. **Run Quick Check**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" \
     -f database/quick-database-check.sql
   ```

3. **Run Full Audit**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" \
     -f database/audit-database-status.sql
   ```

---

### Via Node.js Script

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runAudit() {
  const fs = require('fs');
  const sql = fs.readFileSync('database/quick-database-check.sql', 'utf8');
  
  const result = await pool.query(sql);
  console.log(result.rows);
  
  await pool.end();
}

runAudit();
```

---

## Interpreting Results

### Status Indicators

- ✅ **EXISTS** - Component is present in database
- ❌ **MISSING** - Component needs to be created

### What to Do If Tables Are Missing

1. **Core Tables Missing?**
   - Run: `database/supabase-setup-minimal.sql`

2. **Messaging Tables Missing?**
   - Run: `database/messaging-and-reviews-system.sql`

3. **Market Share Tables Missing?**
   - Run: `database/market-share-analytics.sql`

4. **Multi-Shop Tables Missing?**
   - Run: `database/merchant-multi-shop-system.sql`

---

## Common Issues

### Issue: "relation does not exist"
**Solution:** Table hasn't been created yet. Run the appropriate schema file.

### Issue: "function does not exist"
**Solution:** Function hasn't been created. Run the schema file that contains it.

### Issue: "permission denied"
**Solution:** Make sure you're using the correct database credentials with proper permissions.

### Issue: "too many connections"
**Solution:** Close unused connections or increase connection pool limit in Supabase settings.

---

## Creating Missing Components

### Step 1: Identify What's Missing
```bash
psql $DATABASE_URL -f database/quick-database-check.sql > audit-results.txt
```

### Step 2: Run Required Schema Files

**For Core Tables:**
```bash
psql $DATABASE_URL -f database/supabase-setup-minimal.sql
```

**For Messaging:**
```bash
psql $DATABASE_URL -f database/messaging-and-reviews-system.sql
```

**For Market Share:**
```bash
psql $DATABASE_URL -f database/market-share-analytics.sql
```

**For Multi-Shop:**
```bash
psql $DATABASE_URL -f database/merchant-multi-shop-system.sql
```

### Step 3: Verify
```bash
psql $DATABASE_URL -f database/quick-database-check.sql
```

All tables should now show ✅

---

## Sample Output

### Quick Check Output
```
EXISTING TABLES
name                          | rows | size
------------------------------|------|-------
Users                         | 150  | 48 kB
Orders                        | 1250 | 256 kB
Reviews                       | 890  | 128 kB

CRITICAL TABLES CHECK
table_name | status
-----------|-------
Users      | ✅
Orders     | ✅
Reviews    | ✅

NEW FEATURE TABLES
table_name              | status
------------------------|-------
ServiceTypes            | ✅
MerchantShops           | ❌
MarketShareSnapshots    | ❌

SUMMARY
metric         | value
---------------|------
Total Tables   | 28
Total Views    | 3
Total Functions| 8
Total Users    | 150
Total Orders   | 1250
```

---

## Automation

### Daily Health Check

Create a cron job to run daily:

```bash
#!/bin/bash
# daily-db-check.sh

DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="db-audit-$DATE.txt"

psql $DATABASE_URL -f database/quick-database-check.sql > $OUTPUT_FILE

# Check for missing components
if grep -q "❌" $OUTPUT_FILE; then
    echo "⚠️ Missing database components detected!"
    # Send alert (email, Slack, etc.)
fi
```

---

## Troubleshooting

### Can't Connect to Database

1. Check DATABASE_URL is correct
2. Verify Supabase project is active
3. Check IP allowlist in Supabase settings
4. Ensure SSL is enabled

### Queries Timeout

1. Reduce query complexity
2. Add indexes to frequently queried columns
3. Increase statement timeout
4. Check for long-running transactions

### Unexpected Results

1. Clear query cache
2. Run `ANALYZE` to update statistics
3. Check for recent schema changes
4. Verify RLS policies aren't blocking queries

---

## Next Steps

After running the audit:

1. **Review Results** - Check what's missing
2. **Run Schema Files** - Create missing components
3. **Verify** - Run audit again to confirm
4. **Document** - Note any custom changes
5. **Monitor** - Set up regular health checks

---

## Support

For issues or questions:
- Check: [MASTER_PLATFORM_REPORT.md](../MASTER_PLATFORM_REPORT.md)
- Review: [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
- Contact: admin@performile.com

---

**Last Updated:** October 5, 2025  
**Version:** 1.0
