# Week 2 Implementation Specification

**Date:** October 17, 2025  
**Duration:** 7 days  
**Prerequisites:** Week 1 Complete ✅  
**Approach:** Database-First with Validation

---

## 🎯 OBJECTIVES

Week 2 focuses on **Advanced Analytics & Reporting**:
1. **Real-time Analytics Dashboard** (Day 1-3)
2. **Performance Reports & Exports** (Day 4-5)
3. **Notification System** (Day 6-7)

---

## 📋 HARD RULES (CRITICAL)

### **RULE #1: DATABASE VALIDATION FIRST**
Before ANY implementation:
1. Run `CHECK_EXISTING_TABLES.sql` to see current state
2. Create validation SQL for new features
3. Get user approval for schema changes
4. Verify actual column names and types
5. Test queries against real schema

### **RULE #2: SCHEMA DISCOVERY**
Never assume table/column names:
- ✅ Query `information_schema.columns` first
- ✅ Check actual data types (VARCHAR(2) for country codes!)
- ✅ Verify foreign key relationships
- ✅ Confirm existing indexes
- ❌ Don't use generic names like `merchant_id` without checking

### **RULE #3: INCREMENTAL VALIDATION**
After each day:
1. Create verification SQL
2. Run and confirm results
3. Document what exists
4. Update spec if needed

### **RULE #4: NO BREAKING CHANGES**
- Only ADD columns (never ALTER existing)
- Use `IF NOT EXISTS` for everything
- Provide rollback scripts
- Test on copy first if possible

---

## 📊 WEEK 2 FEATURES

### **Feature 1: Real-time Analytics Dashboard** (Day 1-3)

#### **User Stories:**
- As an **admin**, I want to see platform-wide metrics in real-time
- As a **merchant**, I want to see my store performance analytics
- As a **courier**, I want to see my delivery statistics

#### **Database Requirements:**

**Step 1: Validate Existing Analytics Tables**
```sql
-- Run this FIRST to see what exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%analytic%' 
   OR table_name LIKE '%metric%'
   OR table_name LIKE '%stat%';
```

**Expected Tables (to verify):**
- `platform_analytics` (seen in Week 1 check)
- `shopanalyticssnapshots` (seen in Week 1 check)
- Need to check: columns, types, relationships

**Step 2: Check What Columns Exist**
```sql
-- Check platform_analytics structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'platform_analytics'
ORDER BY ordinal_position;

-- Check shopanalyticssnapshots structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shopanalyticssnapshots'
ORDER BY ordinal_position;
```

**Step 3: Create Missing Tables (if needed)**

Only create if validation shows they're missing:

```sql
-- ⚠️ ONLY RUN IF MISSING ⚠️
CREATE TABLE IF NOT EXISTS analytics_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(20), -- 'store', 'shop', 'courier', 'order'
  entity_id UUID,
  user_id UUID REFERENCES users(user_id),
  
  -- Event data
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Metrics
  metric_value DECIMAL(10, 2),
  metric_unit VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_analytics_events_type (event_type),
  INDEX idx_analytics_events_entity (entity_type, entity_id),
  INDEX idx_analytics_events_user (user_id),
  INDEX idx_analytics_events_created (created_at DESC)
);
```

**Step 4: Validation Query**
```sql
-- Verify analytics tables exist
SELECT 
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
FROM (
  VALUES 
    ('platform_analytics'),
    ('shopanalyticssnapshots'),
    ('analytics_events')
) AS t(table_name)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name);
```

#### **Backend API Endpoints:**

**Day 1: Analytics Data Collection**
- `POST /api/analytics/track` - Track custom events
- `GET /api/analytics/summary` - Get summary metrics
- `GET /api/analytics/trends` - Get trend data

**Day 2: Dashboard Data**
- `GET /api/analytics/dashboard/admin` - Admin dashboard data
- `GET /api/analytics/dashboard/merchant` - Merchant dashboard data
- `GET /api/analytics/dashboard/courier` - Courier dashboard data

**Day 3: Real-time Updates**
- `GET /api/analytics/realtime` - Real-time metrics
- `GET /api/analytics/alerts` - Performance alerts

#### **Frontend Components:**

**Day 1-2: Dashboard Pages**
- `apps/web/src/pages/analytics/AdminAnalytics.tsx`
- `apps/web/src/pages/analytics/MerchantAnalytics.tsx`
- `apps/web/src/pages/analytics/CourierAnalytics.tsx`

**Day 3: Chart Components**
- `apps/web/src/components/analytics/MetricsCard.tsx`
- `apps/web/src/components/analytics/TrendChart.tsx`
- `apps/web/src/components/analytics/RealtimeWidget.tsx`

---

### **Feature 2: Performance Reports** (Day 4-5)

#### **User Stories:**
- As an **admin**, I want to generate platform performance reports
- As a **merchant**, I want to export my sales and delivery reports
- As a **courier**, I want to see my performance ratings over time

#### **Database Requirements:**

**Step 1: Check Existing Report Tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%report%' 
   OR table_name LIKE '%export%';
