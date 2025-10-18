# 🎯 Spec-Driven Framework Update - October 18, 2025

## New Rules Added (15-18)

**Framework Version:** v1.18 (18 Hard Rules)  
**Previous Version:** v1.17 (14 Hard Rules)  
**Date:** October 18, 2025

---

## 📋 NEW HARD RULES

### **RULE #15: AUDIT EXISTING FILES BEFORE CHANGES**

**Purpose:** Prevent accidental overwrites and conflicts

**Before modifying ANY file:**
1. ✅ Check if file exists
2. ✅ Read and analyze existing file
3. ✅ Document current state
4. ✅ Check for conflicts
5. ✅ Plan changes carefully

**Key Commands:**
```bash
# Find file
find . -name "filename.ts"

# Read file
cat path/to/file.ts

# Check imports/exports
grep "^import\|^export" path/to/file.ts
```

**Never:**
- ❌ Assume file doesn't exist
- ❌ Overwrite without reading
- ❌ Delete existing functionality
- ❌ Change function signatures without checking usage

**Always:**
- ✅ Read file first
- ✅ Understand existing code
- ✅ Document changes
- ✅ Test after changes

---

### **RULE #16: CHECK FOR EXISTING API CALLS**

**Purpose:** Prevent duplicate API endpoints and promote reuse

**Before creating new API endpoint:**
1. ✅ Search for existing endpoints
2. ✅ Check existing API services
3. ✅ Document similar endpoints
4. ✅ Decide: reuse, extend, or create new

**Key Commands:**
```bash
# Search for endpoints
grep -r "export.*handler\|export default" api/

# Search for routes
grep -r "/api/endpoint-name" .

# Check API services
grep -r "axios\|fetch" apps/web/src/services/
```

**Reuse Checklist:**
- [ ] Does existing endpoint do what we need?
- [ ] Can we extend it with query params?
- [ ] Can we add optional fields?
- [ ] Would modification break existing usage?

**Create new ONLY if:**
- ✅ No similar endpoint exists
- ✅ Existing endpoint can't be extended
- ✅ Modification would break existing usage
- ✅ Different authentication/authorization needed

**Examples:**
```typescript
// ❌ BAD - Creating duplicate
POST /api/orders/create  // Already have POST /api/orders

// ✅ GOOD - Reusing existing
POST /api/orders  // Use existing endpoint

// ❌ BAD - Creating when can extend
GET /api/orders/merchant  // Can use GET /api/orders?role=merchant

// ✅ GOOD - Extending existing
GET /api/orders?role=merchant&status=pending
```

---

### **RULE #17: CHECK EXISTING TABLES BEFORE CREATING NEW**

**Purpose:** Prevent duplicate tables and promote database reuse

**Before creating new table:**
1. ✅ Search for similar tables
2. ✅ Analyze existing tables
3. ✅ Consider reuse strategies
4. ✅ Justify new table creation

**Key Commands:**
```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Search for similar tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%keyword%';

-- Check table columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_name IN ('table1', 'table2')
ORDER BY table_name, ordinal_position;
```

**Reuse Strategies:**

1. **Use existing table as-is**
   ```sql
   SELECT * FROM existing_table WHERE condition;
   ```

2. **Add columns to existing table**
   ```sql
   ALTER TABLE existing_table 
   ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
   ```

3. **Use JSONB for flexibility**
   ```sql
   UPDATE existing_table 
   SET metadata = metadata || '{"new_field": "value"}'::jsonb
   WHERE id = 123;
   ```

4. **Create view**
   ```sql
   CREATE VIEW new_view AS
   SELECT col1, col2, col3 
   FROM existing_table
   WHERE condition;
   ```

**Create new table ONLY if:**
- ✅ No similar table exists
- ✅ Data structure is fundamentally different
- ✅ Extending existing table would cause conflicts
- ✅ Different access patterns/RLS needed
- ✅ High volume data needs separation

**Prefixing Strategy:**
- Use feature prefix: `week3_`, `analytics_`, `integration_`
- Prevents conflicts with existing tables
- Clear ownership and purpose
- Easy to identify and manage

**Examples:**
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

---

### **RULE #18: CONFLICT DETECTION CHECKLIST**

**Purpose:** Catch conflicts before they cause problems

**Before ANY implementation, check for:**

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
- Check for circular dependencies
- Check for duplicate imports
- Check for conflicting versions

**Conflict Resolution:**

If conflict found:
1. ✅ Document the conflict
2. ✅ Analyze which is correct
3. ✅ Choose resolution strategy:
   - Reuse existing (preferred)
   - Rename new (if both needed)
   - Merge functionality
   - Deprecate old (with migration)
4. ✅ Update all references
5. ✅ Test thoroughly

**Never:**
- ❌ Silently overwrite
- ❌ Create duplicates
- ❌ Ignore conflicts
- ❌ Assume no conflicts

---

## 📊 FRAMEWORK EVOLUTION

### **Version History:**

| Version | Date | Rules | Key Changes |
|---------|------|-------|-------------|
| v1.0 | Early Oct | 10 | Initial framework |
| v1.16 | Oct 16 | 13 | Added subscription limits |
| v1.17 | Oct 17 | 14 | Added package.json validation |
| **v1.18** | **Oct 18** | **18** | **Added audit & conflict detection** |

### **Why These Rules Were Added:**

**Problem:** During Week 3 development, we encountered:
- Risk of overwriting existing files
- Potential duplicate API endpoints
- Confusion about table reuse vs creation
- Need for systematic conflict detection

**Solution:** Rules 15-18 provide:
- Systematic file auditing process
- API endpoint reuse guidelines
- Table reuse strategies
- Comprehensive conflict detection

