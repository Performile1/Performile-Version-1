# Spec-Driven Development Framework

**Date:** October 17, 2025  
**Project:** Performile Platform  
**Approach:** Database-First, Spec-Driven, Validation-Based

---

## 🎯 CORE PHILOSOPHY

**"Validate First, Code Second, Never Assume"**

1. **Database is the source of truth** - We conform to it, never change it
2. **Validate before every sprint** - Know what exists before coding
3. **Spec-driven implementation** - Clear requirements before starting
4. **Hard rules are non-negotiable** - No exceptions

---

## 📋 HARD RULES (NON-NEGOTIABLE)

### **RULE #1: DATABASE VALIDATION BEFORE EVERY SPRINT**

**CORE PRINCIPLE:**
> **"Database is the source of truth. Do not change it. Do not create duplicates. Validate before every change."**

**MANDATORY STEPS:**
```sql
-- Step 1: List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 2: Check columns for relevant tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('table1', 'table2', 'table3')
ORDER BY table_name, ordinal_position;

-- Step 3: Check for duplicate/similar tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%similar_name%'
ORDER BY table_name;

-- Step 4: Check for duplicate/similar columns
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name LIKE '%similar_column%'
ORDER BY table_name, column_name;

-- Step 5: Check indexes
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('table1', 'table2', 'table3');

-- Step 6: Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('table1', 'table2', 'table3');

-- Step 7: Sample data check
SELECT COUNT(*) FROM table1;
```

**CRITICAL: DUPLICATE DETECTION**
- ❌ **NEVER** create a new table if similar data exists elsewhere
- ❌ **NEVER** create a new column if similar data exists in another column
- ✅ **ALWAYS** search for existing tables/columns with similar purpose
- ✅ **ALWAYS** reuse existing structures
- ✅ **ALWAYS** document why new table/column is needed if creating

**DELIVERABLE:** Validation report documenting:
1. Actual schema (tables, columns, types)
2. Duplicate check results (no similar tables/columns found)
3. Justification for any new tables/columns

### **RULE #2: NEVER CHANGE EXISTING DATABASE**

**ALLOWED:**
- ✅ ADD new tables (with `IF NOT EXISTS`)
- ✅ ADD new columns (with `IF NOT EXISTS`)
- ✅ ADD new indexes
- ✅ ADD new functions
- ✅ ADD new RLS policies

**FORBIDDEN:**
- ❌ ALTER existing columns
- ❌ DROP columns
- ❌ RENAME columns
- ❌ CHANGE data types
- ❌ MODIFY constraints
- ❌ DELETE existing data

**IF DATABASE NEEDS CHANGE (ALTER/DROP/RENAME):**

**⚠️ STOP! This requires explicit approval.**

**YOU MUST:**
1. **Document WHY** the change is absolutely necessary
2. **Explain** why existing structure cannot be used
3. **Describe** the impact on existing data and code
4. **Provide** rollback script
5. **Test** on copy database first
6. **Get explicit user approval** before proceeding
7. **Only then** apply to production

**EXAMPLE JUSTIFICATION:**
```
❌ BAD: "Need to change column type"
✅ GOOD: "Column 'postal_code' is VARCHAR(20) but needs to store 
         Norwegian postal codes which are 4 digits. Current data 
         has 150 rows with 5-digit codes that need migration. 
         Alternative: Add new column 'postal_code_normalized' 
         and keep old column for backwards compatibility."
```

### **RULE #3: CONFORM TO EXISTING SCHEMA**

**EXAMPLES FROM WEEK 1:**
```
❌ Assumed: merchants table
✅ Actual: stores table

❌ Assumed: country VARCHAR(100)
✅ Actual: country VARCHAR(2)

❌ Assumed: user_id on stores
✅ Actual: merchant_id on merchantshops

❌ Assumed: entity_type = 'merchant'
✅ Actual: entity_type = 'store'
```

**ALWAYS:**
- Use EXACT column names from validation
- Use EXACT data types from validation
- Use EXACT foreign key relationships
- Use EXACT constraints

### **RULE #4: SUPABASE-SPECIFIC CONSIDERATIONS**

**Platform:** Supabase (PostgreSQL + RLS)

**REQUIREMENTS:**
- ✅ All tables MUST have RLS enabled
- ✅ Use `auth.uid()` for user context
- ✅ Use UUID for primary keys
- ✅ Use TIMESTAMP WITH TIME ZONE
- ✅ Use gen_random_uuid() for defaults
- ✅ Enable RLS before creating policies

**SUPABASE FUNCTIONS:**
```sql
-- Always use Supabase auth context
auth.uid() -- Current user ID
auth.jwt() -- Current JWT token
auth.role() -- Current user role
```

### **RULE #5: VERCEL SERVERLESS ARCHITECTURE**

**Platform:** Vercel (Serverless Functions)

**STATUS:** ✅ **CURRENTLY USED** - All API endpoints follow this structure

**STRUCTURE:**
```
api/
  ├── [feature]/
  │   ├── endpoint1.ts
  │   ├── endpoint2.ts
  │   └── endpoint3.ts
  └── lib/
      └── db.ts (connection pooling)
```

**REQUIREMENTS:**
- ✅ Use Supabase client (NOT connection pooling)
- ✅ Use environment variables for secrets
- ✅ TypeScript for type safety
- ✅ Express-style handlers with Request/Response
- ✅ JWT authentication via middleware
- ✅ Proper error handling