```

**Step 2: Create Reports Table (if needed)**
```sql
CREATE TABLE IF NOT EXISTS generated_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  report_type VARCHAR(50) NOT NULL,
  report_format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'csv', 'xlsx'
  
  -- Report parameters
  date_from TIMESTAMP WITH TIME ZONE,
  date_to TIMESTAMP WITH TIME ZONE,
  filters JSONB DEFAULT '{}'::jsonb,
  
  -- File info
  file_url TEXT,
  file_size_bytes INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_reports_user (user_id),
  INDEX idx_reports_type (report_type),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created (created_at DESC)
);
```

#### **Backend API Endpoints:**

**Day 4: Report Generation**
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/:reportId` - Get report status
- `GET /api/reports/:reportId/download` - Download report
- `GET /api/reports/list` - List user reports

**Day 5: Export Formats**
- `GET /api/reports/export/csv` - Export to CSV
- `GET /api/reports/export/pdf` - Export to PDF
- `GET /api/reports/export/xlsx` - Export to Excel

#### **Frontend Components:**

**Day 4-5: Reports Page**
- `apps/web/src/pages/reports/Reports.tsx`
- `apps/web/src/components/reports/ReportGenerator.tsx`
- `apps/web/src/components/reports/ReportList.tsx`

---

### **Feature 3: Notification System** (Day 6-7)

#### **User Stories:**
- As a **user**, I want to receive notifications about important events
- As a **merchant**, I want to be notified of new orders
- As a **courier**, I want to be notified of nearby delivery opportunities

#### **Database Requirements:**

**Step 1: Check Existing Notifications Table**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

**Step 2: Create/Update Notifications Tables**
```sql
-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Notification content
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Action
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Related entities
  entity_type VARCHAR(20),
  entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_unread (user_id, is_read) WHERE is_read = false,
  INDEX idx_notifications_type (notification_type),
  INDEX idx_notifications_created (created_at DESC)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Notification type preferences
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Example: {"new_order": {"email": true, "push": true}, "delivery_update": {"email": false, "push": true}}
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);
```

#### **Backend API Endpoints:**

**Day 6: Notifications CRUD**
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

**Day 7: Notification Preferences**
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/test` - Send test notification

#### **Frontend Components:**

**Day 6-7: Notification UI**
- `apps/web/src/components/notifications/NotificationBell.tsx`
- `apps/web/src/components/notifications/NotificationList.tsx`
- `apps/web/src/components/notifications/NotificationItem.tsx`
- `apps/web/src/pages/settings/NotificationSettings.tsx`

---

## 📋 IMPLEMENTATION CHECKLIST

### **Before Starting Each Feature:**
- [ ] Run database validation SQL
- [ ] Document existing tables/columns
- [ ] Create verification queries
- [ ] Get approval for schema changes
- [ ] Test queries on actual data

### **During Implementation:**
- [ ] Use actual table/column names from validation
- [ ] Add `IF NOT EXISTS` to all CREATE statements
- [ ] Create indexes for performance
- [ ] Add RLS policies for security
- [ ] Test with real data

### **After Each Day:**
- [ ] Run verification SQL
- [ ] Update documentation
- [ ] Commit with detailed message
- [ ] Test API endpoints
- [ ] Verify frontend integration

---

## 🔍 DATABASE VALIDATION TEMPLATE

Use this template for each new feature:

```sql
-- ============================================================================
-- FEATURE: [Feature Name]
-- VALIDATION SCRIPT
-- ============================================================================

-- 1. Check if tables exist
SELECT table_name, 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
  ('table1'),
  ('table2')
) AS t(table_name);

-- 2. Check columns for existing tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('table1', 'table2')
ORDER BY table_name, ordinal_position;

-- 3. Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('table1', 'table2')
ORDER BY tablename, indexname;

-- 4. Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('table1', 'table2')
ORDER BY tablename, policyname;

-- 5. Sample data check
SELECT COUNT(*) as row_count FROM table1;
SELECT COUNT(*) as row_count FROM table2;
```

---

## 📊 WEEK 2 TIMELINE

```
Day 1: Analytics validation + event tracking API
Day 2: Dashboard data APIs + admin dashboard UI
Day 3: Real-time metrics + merchant/courier dashboards
Day 4: Reports validation + generation API
Day 5: Export formats + reports UI
Day 6: Notifications validation + CRUD API
Day 7: Notification preferences + UI components
```

---

## ✅ SUCCESS CRITERIA

### **Analytics Dashboard:**
- [ ] Admin can see platform-wide metrics
- [ ] Merchants can see store performance
- [ ] Couriers can see delivery stats
- [ ] Real-time updates work
- [ ] Charts display correctly

### **Performance Reports:**
- [ ] Users can generate reports
- [ ] Export to CSV works
- [ ] Export to PDF works
- [ ] Reports are downloadable
- [ ] Old reports expire automatically

### **Notification System:**
- [ ] Users receive notifications
- [ ] Unread count displays correctly
- [ ] Mark as read works
- [ ] Preferences can be updated
- [ ] Email notifications send (if configured)

---

## 🚀 READY TO START?

**First Step:** Run the database validation queries above and share the results!

This will tell us:
1. What analytics tables already exist
2. What columns they have
3. What we need to create
4. How to structure the APIs

**Let's validate the database first, then proceed with implementation!** 🎯
