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

-- Step 3: Check indexes
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('table1', 'table2', 'table3');

-- Step 4: Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('table1', 'table2', 'table3');

-- Step 5: Sample data check
SELECT COUNT(*) FROM table1;
```

**DELIVERABLE:** Validation report documenting actual schema

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

**IF DATABASE NEEDS CHANGE:**
1. Document why it's needed
2. Get explicit user approval
3. Create rollback script first
4. Test on copy database
5. Only then apply to production

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
- ✅ Use connection pooling (getPool())
- ✅ Always release connections
- ✅ Use try/finally blocks
- ✅ JWT authentication inline
- ✅ Environment variables for secrets
- ✅ TypeScript for type safety

**TEMPLATE:**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = await pool.connect();
  try {
    // Your code here
  } finally {
    client.release();
  }
}
```

### **RULE #6: SPEC-DRIVEN IMPLEMENTATION**

**BEFORE STARTING ANY FEATURE:**

1. **Create Feature Spec** (Markdown)
   - User stories
   - Database requirements (validation first!)
   - API endpoints
   - Frontend components
   - Success criteria

2. **Validate Database**
   - Run validation SQL
   - Document actual schema
   - Update spec with findings

3. **Get Approval**
   - Review spec with user
   - Confirm approach
   - Get go-ahead

4. **Implement**
   - Follow spec exactly
   - Use validated schema
   - Test incrementally

5. **Verify**
   - Run verification SQL
   - Test all endpoints
   - Update documentation

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

**STATUS:** ✅ FRAMEWORK ACTIVE
**LAST UPDATED:** October 17, 2025
**NEXT REVIEW:** Before Week 3