**CURRENT TEMPLATE (AS USED IN PRODUCTION):**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  try {
    // Validate request
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Your code here
    const { data, error } = await supabase
      .from('table_name')
      .select('*');

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

**NOTE:** This structure is actively used in all current API endpoints. Do not deviate without explicit approval.

### **RULE #6: SPEC-DRIVEN IMPLEMENTATION**

**STATUS:** ✅ **MANDATORY** - This is the core development process

**⚠️ CRITICAL: This rule is NON-NEGOTIABLE and must be followed for EVERY feature.**

**BEFORE STARTING ANY FEATURE:**

1. **Create Feature Spec** (Markdown)
   - User stories
   - Database requirements (validation first!)
   - API endpoints
   - Frontend components
   - Success criteria

2. **Validate Database** ⚠️ **MANDATORY**
   - Run validation SQL (RULE #1)
   - Check for duplicate tables/columns
   - Document actual schema
   - Update spec with findings
   - **STOP if duplicates found** - reuse existing structures

3. **Get Approval** ⚠️ **MANDATORY**
   - Review spec with user
   - Confirm approach
   - Get explicit go-ahead
   - **DO NOT proceed without approval**

4. **Implement**
   - Follow spec exactly
   - Use validated schema
   - Test incrementally
   - **Never deviate from approved spec**

5. **Verify**
   - Run verification SQL
   - Test all endpoints
   - Update documentation
   - Confirm with user

**ENFORCEMENT:**
- ❌ **NO coding without spec**
- ❌ **NO database changes without validation**
- ❌ **NO implementation without approval**
- ✅ **ALWAYS follow this process**

**WHY THIS MATTERS:**
- Prevents duplicate tables/columns
- Prevents schema assumption errors
- Ensures alignment with user needs
- Reduces rework and debugging time
- Maintains code quality and consistency

### **RULE #7: INCREMENTAL VALIDATION**

**AFTER EACH DAY:**
```sql
-- Create verification query
SELECT 
  'feature_table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_table')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check row counts
SELECT COUNT(*) as row_count FROM feature_table;

-- Verify API works
-- Test endpoint manually
```

**DELIVERABLE:** Daily verification report

### **RULE #8: NO BREAKING CHANGES**

**DEFINITION:** A breaking change is anything that:
- Removes existing functionality
- Changes existing API contracts
- Modifies existing database schema
- Breaks existing frontend code

**IF BREAKING CHANGE NEEDED:**
1. Document why it's necessary
2. Create migration path
3. Provide backwards compatibility
4. Get explicit approval
5. Deprecate old way gradually

### **RULE #9: ROLLBACK SCRIPTS MANDATORY**

**FOR EVERY DATABASE CHANGE:**
```sql
-- migration_up.sql
CREATE TABLE new_table (...);

-- migration_down.sql (ROLLBACK)
DROP TABLE IF EXISTS new_table;
```

**STORE IN:**
```
database/migrations/
  ├── YYYY-MM-DD_feature_up.sql
  └── YYYY-MM-DD_feature_down.sql
```

### **RULE #10: DOCUMENTATION IS CODE**

**REQUIRED DOCS:**
- ✅ Feature specs (before coding)
- ✅ Database validation reports
- ✅ API endpoint documentation
- ✅ Verification queries
- ✅ Rollback procedures
- ✅ Deployment checklist

**UPDATE AFTER EACH SPRINT:**
- WEEK_X_COMPLETE.md
- SPEC files
- README if needed

### **RULE #11: UI/UX CONSISTENCY**

**SMART MENU ORGANIZATION:**
- ✅ Create new menu items when features are distinct
- ✅ Group related features together in same view
- ✅ Use tabs/accordions for subcategories within a page
- ✅ Keep navigation logical and discoverable

**GROUPING STRATEGY:**
```
If features are related → Same page with tabs/accordions
If features are distinct → Separate menu items

Examples:
✅ System Settings page with tabs: General, Email, Security, Features
✅ Analytics page with accordions: Platform, Shops, Couriers
✅ Proximity Settings page with sections: Location, Range, Postal Codes
✅ Reports as separate menu (distinct from Analytics)
✅ Notifications as separate menu (distinct from Settings)
```

**WITHIN-PAGE ORGANIZATION:**
```typescript
// Use Material-UI Tabs for related subcategories
<Tabs value={activeTab} onChange={handleTabChange}>
  <Tab label="General" />
  <Tab label="Email" />
  <Tab label="Security" />
  <Tab label="Features" />
</Tabs>

// Use Accordions for collapsible sections
<Accordion>
  <AccordionSummary>Location Settings</AccordionSummary>
  <AccordionDetails>[Location form]</AccordionDetails>
</Accordion>
<Accordion>
  <AccordionSummary>Range Settings</AccordionSummary>
  <AccordionDetails>[Range form]</AccordionDetails>
</Accordion>

// Use Cards for grouped content
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <Card><CardContent>[Section 1]</CardContent></Card>
  </Grid>
  <Grid item xs={12} md={6}>
    <Card><CardContent>[Section 2]</CardContent></Card>
  </Grid>
</Grid>
```

**DECISION TREE:**
```
New Feature?
  ├─ Is it related to existing feature?
  │  ├─ YES → Add to existing page as tab/accordion/section
  │  └─ NO → Continue
  │
  ├─ Does it fit existing menu category?
  │  ├─ YES → Add to that menu
  │  └─ NO → Continue
  │
  └─ Create new menu item (it's distinct enough)
```

**EXAMPLES:**
```
✅ GOOD: Analytics Dashboard with tabs for Platform/Shop/Courier views
✅ GOOD: Settings page with accordions for different setting types
✅ GOOD: Reports as separate menu (not under Analytics)
✅ GOOD: Notifications as separate menu (not under Settings)
❌ BAD: Separate menu for each analytics type
❌ BAD: Separate menu for each setting category
```

### **RULE #12: USER ROLES & PERMISSIONS**

**ROLES IN DATABASE:**
- `admin` - Full access
- `merchant` - Store management
- `courier` - Delivery management
- `user` - Basic access

**ROLE-BASED ACCESS:**
```typescript
// Always check user role
const userRole = decoded.role; // from JWT

// Admin-only endpoints
if (userRole !== 'admin') {
  throw new Error('Admin access required');
}

// Merchant-only endpoints
if (userRole !== 'merchant') {
  throw new Error('Merchant access required');
}

// Multi-role endpoints
if (!['admin', 'merchant'].includes(userRole)) {
  throw new Error('Unauthorized');
}
```

**RLS POLICIES MUST MATCH:**
```sql
-- User can only see their own data
CREATE POLICY user_select_own ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can see everything
CREATE POLICY admin_select_all ON table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );
```

### **RULE #13: SUBSCRIPTION LIMITS**

**SUBSCRIPTION TABLES:**
- `subscription_plans` - Plan definitions
- `user_subscriptions` - User's active subscription

**PLAN LIMITS (from database validation):**
```
subscription_plans columns:
  - max_shops INTEGER
  - max_orders_per_month INTEGER
  - max_emails_per_month INTEGER
  - max_reports_per_month INTEGER
  - features JSONB
```

**ALWAYS CHECK LIMITS:**
```typescript
// Before creating new shop
const subscription = await getSubscription(userId);
const currentShops = await countUserShops(userId);

if (currentShops >= subscription.max_shops) {
  throw new Error('Shop limit reached. Upgrade your plan.');
}

// Before processing order
const ordersThisMonth = await countOrdersThisMonth(userId);

if (ordersThisMonth >= subscription.max_orders_per_month) {
  throw new Error('Monthly order limit reached. Upgrade your plan.');
}

// Before sending email
const emailsThisMonth = await countEmailsThisMonth(userId);

if (emailsThisMonth >= subscription.max_emails_per_month) {
  throw new Error('Email limit reached. Upgrade your plan.');
}
```

**FEATURE FLAGS:**
```typescript
// Check if feature is enabled in plan
const subscription = await getSubscription(userId);
const features = subscription.features; // JSONB

if (!features.proximity_matching) {
  throw new Error('Proximity matching not available in your plan.');
}

if (!features.advanced_analytics) {
  throw new Error('Advanced analytics not available in your plan.');
}
```

**FRONTEND LIMITS:**
```typescript
// Show upgrade prompt when limit reached
if (currentShops >= maxShops) {
  return (
    <Alert severity="warning">
      You've reached your shop limit ({maxShops}). 
      <Button onClick={handleUpgrade}>Upgrade Plan</Button>
    </Alert>
  );
}

// Disable features not in plan
<Button 
  disabled={!features.proximity_matching}
  onClick={handleProximitySettings}
>
  Proximity Settings
  {!features.proximity_matching && <LockIcon />}
</Button>
```

**SUBSCRIPTION CHECKS REQUIRED FOR:**
- Creating new shops/stores
- Processing orders
- Sending emails/notifications
- Using premium features
- Accessing advanced analytics
- API rate limits

---

### **RULE #14: PACKAGE.JSON VALIDATION**

**BEFORE EVERY FRONTEND FEATURE:**
1. ✅ Check if new npm packages are needed
2. ✅ Add to package.json BEFORE creating components
3. ✅ Verify versions are compatible
4. ✅ Test build locally if possible

**COMMON PACKAGES TO CHECK:**
```json
{
  "chart.js": "^4.4.1",           // For charts
  "react-chartjs-2": "^5.2.0",    // React wrapper for charts
  "@mui/material": "^5.15.6",     // Material-UI components
  "@mui/icons-material": "^5.15.6", // Material-UI icons
  "@tanstack/react-query": "^5.17.19", // Data fetching
  "react-router-dom": "^6.20.0",  // Routing
  "react-hot-toast": "^2.4.1",    // Notifications
  "axios": "^1.6.7",              // HTTP client
  "zustand": "^4.4.6"             // State management
}
```

**VALIDATION SCRIPT:**
```bash
# Before committing frontend changes
cd apps/web
npm install --legacy-peer-deps
npm run build
```

**IF BUILD FAILS:**
1. Check error message for missing imports
2. Add missing packages to package.json
3. Commit package.json first
4. Then commit components

---

### **RULE #15: AUDIT EXISTING FILES BEFORE CHANGES**

**BEFORE MODIFYING ANY FILE:**

**Step 1: Check if file exists**
```bash
# Use grep or find to locate file
grep -r "filename" .
find . -name "filename.ts"
```

**Step 2: Read and analyze existing file**
```bash
# Read the file completely
cat path/to/file.ts

# Check imports
grep "^import" path/to/file.ts

# Check exports
grep "^export" path/to/file.ts

# Check function signatures
grep "function\|const.*=.*=>" path/to/file.ts
```

**Step 3: Document current state**
```markdown
## File Audit: filename.ts

### Current State:
- Lines of code: X
- Imports: [list]
- Exports: [list]
- Functions: [list]
- Dependencies: [list]

### Proposed Changes:
- Add: [what]
- Modify: [what]
- Remove: [what]

### Impact Analysis:
- Files affected: [list]
- Breaking changes: [yes/no]
- Tests needed: [list]
```

**Step 4: Check for conflicts**
- Are there duplicate functions?
- Are there naming conflicts?
- Are there import conflicts?
- Are there type conflicts?

**NEVER:**
- ❌ Assume file doesn't exist
- ❌ Overwrite without reading
- ❌ Delete existing functionality
- ❌ Change function signatures without checking usage

**ALWAYS:**
- ✅ Read file first
- ✅ Understand existing code
- ✅ Document changes
- ✅ Check for conflicts
- ✅ Test after changes

---

### **RULE #16: CHECK FOR EXISTING API CALLS**

**BEFORE CREATING NEW API ENDPOINT:**

**Step 1: Search for existing endpoints**
```bash
# Search in api folder
grep -r "export.*handler\|export default" api/

# Search for similar routes
grep -r "/api/endpoint-name" .

# Check API client
grep -r "axios\|fetch" apps/web/src/services/
```

**Step 2: Check existing API services**
```typescript
// Common API service files to check:
- apps/web/src/services/apiClient.ts
- apps/web/src/services/authService.ts
- apps/web/src/services/orderService.ts
- apps/web/src/services/courierService.ts
- api/lib/*.ts
```

**Step 3: Document existing APIs**
```markdown
## Existing API Endpoints

### Similar Endpoints Found:
1. GET /api/existing-endpoint
   - Purpose: [what it does]
   - Can we use it? [yes/no]
   - Modifications needed: [list]

2. POST /api/another-endpoint
   - Purpose: [what it does]
   - Can we reuse? [yes/no]
   - Why not: [reason]

### Decision:
- [ ] Use existing endpoint
- [ ] Modify existing endpoint
- [ ] Create new endpoint (justify why)
```

**REUSE CHECKLIST:**
- [ ] Does existing endpoint do what we need?
- [ ] Can we extend it with query params?
- [ ] Can we add optional fields?
- [ ] Would modification break existing usage?

**CREATE NEW ONLY IF:**
- ✅ No similar endpoint exists
- ✅ Existing endpoint can't be extended
- ✅ Modification would break existing usage
- ✅ Different authentication/authorization needed

**EXAMPLES:**
```typescript
// ❌ BAD - Creating duplicate
POST /api/orders/create  // Already have POST /api/orders

// ✅ GOOD - Reusing existing
POST /api/orders  // Use existing endpoint

// ❌ BAD - Creating when can extend
GET /api/orders/merchant  // Can use GET /api/orders?role=merchant

// ✅ GOOD - Extending existing
GET /api/orders?role=merchant&status=pending

// ✅ GOOD - New endpoint justified
POST /api/orders/bulk-import  // Different purpose, can't reuse
```

---

### **RULE #17: CHECK EXISTING TABLES BEFORE CREATING NEW**

**BEFORE CREATING NEW TABLE:**

**Step 1: Search for similar tables**
```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Search for tables with similar names
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%keyword%';

-- Check table columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_name IN ('table1', 'table2')
ORDER BY table_name, ordinal_position;
```

**Step 2: Analyze existing tables**
```markdown
## Table Analysis

### Existing Tables Found:
1. **similar_table_1**
   - Columns: [list]
   - Purpose: [what it stores]
   - Can we use it? [yes/no]
   - Why not: [reason]

2. **similar_table_2**
   - Columns: [list]
   - Purpose: [what it stores]
   - Can we extend it? [yes/no]
   - How: [add columns/use JSONB]

### Decision:
- [ ] Use existing table
- [ ] Extend existing table (add columns)
- [ ] Create new table (justify why)
```

**REUSE STRATEGIES:**

**Strategy 1: Use existing table as-is**
```sql
-- If table has what we need
SELECT * FROM existing_table WHERE condition;
```

**Strategy 2: Add columns to existing table**
```sql
-- If table is close but missing fields
ALTER TABLE existing_table 
ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
```

**Strategy 3: Use JSONB for flexibility**
```sql
-- If table has metadata/data JSONB column
UPDATE existing_table 
SET metadata = metadata || '{"new_field": "value"}'::jsonb
WHERE id = 123;
```

**Strategy 4: Create view**
```sql
-- If need different perspective of existing data
CREATE VIEW new_view AS
SELECT col1, col2, col3 
FROM existing_table
WHERE condition;
```

**CREATE NEW TABLE ONLY IF:**
- ✅ No similar table exists
- ✅ Data structure is fundamentally different
- ✅ Extending existing table would cause conflicts
- ✅ Different access patterns/RLS needed
- ✅ High volume data needs separation

**EXAMPLES:**
```sql
-- ❌ BAD - Creating duplicate
CREATE TABLE merchant_shops (...);  
-- Already have: stores table

-- ✅ GOOD - Reusing existing
-- Use stores table instead

-- ❌ BAD - Creating when can extend
CREATE TABLE order_metadata (...);  
-- orders table has metadata JSONB

-- ✅ GOOD - Using JSONB
UPDATE orders SET metadata = metadata || '{"key": "value"}'::jsonb;

-- ✅ GOOD - New table justified
CREATE TABLE week3_webhooks (...);  
-- Different purpose, clean separation, no conflicts
```

**PREFIXING STRATEGY:**
When creating new tables for features:
- Use feature prefix: `week3_`, `analytics_`, `integration_`
- Prevents conflicts with existing tables
- Clear ownership and purpose
- Easy to identify and manage

---

### **RULE #18: CONFLICT DETECTION CHECKLIST**

**BEFORE ANY IMPLEMENTATION:**

**1. File Conflicts**
```bash
# Check if file exists
ls -la path/to/file.ts

# Check for similar filenames
find . -name "*similar*"

# Check imports in existing files
grep -r "import.*from.*'./file'" .
```

**2. Function/Component Conflicts**
```bash
# Search for function name
grep -r "function functionName\|const functionName" .

# Search for component name
grep -r "export.*ComponentName\|const ComponentName" .

# Check for duplicate exports
grep -r "export { functionName }" .
```

**3. API Route Conflicts**
```bash
# Check for route
grep -r "/api/route-name" .

# Check for similar routes
grep -r "/api/similar" api/

# Check route definitions
cat api/index.ts
```

**4. Database Conflicts**
```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'table_name'
);

-- Check column exists
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'table_name' 
  AND column_name = 'column_name'
);

-- Check for similar tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%keyword%';
```

**5. Type/Interface Conflicts**
```bash
# Search for type definition
grep -r "type TypeName\|interface TypeName" .

# Check for duplicate types
grep -r "export type TypeName" .
```

**6. Import Conflicts**
```typescript
// Check for circular dependencies
// Check for duplicate imports
// Check for conflicting versions
```

**CONFLICT RESOLUTION:**

**If conflict found:**
1. ✅ Document the conflict
2. ✅ Analyze which is correct
3. ✅ Choose resolution strategy:
   - Reuse existing (preferred)
   - Rename new (if both needed)
   - Merge functionality
   - Deprecate old (with migration)
4. ✅ Update all references
5. ✅ Test thoroughly

**NEVER:**
- ❌ Silently overwrite
- ❌ Create duplicates
- ❌ Ignore conflicts
- ❌ Assume no conflicts

---

## 📊 SPRINT WORKFLOW

### **PHASE 1: PLANNING (Before Sprint)**

**1.1 Create Sprint Spec**
```markdown
# Week X Implementation Specification

## Objectives
- Feature 1
- Feature 2
- Feature 3

## Database Validation
[Run validation queries]

## Hard Rules Check
- [ ] Validated database first
- [ ] No schema changes
- [ ] Conforms to existing structure
- [ ] Supabase compatible
- [ ] Vercel compatible
```

**1.2 Validate Database**
```sql
-- Run comprehensive validation
-- Document findings
-- Update spec with actual schema
```

**1.3 Get Approval**
- Review spec with user
- Confirm database findings
- Get go-ahead to proceed

### **PHASE 2: IMPLEMENTATION (During Sprint)**

**Day-by-Day:**

**Morning:**
- Review spec for the day
- Re-validate relevant tables
- Check hard rules compliance

**During:**
- Implement following spec
- Use validated schema only
- Test incrementally
- Commit frequently

**Evening:**
- Run verification queries
- Test all endpoints
- Update documentation
- Commit with detailed message

### **PHASE 3: VERIFICATION (After Sprint)**

**3.1 Run Final Validation**
```sql
-- Verify all tables exist
-- Check all columns added
-- Confirm indexes created
-- Test all functions
-- Verify RLS policies
```

**3.2 Test All Features**
- API endpoints
- Frontend components
- Database queries
- Authentication
- Authorization

**3.3 Create Completion Report**
```markdown
# Week X - COMPLETE

## Delivered
- Feature 1 ✅
- Feature 2 ✅
- Feature 3 ✅

## Database Changes
- Tables: X added
- Columns: Y added
- Indexes: Z added

## Verification
[Include verification results]

## Next Steps
[Week X+1 preview]
```

---

## 🔍 VALIDATION TEMPLATES

### **Template 1: Table Discovery**
```sql
-- Find tables matching pattern
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%keyword%'
ORDER BY table_name;
```

### **Template 2: Column Structure**
```sql
-- Get complete column info
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;
```

### **Template 3: Foreign Keys**
```sql
-- Check relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'your_table';
```

### **Template 4: Sample Data**
```sql
-- Check what data looks like
SELECT * FROM your_table LIMIT 5;

-- Check data types in practice
SELECT 
  column_name,
  pg_typeof(column_name) as actual_type
FROM your_table LIMIT 1;
```

---

## 📝 SPEC TEMPLATE

```markdown
# Feature Name - Implementation Spec

**Date:** YYYY-MM-DD
**Sprint:** Week X, Day Y
**Status:** Planning / In Progress / Complete

---

## 1. OBJECTIVES

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

---

## 2. DATABASE VALIDATION

### 2.1 Tables Required
- table1
- table2
- table3

### 2.2 Validation Query
\`\`\`sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('table1', 'table2', 'table3');
\`\`\`

### 2.3 Actual Schema (After Validation)
\`\`\`
table1:
  - column1: VARCHAR(50)
  - column2: INTEGER
  - column3: TIMESTAMP WITH TIME ZONE

table2:
  - column1: UUID
  - column2: JSONB
\`\`\`

### 2.4 Schema Changes Needed
- [ ] Add table X (if not exists)
- [ ] Add column Y to table Z (if not exists)
- [ ] Add index on column A

---

## 3. API ENDPOINTS

### 3.1 Endpoint 1
- **Method:** GET
- **Path:** /api/feature/endpoint1
- **Auth:** Required (role: admin)
- **Query Params:** param1, param2
- **Response:** { success, data }

### 3.2 Endpoint 2
[...]

---

## 4. FRONTEND COMPONENTS

### 4.1 Component 1
- **Path:** apps/web/src/pages/feature/Component1.tsx
- **Purpose:** Display feature data
- **Props:** prop1, prop2

---

## 5. SUCCESS CRITERIA

- [ ] Database validated
- [ ] All tables exist
- [ ] All APIs working
- [ ] Frontend displays correctly
- [ ] Tests pass
- [ ] Documentation updated

---

## 6. VERIFICATION

\`\`\`sql
-- Run after implementation
SELECT 'table1' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table1')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;
\`\`\`

---

## 7. ROLLBACK

\`\`\`sql
-- If needed
DROP TABLE IF EXISTS new_table;
\`\`\`
```

---

## ✅ COMPLIANCE CHECKLIST

**Before Starting Sprint:**
- [ ] Spec created and reviewed
- [ ] Database validated
- [ ] Actual schema documented
- [ ] Hard rules reviewed
- [ ] User approval obtained

**During Implementation:**
- [ ] Using validated schema only
- [ ] No database changes without approval
- [ ] Conforming to existing structure
- [ ] Supabase RLS enabled
- [ ] Vercel serverless compatible
- [ ] Connection pooling used
- [ ] JWT auth implemented
- [ ] Error handling added
- [ ] Related features grouped with tabs/accordions
- [ ] Menu structure is logical and discoverable
- [ ] User role checks implemented
- [ ] Subscription limits enforced
- [ ] Feature flags checked

**After Implementation:**
- [ ] Verification queries run
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Rollback script created
- [ ] Completion report written
- [ ] Code committed and pushed

---

## 🚀 BENEFITS OF THIS APPROACH

1. **Zero Schema Errors** - We know exactly what exists
2. **Faster Development** - No guessing, no debugging schema issues
3. **Safer Changes** - Always have rollback plan
4. **Better Documentation** - Everything is recorded
5. **User Confidence** - Clear specs, predictable outcomes
6. **Maintainable Code** - Follows consistent patterns
7. **Scalable Process** - Works for any feature size

---

## 📚 REFERENCE

### **Supabase Resources:**
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Auth Functions: https://supabase.com/docs/guides/auth
- PostgreSQL: https://www.postgresql.org/docs/

### **Vercel Resources:**
- Serverless Functions: https://vercel.com/docs/functions
- Environment Variables: https://vercel.com/docs/projects/environment-variables
- Edge Config: https://vercel.com/docs/storage/edge-config

### **Project Files:**
- WEEK1_COMPLETE.md - Week 1 summary
- WEEK2_IMPLEMENTATION_SPEC.md - Week 2 spec
- database/migrations/ - All SQL files

---

### **RULE #14: PACKAGE.JSON VALIDATION**

**MANDATORY BEFORE CREATING COMPONENTS:**

```bash
# Step 1: Check if package exists
npm list package-name

# Step 2: If missing, add to package.json
npm install package-name

# Step 3: Verify version compatibility
npm list

# Step 4: Test build (if possible)
npm run build
```

**WHY:** Prevents build failures from missing dependencies

**EXAMPLE:**
```json
{
  "dependencies": {
    "chart.js": "^4.4.1",
    "react-chartjs-2": "^5.2.0"
  }
}
```

**DELIVERABLE:** Updated package.json committed BEFORE component code

---

### **RULE #15: SAFE DATABASE EVOLUTION**

**WHEN MODIFYING EXISTING TABLES:**

**ALLOWED:**
- ✅ ADD new columns with DEFAULT values
- ✅ ADD new indexes
- ✅ ADD new constraints (if they don't break existing data)
- ✅ RENAME tables (with migration path)
- ✅ CREATE views on existing tables

**MIGRATION STRATEGY:**
```sql
-- Step 1: Create new table/column
ALTER TABLE old_table ADD COLUMN new_column TYPE DEFAULT value;

-- Step 2: Backfill data (if needed)
UPDATE old_table SET new_column = calculated_value;

-- Step 3: Create view for backward compatibility (if renaming)
CREATE VIEW old_name AS SELECT * FROM new_name;

-- Step 4: Update application code

-- Step 5: Drop view after transition period
-- DROP VIEW old_name; (only after confirming no usage)
```

**FORBIDDEN:**
- ❌ DROP columns with production data
- ❌ CHANGE column types that break existing data
- ❌ DROP tables without migration path
- ❌ REMOVE constraints that applications depend on

**SAFE RENAME PATTERN:**
```sql
-- Rename table safely
ALTER TABLE old_name RENAME TO new_name;

-- Create view for backward compatibility
CREATE VIEW old_name AS SELECT * FROM new_name;

-- Update application code gradually

-- Drop view after transition (30+ days)
```

**DELIVERABLE:** Migration script with rollback plan

---

### **RULE #16: DATABASE VALIDATION BEFORE MIGRATION (HARD)**

**MANDATORY BEFORE ANY MIGRATION:**

```sql
-- Step 1: Check table type (TABLE vs VIEW)
SELECT table_type FROM information_schema.tables 
WHERE table_name = 'target_table';

-- Step 2: Get actual columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'target_table'
ORDER BY ordinal_position;

-- Step 3: Check for views
SELECT viewname, definition 
FROM pg_views 
WHERE viewname = 'target_table';

-- Step 4: Verify data exists
SELECT COUNT(*) as row_count FROM target_table;

-- Step 5: Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'target_table';
```

**WHY:** Prevents migration failures from incorrect assumptions about table structure

**DELIVERABLE:** Validation report showing table type, columns, constraints, row count

---

### **RULE #17: PREFIXED TABLE NAMES FOR NEW FEATURES (HARD)**

**WHEN CREATING TABLES FOR NEW FEATURES:**

Use feature prefix to avoid conflicts:
- `week3_webhooks` instead of `webhooks`
- `analytics_metrics` instead of `metrics`
- `integration_events` instead of `events`

**PATTERN:**
```sql
-- ❌ BAD - Generic name, potential conflicts
CREATE TABLE webhooks (...);

-- ✅ GOOD - Prefixed, clear ownership
CREATE TABLE week3_webhooks (...);
```

**BENEFITS:**
- No conflicts with existing tables
- Clear feature ownership
- Easy to identify and manage
- Enables parallel development
- Safe to drop if feature fails

**WHY:** Prevents conflicts, enables safe experimentation, clear separation

---

### **RULE #18: NO ASSUMPTIONS ABOUT TABLE STRUCTURE (HARD)**

**NEVER ASSUME:**
- ❌ Column names without verification
- ❌ Table vs View
- ❌ Primary key columns
- ❌ Foreign key relationships
- ❌ Data types
- ❌ Constraints

**ALWAYS VERIFY:**
```sql
-- Before writing any query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'target_table';
```

**EXAMPLE OF FAILURE:**
```sql
-- Assumed shop_id exists
SELECT * FROM stores WHERE shop_id = '...';
-- ERROR: column shop_id does not exist

-- Should have verified first
-- Actual column: store_id
```

**WHY:** Database schema changes, views replace tables, columns get renamed

**DELIVERABLE:** Validation query results before writing migration

---

### **RULE #19: DUAL-MODE DEVELOPMENT (MEDIUM)**

**FOR STABLE DEVELOPMENT:**

```
main (stable, production-ready)
  ↓ merge only when tested
dev (active development, tested features)
  ↓ merge after feature complete
feature/week3-integrations (experimental)
```

**WORKFLOW:**
1. Create feature branch from dev
2. Develop and test in feature branch
3. Merge to dev when feature works
4. Test in dev environment
5. Merge to main when stable

**WHY:** Allows development without breaking production

**DELIVERABLE:** Branch strategy documented in README

---

### **RULE #20: ROLLBACK SCRIPTS REQUIRED (MEDIUM)**

**FOR EVERY MIGRATION:**

Create paired scripts:
```sql
-- 001_create_webhooks_UP.sql
CREATE TABLE week3_webhooks (...);
CREATE INDEX idx_webhooks_user ON week3_webhooks(user_id);

-- 001_create_webhooks_DOWN.sql
DROP INDEX IF EXISTS idx_webhooks_user;
DROP TABLE IF EXISTS week3_webhooks;
```

**TEST ROLLBACK BEFORE APPLYING:**
```bash
# Apply migration
psql -f 001_create_webhooks_UP.sql

# Test rollback
psql -f 001_create_webhooks_DOWN.sql

# If rollback works, apply for real
psql -f 001_create_webhooks_UP.sql
```

**WHY:** Enables quick recovery from failed migrations

**DELIVERABLE:** UP and DOWN scripts for every migration

---

### **RULE #21: WEEKLY AUDIT REPORTS (SOFT)**

**EVERY FRIDAY:**
- Document what was completed
- List current blockers
- Update roadmap
- Review framework effectiveness
- Identify technical debt

**TEMPLATE:** Use `PERFORMILE_PROJECT_AUDIT_[DATE].md`

**WHY:** Maintains visibility, tracks progress, identifies issues early

---

### **RULE #22: DECISION LOGS (SOFT)**

**FOR MAJOR DECISIONS:**

Document using this format:
```markdown
## Decision: [Title]
**Date:** [Date]
**Context:** [Why decision needed]
**Options:**
- Option A: [Description] - Pros/Cons
- Option B: [Description] - Pros/Cons
- Option C: [Description] - Pros/Cons
**Decision:** [Chosen option]
**Reasoning:** [Why chosen]
**Impact:** [What changes]
```

**WHY:** Provides context for future developers, prevents repeated mistakes

---

---

### **RULE #23: CHECK FOR DUPLICATES BEFORE BUILDING (HARD)**

**CRITICAL: ALWAYS SEARCH FIRST**

Before creating ANY new code, database table, or API endpoint:

**Step 1: Search for similar database tables**
```bash
# Search in database folder
grep -r "CREATE TABLE.*keyword" database/
grep -r "keyword" supabase/migrations/

# Check existing tables
psql -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%keyword%'"
```

**Step 2: Search for similar APIs**
```bash
# Find API files
find api/ -name "*.ts" | xargs grep -l "keyword"

# Search for exports
grep -r "export default" api/ | grep -i "keyword"

# Check existing endpoints
ls -la api/*/
```

**Step 3: Search for similar components**
```bash
# Find components
find apps/web/src/components/ -name "*.tsx" | xargs grep -l "keyword"

# Check component exports
grep -r "export.*ComponentName" apps/web/src/components/
```

**Step 4: Search for similar services**
```bash
# List services
ls apps/web/src/services/*.ts

# Search service content
grep -r "keyword" apps/web/src/services/
```

**MANDATORY PRE-IMPLEMENTATION CHECKLIST:**
- [ ] Ran grep/find commands to search for duplicates
- [ ] Checked `database/` folder for existing tables
- [ ] Reviewed `api/` folder for existing endpoints
- [ ] Searched `apps/web/src/components/` for similar UI
- [ ] Checked `apps/web/src/services/` for existing services
- [ ] Reviewed existing documentation in `docs/`
- [ ] Asked: "Does this already exist in a different form?"
- [ ] Asked: "Can I extend existing code instead of creating new?"
- [ ] Documented findings (what exists vs. what's needed)
- [ ] Confirmed minimal implementation plan

**WHY:** Prevents duplicate code, saves time, maintains consistency, reduces bugs

**CASE STUDY - October 22, 2025:**
```
❌ MISTAKE: Created courier integration system without checking first

WHAT ALREADY EXISTED:
- tracking_data table (18 columns)
- tracking_events table (event history)
- courier_api_credentials table (18 columns)
- /api/tracking/ endpoints (6 files)
- Tracking components and services

WHAT WAS UNNECESSARILY CREATED:
- courier_integrations table (duplicate)
- shipment_events table (duplicate)
- /api/courier-integrations.ts (duplicate)
- /api/shipment-tracking.ts (duplicate)

IMPACT:
- Time wasted: ~2.5 hours
- Code duplication: ~60%
- Maintenance burden: 2x
- Potential bugs: Inconsistent data

LESSON: ALWAYS check existing code first!
```

**DELIVERABLE:** Search results documented before starting implementation

---

### **RULE #24: REUSE EXISTING CODE (HARD)**

**ALWAYS PREFER:**
- ✅ Extending existing tables over creating new ones
- ✅ Adding actions to existing APIs over new endpoints
- ✅ Enhancing existing components over duplicating
- ✅ Reusing existing services over creating new ones

**DATABASE REUSE STRATEGIES:**

**Strategy 1: Use existing table as-is**
```sql
-- If table has what you need
SELECT * FROM existing_table WHERE condition;
```

**Strategy 2: Add columns to existing table**
```sql
-- If table is close but missing fields
ALTER TABLE existing_table 
ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
```

**Strategy 3: Use JSONB for flexibility**
```sql
-- If table has metadata/data JSONB column
UPDATE existing_table 
SET metadata = metadata || '{"new_field": "value"}'::jsonb;
```

**Strategy 4: Create view**
```sql
-- If need different perspective of existing data
CREATE VIEW new_view AS
SELECT col1, col2, col3 FROM existing_table WHERE condition;
```

**API REUSE STRATEGIES:**

**Strategy 1: Add action to existing endpoint**
```typescript
// Extend existing api/tracking/summary.ts
export default async function handler(req, res) {
  const action = req.query.action;
  
  switch (action) {
    case 'summary':
      return getSummary(req, res);
    case 'shipment': // NEW ACTION
      return getShipment(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}
```

**Strategy 2: Add query parameters**
```typescript
// Instead of: POST /api/orders/merchant
// Use: POST /api/orders?role=merchant
```

**COMPONENT REUSE STRATEGIES:**

**Strategy 1: Add props to existing component**
```tsx
// Extend existing OrdersList.tsx
export const OrdersList = ({ 
  showShipmentDetails = false, // NEW PROP
  showTrackingTimeline = false // NEW PROP
}) => {
  // Reuse existing component with new features
}
```

**Strategy 2: Compose existing components**
```tsx
// Instead of creating new component
// Compose existing ones
<TrackingContainer>
  <OrdersList />
  <ShipmentTimeline />
</TrackingContainer>
```

**WHEN TO CREATE NEW (ONLY IF):**
- ✅ No similar code exists
- ✅ Existing code can't be extended
- ✅ Modification would break existing usage
- ✅ Different authentication/authorization needed
- ✅ Completely different purpose

**EXAMPLES:**

```typescript
// ❌ BAD - Creating duplicate
CREATE TABLE courier_integrations (...);
// Already have: courier_api_credentials

// ✅ GOOD - Reusing existing
ALTER TABLE courier_api_credentials ADD COLUMN ...;

// ❌ BAD - Creating duplicate API
POST /api/shipment-tracking
// Already have: /api/tracking/

// ✅ GOOD - Extending existing
POST /api/tracking?action=shipment

// ❌ BAD - Creating duplicate component
export const ShipmentList = () => { ... }
// Already have: OrdersList

// ✅ GOOD - Extending existing
<OrdersList showShipmentDetails={true} />
```

**CORRECT WORKFLOW:**

1. **Receive Requirement** - Understand what needs to be built
2. **SEARCH FIRST** - Check for existing similar code (MANDATORY)
3. **Document Findings** - List what exists vs. what's needed
4. **Identify Gaps** - What's truly missing?
5. **Plan Minimal Addition** - Only build what doesn't exist
6. **Extend, Don't Duplicate** - Enhance existing code when possible
7. **Implement** - Build only the genuinely new features
8. **Document** - Note what was reused vs. created

**IMPACT METRICS:**

Time saved by checking first:
- Database: ~30 minutes (avoid duplicate tables)
- APIs: ~45 minutes (reuse existing endpoints)
- Frontend: ~30 minutes (reuse components)
- Testing: ~20 minutes (existing tests work)
- Documentation: ~15 minutes (update vs. create)
- **TOTAL: ~2.5 hours saved per feature**

Code quality improvements:
- Less duplication = easier maintenance
- Consistent patterns = fewer bugs
- Reused code = already tested
- Smaller PRs = faster reviews
- Single source of truth = no conflicts

**WHY:** Saves time, reduces bugs, maintains consistency, improves maintainability

**DELIVERABLE:** Documentation of what was reused and why new code was necessary

---

---

## 🎯 RULE #25: MASTER DOCUMENT VERSIONING (HARD)

**MANDATORY:** Every significant update to the master document MUST follow this versioning system.

**VERSIONING FORMAT:**
```
PERFORMILE_MASTER_V[MAJOR].[MINOR].md
```

**VERSION NUMBERS:**
- **MAJOR** - Increments when:
  - Database structure changes significantly (10+ new tables)
  - Major features added (new modules, systems)
  - Architecture changes
  - Breaking changes
  
- **MINOR** - Increments when:
  - Minor features added
  - Documentation updates
  - Bug fixes documented
  - Metrics updated
  - Small improvements

**STORAGE LOCATION:**
```
docs/[YYYY-MM-DD]/PERFORMILE_MASTER_V[MAJOR].[MINOR].md
```

**EXAMPLES:**
- `docs/2025-10-07/PERFORMILE_MASTER_V2.0.md` - Original master (39 tables)
- `docs/2025-10-22/PERFORMILE_MASTER_V2.1.md` - Updated master (78 tables, +Week 4)
- `docs/2025-11-01/PERFORMILE_MASTER_V3.0.md` - Major update (new TMS system)

**REQUIRED METADATA IN DOCUMENT:**
```markdown
**Platform Version:** [X.Y.Z]
**Document Version:** V[MAJOR].[MINOR]
**Last Updated:** [Date and Time]
**Previous Version:** V[MAJOR].[MINOR] (if applicable)
**Status:** [Production-Ready / In Development / etc.]
```

**CHANGE LOG SECTION:**
Every new version MUST include a "What Changed Since V[X.Y]" section:
```markdown
## 📋 WHAT CHANGED SINCE V2.0

### Added:
- Feature 1
- Feature 2

### Updated:
- Metric 1
- Metric 2

### Removed:
- Deprecated feature 1
```

**FOLDER ORGANIZATION:**
```
docs/
├── 2025-10-07/
│   ├── PERFORMILE_MASTER_V2.0.md
│   └── [other docs from that date]
├── 2025-10-22/
│   ├── PERFORMILE_MASTER_V2.1.md
│   ├── COMPREHENSIVE_PROJECT_AUDIT.md
│   ├── SQL_CLEANUP_PLAN.md
│   └── [other docs from that date]
└── [future dates]/
    └── PERFORMILE_MASTER_V[X.Y].md
```

**WHY THIS RULE:**
- ✅ Clear version history
- ✅ Easy to track changes over time
- ✅ Organized by date
- ✅ No confusion about which is current
- ✅ Audit trail for compliance
- ✅ Easy rollback if needed

**ENFORCEMENT:**
- Every master document update creates a new version
- Old versions are kept in their dated folders
- Current version is always the highest number
- No overwriting existing versions

**DELIVERABLE:** Properly versioned master document in dated folder with change log

---

## 🎯 RULE #26: VERIFY TABLE SCHEMA BEFORE UPDATES (HARD)

**CRITICAL: ALWAYS CHECK DATA TYPES BEFORE WRITING SQL**

**THE PROBLEM:**
Writing SQL updates with wrong data types causes runtime errors:
```sql
-- ❌ WRONG: Assuming tier is VARCHAR
WHERE tier = 'tier1'  -- ERROR: invalid input syntax for type integer

-- ✅ CORRECT: Verified tier is INTEGER
WHERE tier = 1  -- Works!
```

**MANDATORY BEFORE ANY UPDATE/INSERT:**

**Step 1: Check Table Schema**
```sql
-- Get column names and data types
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'table_name'
ORDER BY ordinal_position;
```

**Step 2: Verify Data Types**
```sql
-- Check specific column
SELECT data_type 
FROM information_schema.columns
WHERE table_name = 'subscription_plans' 
AND column_name = 'tier';
-- Result: integer (NOT varchar!)
```

**Step 3: Check Constraints**
```sql
-- Check constraints on table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'table_name';

-- Check column constraints
SELECT column_name, constraint_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'table_name';
```

**COMMON DATA TYPE MISTAKES:**

| Assumed | Actual | Fix |
|---------|--------|-----|
| `tier = 'tier1'` | `tier INTEGER` | `tier = 1` |
| `status = 1` | `status VARCHAR` | `status = 'active'` |
| `price = '29.99'` | `price DECIMAL` | `price = 29.99` |
| `is_active = 'true'` | `is_active BOOLEAN` | `is_active = true` |
| `user_id = 123` | `user_id UUID` | `user_id = '...'::UUID` |

**BEFORE WRITING SQL:**
1. ✅ Run schema query for target table
2. ✅ Verify data types for ALL columns you're using
3. ✅ Check constraints (CHECK, UNIQUE, NOT NULL)
4. ✅ Verify foreign key relationships
5. ✅ Test query on sample data first

**SEARCH EXISTING MIGRATIONS:**
```bash
# Find how table was created
grep -r "CREATE TABLE table_name" database/

# Find existing updates to same table
grep -r "UPDATE table_name" database/

# Check existing WHERE clauses for patterns
grep -r "WHERE tier" database/
```

**CASE STUDY (Oct 26, 2025):**
```sql
-- ❌ WRONG: Assumed tier was VARCHAR
UPDATE subscription_plans SET max_order_rules = 3
WHERE tier = 'tier1';
-- ERROR: invalid input syntax for type integer: "tier1"

-- ✅ CORRECT: Checked schema, tier is INTEGER
UPDATE subscription_plans SET max_order_rules = 3
WHERE tier = 1;
-- SUCCESS!
```

**WHY THIS RULE:**
- ✅ Prevents runtime SQL errors
- ✅ Catches type mismatches early
- ✅ Ensures data integrity
- ✅ Saves debugging time
- ✅ Avoids production failures

**ENFORCEMENT:**
- MANDATORY schema check before ANY SQL write operation
- Document data types in migration comments
- Test on sample data before production
- No assumptions about column types

**DELIVERABLE:** Schema verification query results + correct SQL with proper data types

---

---

## 🎯 RULE #27: BEWARE OF DUPLICATE TABLE NAMES (HARD)

**CRITICAL: DATABASE HAS BOTH `stores` AND `shops` TABLES**

**THE PROBLEM:**
The Performile database has TWO separate merchant store tables:
- `stores` table with `store_id` (UUID) column
- `shops` table with `shop_id` (INTEGER) column

**CONFUSION CAUSED:**
```sql
-- ❌ WRONG: Assuming only one table exists
SELECT * FROM stores WHERE shop_id = 123;
-- ERROR: column "shop_id" does not exist

-- ❌ WRONG: Assuming shop_id is UUID
WHERE shop_id IN (SELECT store_id FROM stores ...)
-- ERROR: operator does not exist: integer = uuid

-- ✅ CORRECT: Check which table and column exist first
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name IN ('stores', 'shops')
AND column_name LIKE '%id%';
```

**MANDATORY BEFORE USING STORE/SHOP REFERENCES:**

**Step 1: Identify Which Table Exists**
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('stores', 'shops')
AND column_name IN ('store_id', 'shop_id', 'id')
ORDER BY table_name, column_name;
```

**Step 2: Check Foreign Key References**
```sql
-- Check what other tables reference
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (ccu.table_name = 'stores' OR ccu.table_name = 'shops');
```

**Step 3: Handle Type Mismatches**
```sql
-- If shop_id (INTEGER) needs to match store_id (UUID)
-- Cast both to TEXT for comparison
WHERE stores.store_id::TEXT = other_table.shop_id::TEXT

-- Or check if shops table should be used instead
WHERE shop_id IN (SELECT shop_id FROM shops WHERE ...)
```

**COMMON SCENARIOS:**

| Table | Primary Key | Data Type | Used By |
|-------|-------------|-----------|---------|
| `stores` | `store_id` | UUID | Core system, RLS policies |
| `shops` | `shop_id` | INTEGER | Legacy APIs, some integrations |

**Integration Tables (use shop_id):**
- `ecommerce_integrations.shop_id` → Could reference either table
- `shopintegrations.shop_id` → Could reference either table
- `webhooks.shop_id` → Could reference either table
- `api_keys.shop_id` → Could reference either table
- `delivery_requests.shop_id` → Could reference either table

**SAFE RLS POLICY PATTERN:**
```sql
-- Check BOTH tables with OR logic
CREATE POLICY table_select_own ON some_table
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id::TEXT = some_table.shop_id::TEXT
      AND stores.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.shop_id = some_table.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );
```

**CASE STUDY (Oct 26, 2025):**
```sql
-- ❌ WRONG: Assumed delivery_requests.store_id exists
CREATE POLICY delivery_requests_select_merchant ON delivery_requests
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid())
  );
-- ERROR: column "store_id" does not exist
-- HINT: Perhaps you meant to reference the column "delivery_requests.shop_id"

-- ❌ WRONG: Fixed column name but wrong type
CREATE POLICY delivery_requests_select_merchant ON delivery_requests
  FOR SELECT USING (
    shop_id IN (SELECT store_id FROM stores WHERE owner_user_id = auth.uid())
  );
-- ERROR: operator does not exist: integer = uuid

-- ✅ CORRECT: Cast both to TEXT
CREATE POLICY delivery_requests_select_merchant ON delivery_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.store_id::TEXT = delivery_requests.shop_id::TEXT
      AND stores.owner_user_id = auth.uid()
    )
  );
