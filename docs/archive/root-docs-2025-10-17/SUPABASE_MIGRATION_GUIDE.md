# Supabase Migration Guide
**Date:** October 17, 2025  
**Purpose:** Complete migration for new API features (Stores, Notifications, Payments)

---

## 🚀 Quick Start

### **Option 1: Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste Migration**
   - Open `backend/migrations/supabase_complete_migration.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - Check for success messages in output
   - Should see: "✅ PERFORMILE SUPABASE MIGRATION COMPLETE"

---

### **Option 2: Supabase CLI**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push backend/migrations/supabase_complete_migration.sql
```

---

### **Option 3: psql Command Line**

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migration file
\i backend/migrations/supabase_complete_migration.sql

# Or in one command:
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f backend/migrations/supabase_complete_migration.sql
```

---

## 📋 What This Migration Does

### **1. Creates Notifications Table**
```sql
- notification_id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users)
- type (VARCHAR: order, review, claim, system, payment)
- title (VARCHAR)
- message (TEXT)
- data (JSONB - additional metadata)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
- read_at (TIMESTAMP)
```

**Indexes Created:**
- `idx_notifications_user_id` - Fast user lookups
- `idx_notifications_is_read` - Filter by read status
- `idx_notifications_created_at` - Sort by date
- `idx_notifications_user_unread` - Unread notifications per user
- `idx_notifications_type` - Filter by type

---

### **2. Adds Missing Columns**

**users table:**
- `stripe_customer_id` (VARCHAR, UNIQUE) - For payment processing

**merchants table:**
- `updated_at` (TIMESTAMP) - Track last update
- `status` (VARCHAR) - Account status (active, inactive, suspended, deleted)

---

### **3. Creates Helper Functions**

**create_notification()**
```sql
-- Create a notification for a user
SELECT create_notification(
  'user-uuid',
  'order',
  'New Order',
  'You have a new order!',
  '{"order_id": "123"}'::jsonb
);
```

**mark_notification_read()**
```sql
-- Mark notification as read
SELECT mark_notification_read('notification-uuid');
```

**get_unread_notification_count()**
```sql
-- Get count of unread notifications
SELECT get_unread_notification_count('user-uuid');
```

---

### **4. Creates Automatic Triggers**

**Auto-notify on new order:**
- When order is created → Merchant gets notification

**Auto-notify on new review:**
- When review is submitted → Merchant gets notification

**Auto-notify on claim status change:**
- When claim status updates → User gets notification

---

### **5. Sets Up Row Level Security (RLS)**

**Policies:**
- Users can only view their own notifications
- Users can only update their own notifications
- Users can only delete their own notifications
- System can create notifications for any user

---

### **6. Creates Useful Views**

**v_unread_notifications_count:**
```sql
SELECT * FROM v_unread_notifications_count WHERE user_id = 'your-uuid';
```

**v_recent_notifications:**
```sql
SELECT * FROM v_recent_notifications WHERE user_id = 'your-uuid' LIMIT 10;
```

---

## ✅ Verification Steps

### **1. Check Tables Exist**
```sql
-- Run in SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';
```

Expected: 1 row returned

---

### **2. Check Indexes**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'notifications';
```

Expected: 5 indexes

---

### **3. Check Functions**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';
```

Expected: 3 functions

---

### **4. Check RLS Policies**
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'notifications';
```

Expected: 4 policies

---

### **5. Test Notification Creation**
```sql
-- Get a test user ID
SELECT user_id FROM users LIMIT 1;

-- Create test notification (replace with actual user_id)
SELECT create_notification(
  'your-user-uuid',
  'system',
  'Test Notification',
  'This is a test notification',
  '{"test": true}'::jsonb
);

-- Verify it was created
SELECT * FROM notifications WHERE type = 'system' ORDER BY created_at DESC LIMIT 1;
```

---

## 🔧 Troubleshooting

### **Error: "relation users does not exist"**
**Solution:** Make sure you're running this on the correct database. The `users` table must exist first.

---

### **Error: "permission denied"**
**Solution:** Make sure you're using the `postgres` role or a role with sufficient privileges.

```sql
-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

---

### **Error: "function already exists"**
**Solution:** The migration uses `CREATE OR REPLACE` so this shouldn't happen. If it does:

```sql
-- Drop and recreate
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;

-- Then re-run the migration
```

---

### **RLS Blocking Access**
**Solution:** If you're testing and RLS is blocking you:

```sql
-- Temporarily disable RLS for testing (DON'T DO IN PRODUCTION)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

---

## 🧪 Testing the APIs

### **1. Test Notifications API**
```bash
# Get notifications
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/notifications

# Get unread count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/notifications/unread-count

# Mark as read
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/notifications/NOTIFICATION_ID/read
```

---

### **2. Test Stores API**
```bash
# Get stores
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/stores

# Create store
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"business_name": "Test Store", "store_url": "https://test.com"}' \
  https://your-api.com/api/stores
```

---

### **3. Test Payments API**
```bash
# Get payment methods
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/payments/payment-methods
```

---

## 📊 Database Statistics

After migration, you can check stats:

```sql
-- Table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'notifications';

-- Row count
SELECT COUNT(*) FROM notifications;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE tablename = 'notifications';
```

---

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop notifications table and related objects
DROP TABLE IF EXISTS notifications CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;
DROP FUNCTION IF EXISTS notify_merchant_new_order CASCADE;
DROP FUNCTION IF EXISTS notify_merchant_new_review CASCADE;
DROP FUNCTION IF EXISTS notify_claim_status_change CASCADE;
DROP VIEW IF EXISTS v_unread_notifications_count CASCADE;
DROP VIEW IF EXISTS v_recent_notifications CASCADE;

-- Remove added columns
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE merchants DROP COLUMN IF EXISTS updated_at;
ALTER TABLE merchants DROP COLUMN IF EXISTS status;
```

---

## 📝 Post-Migration Checklist

- [ ] Migration ran successfully
- [ ] Notifications table exists
- [ ] All indexes created
- [ ] All functions created
- [ ] All triggers created
- [ ] RLS policies enabled
- [ ] Test notification created
- [ ] Backend API deployed
- [ ] Frontend tested
- [ ] Stripe keys configured
- [ ] Production tested

---

## 🎯 Next Steps

1. **Deploy Backend**
   ```bash
   git push
   # Vercel will auto-deploy
   ```

2. **Configure Stripe**
   - Add `STRIPE_SECRET_KEY` to backend environment
   - Add `STRIPE_PUBLISHABLE_KEY` to frontend environment

3. **Test Frontend**
   - Login as merchant
   - Check notifications bell
   - Try creating an order
   - Verify notification appears

4. **Monitor**
   - Check Supabase logs
   - Check API logs
   - Monitor error rates

---

## 📞 Support

**Issues?**
- Check Supabase logs: Dashboard → Logs
- Check API logs: Vercel → Functions → Logs
- Check browser console: F12 → Console

**Common Issues:**
1. RLS blocking access → Check policies
2. Functions not found → Re-run migration
3. Triggers not firing → Check trigger exists
4. Slow queries → Check indexes

---

**Migration Created:** October 17, 2025  
**Status:** Ready to Deploy  
**Estimated Time:** 2-3 minutes