**Impact:**
- ✅ Prevents accidental overwrites
- ✅ Promotes code reuse
- ✅ Reduces database bloat
- ✅ Catches conflicts early
- ✅ Improves code quality

---

## 🎯 PRACTICAL APPLICATION

### **Example: Adding New Feature**

**Old Way (Without Rules 15-18):**
```typescript
// ❌ Just create new file
// ❌ Create new API endpoint
// ❌ Create new table
// ❌ Hope for no conflicts
```

**New Way (With Rules 15-18):**

**Step 1: Audit (Rule 15)**
```bash
# Check if component exists
find . -name "FeatureComponent.tsx"

# Read existing similar components
cat apps/web/src/components/similar/Component.tsx
```

**Step 2: Check APIs (Rule 16)**
```bash
# Search for similar endpoints
grep -r "/api/feature" .

# Check if can reuse
grep -r "GET /api/features" api/
```

**Step 3: Check Tables (Rule 17)**
```sql
-- Search for similar tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%feature%';

-- Check if can extend existing
SELECT column_name FROM information_schema.columns
WHERE table_name = 'existing_table';
```

**Step 4: Detect Conflicts (Rule 18)**
```bash
# Check all potential conflicts
grep -r "FeatureComponent" .
grep -r "/api/feature" .
# ... etc
```

**Step 5: Document Decision**
```markdown
## Feature Implementation Decision

### Existing Resources Found:
- Similar component: SimilarComponent.tsx
- Similar API: GET /api/similar-features
- Similar table: existing_features

### Decision:
- [ ] Reuse SimilarComponent (extend it)
- [x] Create new API (different auth needed)
- [ ] Use existing_features table (add columns)

### Justification:
- Component can be extended with new props
- API needs different permissions
- Table has JSONB for flexibility
```

---

## ✅ COMPLIANCE CHECKLIST

**Before ANY implementation:**

- [ ] **Rule 15:** Audited existing files
- [ ] **Rule 16:** Checked for existing API calls
- [ ] **Rule 17:** Checked for existing tables
- [ ] **Rule 18:** Ran conflict detection

**Documentation Required:**
- [ ] File audit report (if modifying)
- [ ] API reuse analysis (if creating endpoint)
- [ ] Table reuse analysis (if creating table)
- [ ] Conflict detection results

**Approval Required:**
- [ ] User approval for new tables
- [ ] User approval for new API endpoints
- [ ] User approval for file modifications

---

## 📈 EXPECTED BENEFITS

### **Short Term (Immediate):**
- ✅ Fewer conflicts
- ✅ Less duplicate code
- ✅ Better code reuse
- ✅ Faster development (less rework)

### **Medium Term (This Week):**
- ✅ Cleaner codebase
- ✅ Smaller database
- ✅ Better API organization
- ✅ Easier maintenance

### **Long Term (Future Sprints):**
- ✅ Sustainable development
- ✅ Easier onboarding
- ✅ Better documentation
- ✅ Higher code quality

---

## 🎓 TRAINING EXAMPLES

### **Example 1: Courier Logo Component**

**Following Rules 15-18:**

1. **Rule 15 - Audit:**
   ```bash
   # Check if component exists
   find . -name "*Logo*"
   # Found: No existing CourierLogo component ✅
   ```

2. **Rule 16 - Check APIs:**
   ```bash
   # Check for logo API
   grep -r "/api/courier.*logo" .
   # Found: No logo API needed (static files) ✅
   ```

3. **Rule 17 - Check Tables:**
   ```sql
   -- Check couriers table
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'couriers';
   -- Found: logo_url column exists ✅
   ```

4. **Rule 18 - Conflicts:**
   ```bash
   # Check for conflicts
   grep -r "CourierLogo" .
   # Found: No conflicts ✅
   ```

**Result:** Safe to create new component ✅

---

### **Example 2: Integration Settings Page**

**Following Rules 15-18:**

1. **Rule 15 - Audit:**
   ```bash
   # Check if settings page exists
   find . -name "*IntegrationSettings*"
   # Found: None ✅
   ```

2. **Rule 16 - Check APIs:**
   ```bash
   # Check for integration APIs
   grep -r "/api/.*integration" api/
   # Found: /api/week3-integrations/* endpoints exist ✅
   # Decision: Reuse existing endpoints
   ```

3. **Rule 17 - Check Tables:**
   ```sql
   -- Check for integration tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE '%integration%';
   -- Found: week3_webhooks, week3_api_keys, etc. ✅
   -- Decision: Use existing tables
   ```

4. **Rule 18 - Conflicts:**
   ```bash
   # Check for route conflicts
   grep -r "/settings/integrations" .
   # Found: No conflicts ✅
   ```

**Result:** Create new component using existing APIs and tables ✅

---

## 📝 SUMMARY

### **New Rules (15-18):**
- **Rule 15:** Audit existing files before changes
- **Rule 16:** Check for existing API calls
- **Rule 17:** Check existing tables before creating new
- **Rule 18:** Conflict detection checklist

### **Key Principles:**
1. **Audit First** - Always check what exists
2. **Reuse When Possible** - Don't duplicate
3. **Justify New** - Document why creating new
4. **Detect Conflicts** - Catch problems early

### **Impact:**
- ✅ Better code quality
- ✅ Less duplication
- ✅ Fewer conflicts
- ✅ Faster development

---

**Framework Version:** v1.18  
**Total Rules:** 18 Hard Rules  
**Status:** Active  
**Next Review:** After Week 3 completion

---

*Spec-Driven Development Framework*  
*Performile Platform*  
*October 18, 2025*