-- SUCCESS!
```

**WHY THIS RULE:**
- ✅ Prevents column not found errors
- ✅ Prevents type mismatch errors
- ✅ Handles legacy schema issues
- ✅ Works with both table structures
- ✅ Saves hours of debugging

**ENFORCEMENT:**
- ALWAYS check if both `stores` and `shops` tables exist
- ALWAYS verify column names and data types
- ALWAYS use type casting when comparing different types
- ALWAYS test RLS policies with both table scenarios
- Document which table is being used in comments

**DELIVERABLE:** Schema check results + RLS policies that work with both tables

---

---

## 🎯 RULE #28: VERIFY ALL COLUMN NAMES BEFORE RLS POLICIES (HARD)

**CRITICAL: NEVER ASSUME COLUMN NAMES - ALWAYS VERIFY FIRST**

**THE PROBLEM:**
During RLS policy implementation (Oct 26, 2025), encountered **multiple column name errors** that caused repeated failures and wasted time. Each error required fixing the SQL, committing, and re-running.

**ERRORS ENCOUNTERED:**

| Error | Table | Expected Column | Actual Column | Fix |
|-------|-------|----------------|---------------|-----|
| `column "shop_id" does not exist` | `stores` | `shop_id` | `store_id` | Use `store_id` |
| `column "store_id" does not exist` | `delivery_requests` | `store_id` | `shop_id` | Use `shop_id` |
| `operator does not exist: integer = uuid` | `delivery_requests` | UUID | INTEGER | Cast to TEXT |
| `column "order_id" does not exist` | `tracking_events` | `order_id` | `tracking_id` | Use `tracking_id` |
| `relation "shops" does not exist` | N/A | `shops` | `stores` | Remove `shops` |
| `column "customer_id" does not exist` | `orders` | `customer_id` | `consumer_id` | Use `consumer_id` |
| `column "user_id" does not exist` | `orders` | `user_id` | `consumer_id` | Use `consumer_id` |
| `column "merchant_id" does not exist` | `orders` | `merchant_id` | `store_id` | Use `store_id` |
| `relation "merchants" does not exist` | N/A | `merchants` | `stores` | Use `stores` table |
| `column "merchant_id" does not exist` | `stores` | `merchant_id` | `owner_user_id` | Use `owner_user_id` |

**MANDATORY VERIFICATION BEFORE RLS POLICIES:**

**Step 1: List ALL Columns in Target Table**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;
```

**Step 2: Check Foreign Key Columns**
```sql
-- Find what columns reference other tables
SELECT 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage AS kcu
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'your_table_name'
AND kcu.constraint_name LIKE '%fkey%';
```

**Step 3: Check Data Types for Comparisons**
```sql
-- Verify data types match for JOIN/WHERE conditions
SELECT 
  t1.table_name,
  t1.column_name,
  t1.data_type AS t1_type,
  t2.table_name AS ref_table,
  t2.column_name AS ref_column,
  t2.data_type AS t2_type
FROM information_schema.columns t1
CROSS JOIN information_schema.columns t2
WHERE t1.table_name = 'table1'
AND t1.column_name = 'column1'
AND t2.table_name = 'table2'
AND t2.column_name = 'column2';
```

**Step 4: Document Findings in Migration Comments**
```sql
-- =====================================================
-- TABLE: tracking_events
-- =====================================================
-- VERIFIED COLUMNS (Oct 26, 2025):
--   - tracking_id UUID (FK to tracking_data.tracking_id)
--   - event_time TIMESTAMP
--   - status VARCHAR(50)
-- NOTE: Does NOT have order_id directly
-- NOTE: Links via tracking_id -> tracking_data -> order_id
-- =====================================================
```

**COMMON COLUMN NAME VARIATIONS TO CHECK:**

| Concept | Possible Column Names |
|---------|----------------------|
| **Store/Shop** | `store_id`, `shop_id`, `merchant_id`, `owner_id` |
| **Customer** | `customer_id`, `consumer_id`, `user_id`, `buyer_id` |
| **Order** | `order_id`, `tracking_number`, `shipment_id` |
| **User** | `user_id`, `owner_user_id`, `created_by`, `updated_by` |
| **Courier** | `courier_id`, `carrier_id`, `delivery_service_id` |
| **Tracking** | `tracking_id`, `tracking_number`, `shipment_id` |

**SAFE RLS POLICY PATTERN:**
```sql
DO $$
DECLARE
  v_has_customer_id BOOLEAN;
  v_has_consumer_id BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) INTO v_has_customer_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'consumer_id'
  ) INTO v_has_consumer_id;
  
  -- Create policy based on what exists
  IF v_has_customer_id AND v_has_consumer_id THEN
    -- Handle both columns
    CREATE POLICY orders_select_own ON orders
      FOR SELECT USING (
        customer_id = auth.uid() OR consumer_id = auth.uid()
      );
  ELSIF v_has_customer_id THEN
    -- Only customer_id
    CREATE POLICY orders_select_own ON orders
      FOR SELECT USING (customer_id = auth.uid());
  ELSIF v_has_consumer_id THEN
    -- Only consumer_id
    CREATE POLICY orders_select_own ON orders
      FOR SELECT USING (consumer_id = auth.uid());
  END IF;
END $$;
```

**CASE STUDIES (Oct 26, 2025):**

**1. tracking_events Error**
```sql
-- ❌ WRONG: Assumed order_id exists
CREATE POLICY tracking_events_select_merchant ON tracking_events
  FOR SELECT USING (
    order_id IN (SELECT order_id FROM orders WHERE ...)
  );
-- ERROR: column "order_id" does not exist

-- ✅ CORRECT: Verified schema first
-- tracking_events has tracking_id (FK to tracking_data)
-- tracking_data has order_id (FK to orders)
CREATE POLICY tracking_events_select_merchant ON tracking_events
  FOR SELECT USING (
    tracking_id IN (
      SELECT tracking_id FROM tracking_data 
      WHERE order_id IN (SELECT order_id FROM orders WHERE ...)
    )
  );
```

**2. shops Table Error**
```sql
-- ❌ WRONG: Assumed shops table exists
CREATE POLICY shop_analytics_select_own ON shopanalyticssnapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM shops WHERE ...)
  );
-- ERROR: relation "shops" does not exist

-- ✅ CORRECT: Verified only stores table exists
CREATE POLICY shop_analytics_select_own ON shopanalyticssnapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stores WHERE ...)
  );
```

**3. Type Mismatch Error**
```sql
-- ❌ WRONG: Assumed same data types
WHERE shop_id IN (SELECT store_id FROM stores ...)
-- ERROR: operator does not exist: integer = uuid

-- ✅ CORRECT: Cast to compatible type
WHERE shop_id::TEXT IN (SELECT store_id::TEXT FROM stores ...)
-- Or use EXISTS with explicit cast
WHERE EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.store_id::TEXT = table.shop_id::TEXT
)
```

**WHY THIS RULE:**
- ✅ Prevents "column does not exist" errors
- ✅ Prevents type mismatch errors
- ✅ Prevents "relation does not exist" errors
- ✅ Saves hours of debugging time
- ✅ Ensures RLS policies work on first try
- ✅ Documents schema for future developers

**TIME WASTED WITHOUT THIS RULE:**
- Oct 26, 2025: **90 minutes** fixing 10 column/table errors
- Each error: 5-10 minutes to fix, commit, push, re-run
- **Total iterations:** 12+ versions (V1 → V2 → V3 → fixes)
- **SOLUTION:** Created PRODUCTION_SCHEMA_DOCUMENTED.md with actual schema

**TIME SAVED WITH THIS RULE:**
- **5 minutes** upfront verification
- **0 errors** during implementation
- **1 version** instead of 8

**ENFORCEMENT:**
- MANDATORY schema verification before ANY RLS policy
- Document all column names in migration header
- Check data types for all JOIN/WHERE conditions
- Test with both NULL and non-NULL values
- Never assume column names match table names

**DELIVERABLE:** Schema verification results + RLS policies that work on first deployment

---

---

## 🚨 FRAMEWORK ENFORCEMENT

### **RECENT VIOLATIONS & LESSONS LEARNED**

**October 26, 2025 - RLS Implementation:**
- ❌ **Violation:** Assumed column names without verification
- ⏱️ **Time Wasted:** 90 minutes fixing 10 errors
- ✅ **Fix:** Created RULE #28 + PRODUCTION_SCHEMA_DOCUMENTED.md
- 📚 **Lesson:** ALWAYS verify schema before writing SQL

**October 26, 2025 - Database Duplicates:**
- ❌ **Issue:** Found `stores` vs `shops` table confusion
- ❌ **Issue:** Found `store_id` vs `shop_id` column inconsistencies
- ⏱️ **Impact:** Unclear which tables are actually used
- ✅ **Fix:** Enhanced RULE #1 with duplicate detection
- 📚 **Lesson:** Check for duplicates BEFORE creating new tables

### **ARE WE FOLLOWING THE FRAMEWORK?**

**✅ YES - Recent Successes:**
- RLS implementation followed validation-first approach
- Created PRODUCTION_SCHEMA_DOCUMENTED.md before policies
- All 21 tables secured with proper validation
- Schema discovery prevented future errors

**⚠️ NEEDS IMPROVEMENT:**
- Need to check for duplicates before creating tables
- Need to validate database BEFORE every sprint (not during)
- Need to enforce spec-driven approach for ALL features
- Need to document WHY when altering existing structures

### **FRAMEWORK ADHERENCE CHECKLIST**

**Before Starting ANY Feature:**
- [ ] RULE #1: Run database validation SQL
- [ ] RULE #1: Check for duplicate tables/columns
- [ ] RULE #1: Document actual schema
- [ ] RULE #6: Create feature spec
- [ ] RULE #6: Get user approval
- [ ] RULE #6: Only then start coding

**During Implementation:**
- [ ] RULE #2: Never ALTER/DROP/RENAME without approval
- [ ] RULE #3: Use EXACT column names from validation
- [ ] RULE #5: Follow current API template
- [ ] RULE #6: Follow approved spec exactly

**After Implementation:**
- [ ] RULE #7: Run verification queries
- [ ] RULE #9: Create rollback scripts
- [ ] RULE #10: Update documentation

### **ENFORCEMENT GOING FORWARD**

**MANDATORY FOR ALL FUTURE WORK:**
1. ✅ Database validation BEFORE every sprint
2. ✅ Duplicate detection BEFORE creating tables
3. ✅ Spec creation and approval BEFORE coding
4. ✅ Explicit justification for ANY database changes
5. ✅ Follow RULE #5 and RULE #6 without exception

**IF FRAMEWORK IS NOT FOLLOWED:**
- ⚠️ Stop and validate database immediately
- ⚠️ Create spec if missing
- ⚠️ Get approval before proceeding
- ⚠️ Document why framework was bypassed

---

---

## 🚀 RULE #29: LAUNCH PLAN ADHERENCE (HARD)

**CORE PRINCIPLE:**
> **"Stay focused on the 5-week MVP launch plan. No feature creep. No distractions. Launch first, iterate second."**

### **⚠️ IMPORTANT: ALL OTHER RULES STILL APPLY!**

**RULE #29 does NOT replace other rules. It ADDS to them.**

**During 5-week launch, you MUST still:**
- ✅ **RULE #1:** Validate database before any changes
- ✅ **RULE #2:** Never change existing database without approval
- ✅ **RULE #3:** Conform to existing schema
- ✅ **RULE #5:** Follow current API template
- ✅ **RULE #6:** Follow approved spec exactly
- ✅ **RULE #23:** Check for duplicates before building
- ✅ **RULE #24:** Reuse existing code
- ✅ **All other rules:** Still mandatory

**RULE #29 adds:**
- ✅ Launch plan tracking (daily/weekly)
- ✅ Scope control (no feature creep)
- ✅ Launch-critical focus only

**Think of it as:**
- **Rules #1-28:** HOW to build (quality, process, validation)
- **Rule #29:** WHAT to build (launch-critical only, no scope creep)

### **MANDATORY LAUNCH PLAN TRACKING:**

**Every START_OF_DAY_BRIEFING.md MUST include:**

```markdown
## 📅 LAUNCH PLAN TRACKER

**Current Date:** [Date]  
**Launch Date:** December 9, 2025  
**Days Until Launch:** [X days]  
**Current Week:** Week [X] of 5  
**Current Phase:** [Phase Name]

### **This Week's Focus:**
- [Primary objective]
- [Secondary objective]
- [Deliverables]

### **Week Status:**
- [ ] Day 1: [Task]
- [ ] Day 2: [Task]
- [ ] Day 3: [Task]
- [ ] Day 4: [Task]
- [ ] Day 5: [Task]

### **On Track?**
- ✅ YES / ⚠️ AT RISK / ❌ BLOCKED
- **Reason:** [If not on track]
- **Action:** [Corrective action]
```

### **5-WEEK LAUNCH PLAN:**

**Week 1 (Nov 4-8): Fix & Test - $1,000**
- Fix 7 blocking issues
- Test Shopify plugin thoroughly
- Test all critical user flows
- Document remaining issues

**Week 2 (Nov 11-15): Polish & Optimize - $2,000**
- Streamline checkout experience
- Optimize reviews & ratings
- Display TrustScore prominently
- Mobile responsive testing

**Week 3 (Nov 18-22): Marketing Prep - $1,000**
- Create landing pages
- Write documentation
- Prepare marketing materials
- Set up support system

**Week 4 (Nov 25-29): Beta Launch - $500**
- Recruit 10 beta users
- Personal onboarding
- Process first orders
- Gather feedback

**Week 5 (Dec 2-6): Iterate & Prepare - $500**
- Fix beta feedback
- Optimize based on usage
- Prepare public launch
- Finalize pricing

**Week 6 (Dec 9): 🚀 PUBLIC LAUNCH!**

### **FORBIDDEN DURING 5-WEEK LAUNCH:**
❌ Building new major features (TMS, WMS, Mobile Apps)  
❌ Database schema changes (unless fixing critical bugs)  
❌ New integrations (unless essential for launch)  
❌ Refactoring existing code (unless blocking launch)  
❌ "Nice to have" features  
❌ Scope creep of any kind

### **ALLOWED DURING 5-WEEK LAUNCH:**
✅ Bug fixes (blocking issues only)  
✅ Polish existing features  
✅ Testing and QA  
✅ Documentation  
✅ Marketing materials  
✅ Beta user support  
✅ Performance optimization (if critical)

### **DECISION FRAMEWORK:**

**Before starting ANY work, ask:**
1. **Does this help us launch on Dec 9?**
   - YES → Proceed
   - NO → Defer to post-launch

2. **Is this blocking the launch?**
   - YES → High priority
   - NO → Low priority or defer

3. **Can we launch without this?**
   - YES → Defer to post-launch
   - NO → Include in launch plan

### **ACCOUNTABILITY:**

**Daily Check:**
- [ ] Did I work on launch-critical tasks only?
- [ ] Did I avoid feature creep?
- [ ] Am I on track for this week's goals?

**Weekly Check:**
- [ ] Did we complete this week's objectives?
- [ ] Are we on track for Dec 9 launch?
- [ ] Do we need to adjust the plan?

**If Off Track:**
1. **STOP** - Don't continue down wrong path
2. **ASSESS** - Why are we off track?
3. **ADJUST** - What needs to change?
4. **COMMUNICATE** - Update team and stakeholders
5. **REFOCUS** - Get back on launch-critical work

### **POST-LAUNCH DEVELOPMENT:**

**After Dec 9 launch, follow phased roadmap:**

**Phase 2 (Weeks 6-12): Customer Retention**
- Build based on user feedback
- Focus on retention features
- Investment: $15,000

**Phase 3 (Weeks 13-26): Scale**
- TMS Lite, Mobile Apps, AI Phase 1
- Build based on market demand
- Investment: $80,000

**Phase 4 (Weeks 27+): Advanced**
- Full TMS, Advanced AI, WMS
- Build based on revenue and demand
- Investment: $446,000

### **ENFORCEMENT:**

**This is a HARD RULE - No exceptions.**

**Violations:**
- ⚠️ Working on non-launch features → STOP immediately
- ⚠️ Scope creep → Remove from sprint
- ⚠️ Missing daily briefing tracker → Add immediately
- ⚠️ Off track without action plan → Create action plan

**Remember:**
> **"Launch fast, iterate based on real customer feedback. Perfect is the enemy of good."**

---

## 🎯 RULE #30: API ENDPOINT IMPACT ANALYSIS (HARD)

**CRITICAL: BEFORE CHANGING/REMOVING ANY API ENDPOINT**

**CORE PRINCIPLE:**
> **"Never change or remove an API endpoint without checking all files that depend on it. Breaking changes cascade."**

### **MANDATORY STEPS BEFORE API CHANGES:**

**1. Search for ALL references to the endpoint:**
```bash
# Search for exact endpoint path
grep -r "/api/your-endpoint" apps/web/src/

# Search for partial matches
grep -r "your-endpoint" apps/web/src/

# Search in all TypeScript/JavaScript files
find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "your-endpoint"
```

**2. Document ALL files that use the endpoint:**
```markdown
## API Impact Analysis

**Endpoint:** `/api/couriers/merchant-list`

**Files Found:**
1. `apps/web/src/pages/settings/CourierPreferences.tsx` (line 71)
2. `apps/web/src/components/merchant/CourierSelector.tsx` (line 45)
3. `apps/web/src/services/courierService.ts` (line 23)

**Impact:** 3 files need updating
```

**3. Check for indirect dependencies:**
```bash
# Search for components that import affected files
grep -r "import.*CourierPreferences" apps/web/src/

# Search for services that might wrap the endpoint
grep -r "courierService" apps/web/src/
```

**4. Update ALL affected files TOGETHER:**
- ✅ Update all files in same commit
- ✅ Test each file after update
- ✅ Document changes in commit message

**5. Create migration guide if public API:**
```markdown
## API Migration Guide

**Old:** `GET /api/couriers/merchant-list`
**New:** `POST /api/couriers/merchant-preferences` with `action: 'get_selected_couriers'`

**Breaking Change:** Yes
**Affected:** All merchants using API
**Migration:** Update all API calls to new format
```

### **SEARCH CHECKLIST:**

**Before changing endpoint `/api/old-endpoint`:**
- [ ] Searched for `/api/old-endpoint` in all files
- [ ] Searched for `old-endpoint` (without /api/)
- [ ] Checked all `.tsx` and `.ts` files
- [ ] Checked all service files
- [ ] Checked all component files
- [ ] Documented all affected files
- [ ] Created update plan for all files
- [ ] Tested each file after update

### **COMMON LOCATIONS TO CHECK:**

**Frontend:**
- `apps/web/src/pages/` - Page components
- `apps/web/src/components/` - Reusable components
- `apps/web/src/services/` - API service wrappers
- `apps/web/src/hooks/` - Custom hooks
- `apps/web/src/utils/` - Utility functions

**Backend:**
- `apps/api/` - API endpoints
- `backend/src/routes/` - Express routes
- `backend/src/services/` - Business logic

**Documentation:**
- `docs/` - API documentation
- `README.md` - Setup guides
- `CHANGELOG.md` - Change history

### **TYPES OF API CHANGES:**

**1. Endpoint Rename:**
```bash
# OLD: /api/couriers/list
# NEW: /api/couriers/get-all

# Search for old endpoint
grep -r "/api/couriers/list" apps/
```

**2. Method Change:**
```bash
# OLD: GET /api/couriers
# NEW: POST /api/couriers

# Search for GET requests
grep -r "axios.get.*couriers" apps/
```

**3. Request/Response Format Change:**
```bash
# OLD: { couriers: [] }
# NEW: { data: { couriers: [] } }

# Search for response handling
grep -r "response.data.couriers" apps/
```

**4. Authentication Change:**
```bash
# OLD: No auth
# NEW: Bearer token required

# Search for calls without auth
grep -r "axios.get\|axios.post" apps/ | grep -v "Authorization"
```

### **CASE STUDY: October 31, 2025**

**Problem:** Changed API endpoints without checking dependencies

**What Happened:**
- Created new `/api/couriers/merchant-preferences` endpoint
- Forgot to check for old endpoint usage
- `CourierPreferences.tsx` still called old endpoints
- Users got 401 errors in production

**Impact:**
- ⏱️ 15 minutes to identify issue
- ⏱️ 20 minutes to fix and redeploy
- 😞 Poor user experience

**What Should Have Been Done:**
1. ✅ Search for `/api/couriers/merchant-list` BEFORE creating new endpoint
2. ✅ Find `CourierPreferences.tsx` uses it
3. ✅ Update component in SAME commit as new API
4. ✅ Deploy both together
5. ✅ No user impact

**Lesson Learned:**
> **"API changes are never isolated. Always search for dependencies first."**

### **ENFORCEMENT:**

**Before ANY API change:**
1. ⚠️ **STOP** - Do not proceed without impact analysis
2. 🔍 **SEARCH** - Find all files using the endpoint
3. 📝 **DOCUMENT** - List all affected files
4. 🔄 **UPDATE** - Change all files together
5. ✅ **TEST** - Verify each file works
6. 🚀 **DEPLOY** - Deploy all changes together

**Violation Consequences:**
- ❌ PR rejected
- ❌ Rollback required
- ❌ Time wasted debugging
- ❌ Poor user experience

---

## 🚀 RULE #31: MULTI-PROJECT VERCEL ARCHITECTURE (HARD)

**CORE PRINCIPLE:**
> **"Performile uses TWO separate Vercel projects. Never confuse them. Always know which project hosts which code."**

### **⚠️ CRITICAL: TWO VERCEL DEPLOYMENTS**

**This is NOT a mistake. This is the CORRECT architecture.**

### **PROJECT 1: MAIN PLATFORM** 🎯

**URL:** `https://frontend-two-swart-31.vercel.app`

**Contains:**
- React frontend (apps/web/)
- All API endpoints (api/)
- Database operations
- User authentication
- Order management
- Analytics
- Reviews & ratings
- All business logic

**Deployment:**
- Root `vercel.json` configuration
- Builds from `apps/web/`
- API functions in `api/`

**Purpose:** Main application and all APIs

---

### **PROJECT 2: SHOPIFY APP** 🛍️

**URL:** `https://performile-delivery-jm98ihmmx-rickard-wigrunds-projects.vercel.app`

**Contains:**
- Shopify OAuth authentication
- Shopify webhook handling
- Shopify App Bridge integration
- Checkout UI extension hosting

**Deployment:**
- `apps/shopify/performile-delivery/vercel.json`
- Minimal build (serverless functions only)
- No frontend build needed

**Purpose:** Shopify integration ONLY

---

### **HOW THEY WORK TOGETHER**

**Architecture Flow:**
```
Shopify Store
    ↓
Shopify Checkout
    ↓
Checkout UI Extension (hosted on Project 2)
    ↓
    ├─→ Fetches courier data from: Project 1 API
    │   https://frontend-two-swart-31.vercel.app/api/couriers/ratings-by-postal
    │
    └─→ Sends analytics to: Project 1 API
        https://frontend-two-swart-31.vercel.app/api/public/checkout-analytics-track
```

**Key Points:**
1. **Shopify App (Project 2)** handles OAuth and webhooks
2. **Checkout Extension** runs in Shopify checkout (sandboxed)
3. **Extension calls Main Platform API (Project 1)** for data
4. **All business logic** lives in Project 1

---

### **MANDATORY RULES**

#### **1. API Endpoints Always on Project 1** ✅

**CORRECT:**
```typescript
// Shopify checkout extension calling main platform
const apiBaseUrl = 'https://frontend-two-swart-31.vercel.app/api';
await fetch(`${apiBaseUrl}/couriers/ratings-by-postal`);
```

**WRONG:**
```typescript
// ❌ Don't call Shopify app for business logic
const apiBaseUrl = 'https://performile-delivery-jm98ihmmx...';
await fetch(`${apiBaseUrl}/couriers/ratings-by-postal`); // Won't work!
```

#### **2. Public Endpoints for Shopify Extensions** ✅

**Shopify checkout extensions:**
- Run in sandboxed iframes
- Cannot send JWT tokens
- Cannot access localStorage
- Cannot use authenticated endpoints

**Solution:** Create public endpoints for Shopify

**CORRECT:**
```typescript
// Public endpoint (no auth required)
export default async function handler(req, res) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false, // ✅ Public for Shopify
    rateLimit: 'default'
  });
  // ... validation happens in code
}
```

**WRONG:**
```typescript
// ❌ Requiring auth blocks Shopify extensions
export default async function handler(req, res) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true, // ❌ Shopify can't send JWT
    rateLimit: 'default'
  });
}
```

#### **3. CORS Must Allow Shopify Domains** ✅

**Main Platform API must allow:**
- `https://*.myshopify.com`
- `https://checkout.shopify.com`
- `https://*.shopifycdn.com`

**Already configured in:** `api/middleware/security.ts`

#### **4. Extension Settings Configuration** ✅

**Shopify extensions need configuration:**

```jsx
// In checkout extension
const apiBaseUrl = settings.api_url || 'https://frontend-two-swart-31.vercel.app/api';
const merchantId = settings.merchant_id;
```

**Must configure in Shopify Admin:**
- `api_url`: Main platform URL
- `merchant_id`: Merchant UUID from database

---

### **WHEN TO USE WHICH PROJECT**

#### **Use Project 1 (Main Platform) for:**
- ✅ All API endpoints
- ✅ Database queries
- ✅ Business logic
- ✅ User authentication (main app)
- ✅ Order processing
- ✅ Analytics
- ✅ Reviews & ratings
- ✅ Any feature for main app

#### **Use Project 2 (Shopify App) for:**
- ✅ Shopify OAuth only
- ✅ Shopify webhooks only
- ✅ Checkout extension hosting only
- ✅ Shopify App Bridge only

**NEVER use Project 2 for:**
- ❌ Business logic
- ❌ Database operations
- ❌ User authentication (main app)
- ❌ General API endpoints

---

### **DEPLOYMENT CHECKLIST**

**When deploying changes:**

#### **Changes to Main Platform (Project 1):**
```bash
# Commit and push to main branch
git add api/ apps/web/
git commit -m "feat: Add new API endpoint"
git push origin main

# Vercel auto-deploys to:
# https://frontend-two-swart-31.vercel.app
```

#### **Changes to Shopify App (Project 2):**
```bash
# Commit and push
git add apps/shopify/
git commit -m "fix: Update Shopify extension"
git push origin main

# Then redeploy Shopify app
cd apps/shopify/performile-delivery
npm run shopify app deploy

# Vercel auto-deploys to:
# https://performile-delivery-jm98ihmmx...
```

---

### **COMMON MISTAKES TO AVOID**

#### **❌ Mistake #1: Wrong API URL**
```jsx
// ❌ WRONG - Calling Shopify app for business logic
const apiUrl = 'https://performile-delivery-jm98ihmmx...';
await fetch(`${apiUrl}/api/couriers`); // Won't work!

// ✅ CORRECT - Call main platform
const apiUrl = 'https://frontend-two-swart-31.vercel.app/api';
await fetch(`${apiUrl}/couriers/ratings-by-postal`); // Works!
```

#### **❌ Mistake #2: Requiring Auth for Shopify**
```typescript
// ❌ WRONG - Shopify extensions can't authenticate
export default async function handler(req, res) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true // ❌ Blocks Shopify
  });
}

// ✅ CORRECT - Public endpoint with validation
export default async function handler(req, res) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false // ✅ Allows Shopify
  });
  
  // Validate in code instead
  if (!req.body.merchantId || !req.body.courierId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
}
```

#### **❌ Mistake #3: Forgetting Extension Settings**
```jsx
// ❌ WRONG - Hardcoded URL
const apiUrl = 'https://frontend-two-swart-31.vercel.app/api';

// ✅ CORRECT - Configurable via Shopify Admin
const apiUrl = settings.api_url || 'https://frontend-two-swart-31.vercel.app/api';
const merchantId = settings.merchant_id; // From Shopify Admin
```

---

### **CASE STUDY: November 1, 2025**

**Problem:** Shopify checkout extension getting 401 errors

**Investigation:**
1. Extension was calling `/api/courier/checkout-analytics/track`
2. Endpoint required JWT authentication
3. Shopify checkout extensions run in sandboxed iframe
4. Cannot send JWT tokens

**Root Cause:**
- Wrong endpoint (required auth)
- Didn't understand two-project architecture
- Didn't know Shopify extensions can't authenticate

**Solution:**
1. ✅ Created public endpoint: `/api/public/checkout-analytics-track`
2. ✅ No auth required (validation in code)
3. ✅ Updated extension to use public endpoint
4. ✅ Documented two-project architecture

**Time Saved by This Rule:**
- Future developers won't make same mistake
- Clear architecture documentation
- Explicit guidelines for Shopify integration

---

### **DOCUMENTATION REFERENCES**

**Architecture Docs:**
- `docs/2025-11-01/SHOPIFY_TWO_VERCEL_PROJECTS.md` - Full architecture explanation
- `docs/2025-11-01/SHOPIFY_COMPLETE_FIX_SUMMARY.md` - Deployment guide

**Code Examples:**
- `api/public/checkout-analytics-track.ts` - Public endpoint example
- `apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx` - Extension calling main platform

---

### **ENFORCEMENT**

**Before ANY Shopify integration work:**
1. ⚠️ **STOP** - Review this rule
2. 📖 **READ** - `SHOPIFY_TWO_VERCEL_PROJECTS.md`
3. 🎯 **DECIDE** - Which project should host this code?
4. ✅ **VERIFY** - Is API URL correct?
5. 🔒 **CHECK** - Does Shopify need public endpoint?

**Violation Consequences:**
- ❌ 401/404 errors in production
- ❌ Shopify integration broken
- ❌ Time wasted debugging
- ❌ Poor merchant experience

---

---

## 🎯 RULE #32: INVESTOR DOCUMENT VERSIONING (HARD)

**MANDATORY:** All investor documents must follow strict versioning and be stored in dedicated investor folder.

### **INVESTOR FOLDER STRUCTURE**

**Location:** `docs/investors/` (NOT date-named)

**Required Files:**
```
docs/investors/
├── INVESTOR_MASTER_V[MAJOR].[MINOR].md  # Master investor document
├── EXECUTIVE_SUMMARY.md                 # 2-page overview
├── CODE_AUDIT.md                        # Technical deep-dive
├── FINANCIAL_MODEL.xlsx                 # Detailed projections
├── PITCH_DECK.pdf                       # Investor presentation
└── versions/                            # Historical versions
    ├── INVESTOR_MASTER_V1.0.md
    ├── INVESTOR_MASTER_V1.1.md
    └── ...
```

### **VERSIONING RULES**

**Format:** `INVESTOR_MASTER_V[MAJOR].[MINOR].md`

**Version Increments:**
- **MAJOR (X.0):** Significant business model changes, major pivots, new funding rounds
- **MINOR (X.Y):** Platform updates, financial projection updates, metric updates

**Examples:**
- `INVESTOR_MASTER_V1.0.md` - Initial investor document
- `INVESTOR_MASTER_V1.1.md` - Updated with Q1 metrics
- `INVESTOR_MASTER_V2.0.md` - Series A fundraising round

### **REQUIRED METADATA**

Every investor master document MUST include:

```markdown
**Document Version:** V1.0
**Platform Version:** 3.3
**Last Updated:** November 1, 2025
**Status:** Active
**Previous Version:** N/A (or V1.0)
```

### **REQUIRED SECTIONS**

1. **Executive Summary** - The opportunity, market, investment ask
2. **Business Model** - Revenue streams, unit economics
3. **Financial Projections** - 5-year projections, ROI
4. **Technical Architecture** - Platform overview, tech stack
5. **Competitive Advantages** - Unique value propositions
6. **Launch Timeline** - Go-to-market plan
7. **Success Metrics** - KPIs and milestones
8. **Team** - Founders, advisors, future hires
9. **Go-to-Market Strategy** - Customer acquisition plan
10. **Use of Funds** - Investment breakdown
11. **Growth Strategy** - Short, medium, long-term plans
12. **Exit Strategy** - Potential exit options
13. **Risks & Mitigation** - Key risks and how to address them
14. **Contact Information** - How to reach team
15. **Supporting Documents** - Links to other investor materials

### **UPDATE PROCESS**

**When to Create New Version:**

**MAJOR Version (X.0):**
- Changing business model
- New funding round
- Major pivot
- Significant market shift
- New product line

**MINOR Version (X.Y):**
- Updated financial projections
- New platform metrics
- Updated team information
- Revised timeline
- New success metrics

**Process:**
1. Copy current version to `versions/` folder
2. Create new version with incremented number
3. Update all metadata
4. Document what changed in changelog section
5. Update supporting documents if needed
6. Commit with clear message

### **CHANGELOG REQUIREMENT**

Every new version MUST include a changelog:

```markdown
## 📝 CHANGELOG

### What Changed Since V1.0
- Updated financial projections with Q1 actuals
- Added new success metrics
- Updated team section with new hires
- Revised timeline based on beta feedback
```

### **EXCEPTION TO DATE-NAMING RULE**

**CRITICAL:** Investor documents are the ONLY exception to the date-naming rule.

**Why:**
- Investors need stable URLs
- Version numbers are more meaningful than dates
- Documents are living documents, not historical records
- Easy to reference specific versions

**All other documentation MUST still follow date-naming convention.**

### **SUPPORTING DOCUMENTS**

**Also in `docs/investors/`:**
- `EXECUTIVE_SUMMARY.md` - Always keep current (no versioning)
- `CODE_AUDIT.md` - Update with each platform release
- `FINANCIAL_MODEL.xlsx` - Update monthly
- `PITCH_DECK.pdf` - Update for each pitch

**These files don't need versioning but should always reflect current state.**

### **ENFORCEMENT**

**Before ANY investor document update:**
1. ✅ Determine if MAJOR or MINOR version change
2. ✅ Copy current version to `versions/` folder
3. ✅ Create new version file with incremented number
4. ✅ Update all metadata
5. ✅ Add changelog section
6. ✅ Update supporting documents
7. ✅ Commit with clear message

**Commit Message Format:**
```
docs(investors): Update investor master to V1.1

CHANGES:
- Updated financial projections with Q1 actuals
- Added new success metrics (50 merchants, $5k MRR)
- Updated platform completion to 94%
- Revised launch timeline

VERSION: V1.0 → V1.1
TYPE: Minor update
```

### **CASE STUDY**

**November 1, 2025 - Initial Investor Package:**
- Created `docs/investors/` folder
- Created `INVESTOR_MASTER_V1.0.md`
- Moved existing investor docs from `docs/current/investor-package/`
- Established versioning system
- Documented all requirements

**Benefits:**
- Clear version history for investors
- Easy to track changes over time
- Professional appearance
- Stable URLs for sharing
- Exception to date-naming rule documented

---

**STATUS:** ✅ FRAMEWORK ACTIVE v1.29
**LAST UPDATED:** November 1, 2025, 11:50 PM
**RULES:** 32 (26 Hard, 4 Medium, 2 Soft)
**MAJOR UPDATES:** 
- Enhanced RULE #1 with duplicate detection
- Strengthened RULE #2 with explicit approval process
- Clarified RULE #5 with current production template
- Reinforced RULE #6 as mandatory process
- Added enforcement section
- Added RULE #29 - Launch Plan Adherence (5-week MVP launch tracker)
- Added RULE #30 - API Endpoint Impact Analysis (prevent breaking changes)
- Added RULE #31 - Multi-Project Vercel Architecture (Shopify integration guidelines)
- **NEW: RULE #32 - Investor Document Versioning (dedicated folder, version control)**
**NEXT REVIEW:** After MVP Launch (Dec 9, 2025)
**NEXT VERSION:** v1.30
