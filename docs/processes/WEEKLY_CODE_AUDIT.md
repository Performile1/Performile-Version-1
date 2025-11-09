# 🔍 WEEKLY CODE AUDIT - HARD RULE

**Frequency:** Every Friday (End of Week)  
**Status:** MANDATORY  
**Priority:** CRITICAL

---

## 🚨 HARD RULE #33: WEEKLY CODE AUDIT

**MANDATORY:** Every Friday, perform a comprehensive code audit to prevent:
- ❌ Duplicate files
- ❌ Duplicate functions
- ❌ Duplicate components
- ❌ Duplicate API endpoints
- ❌ Duplicate database tables/columns
- ❌ Unused code
- ❌ Inconsistent patterns

**NO EXCEPTIONS. NO SHORTCUTS.**

---

## 📋 AUDIT CHECKLIST

### **1. DUPLICATE FILES CHECK**

**Search for similar filenames:**
```bash
# Find duplicate component names
find apps/web/src -name "*.tsx" | sort | uniq -d

# Find duplicate API endpoints
find api -name "*.ts" | sort | uniq -d

# Find duplicate database migrations
find database/migrations -name "*.sql" | sort | uniq -d
```

**Common Duplicates to Check:**
- [ ] Dashboard.tsx vs DashboardScreen.tsx
- [ ] Orders.tsx vs OrdersScreen.tsx
- [ ] create-payment.ts vs createPayment.ts
- [ ] Similar migration files

**Action:** Consolidate or clearly differentiate

---

### **2. DUPLICATE FUNCTIONS CHECK**

**Search for similar function names:**
```bash
# Search for duplicate function definitions
grep -r "function fetchOrders" apps/
grep -r "const fetchOrders" apps/
grep -r "async function createPayment" api/
```

**Common Duplicates:**
- [ ] fetchOrders() in multiple files
- [ ] createPayment() in different services
- [ ] validateUser() scattered across files
- [ ] calculatePrice() duplicated

**Action:** Extract to shared utilities

---

### **3. DUPLICATE COMPONENTS CHECK**

**Search for similar components:**
```bash
# Find similar React components
grep -r "export default.*Button" apps/web/src/components/
grep -r "export default.*Card" apps/web/src/components/
grep -r "export default.*Modal" apps/web/src/components/
```

**Common Duplicates:**
- [ ] Button components with different names
- [ ] Card components (OrderCard, ShipmentCard, etc.)
- [ ] Modal/Dialog components
- [ ] Form components

**Action:** Create shared component library

---

### **4. DUPLICATE API ENDPOINTS CHECK**

**Check for duplicate routes:**
```bash
# List all API endpoints
find api -name "*.ts" -exec grep -l "export default" {} \;

# Check for similar endpoint names
ls api/**/*.ts | sort
```

**Common Duplicates:**
- [ ] /api/orders vs /api/consumer/orders
- [ ] /api/payments vs /api/stripe/payments
- [ ] /api/tracking vs /api/shipments/tracking

**Action:** Consolidate or document differences

---

### **5. DUPLICATE DATABASE OBJECTS CHECK**

**Check for duplicate tables/columns:**
```sql
-- Find tables with similar names
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name LIKE '%payment%'
ORDER BY table_name;

-- Find duplicate columns across tables
SELECT table_name, column_name, COUNT(*) as count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name, column_name
HAVING COUNT(*) > 1;

-- Find similar column names
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%user_id%'
ORDER BY column_name, table_name;
```

**Common Duplicates:**
- [ ] payment_id in multiple tables
- [ ] user_id vs customer_id
- [ ] created_at vs creation_date
- [ ] Similar tables (orders vs shipments)

**Action:** Ensure consistency, document differences

---

### **6. UNUSED CODE CHECK**

**Find unused files:**
```bash
# Find files not imported anywhere
npx depcheck

# Find unused exports
npx ts-prune

# Find dead code
npx unimported
```

**Common Unused Code:**
- [ ] Old component versions
- [ ] Deprecated API endpoints
- [ ] Unused utility functions
- [ ] Test files for deleted features

**Action:** Delete or document why kept

---

### **7. INCONSISTENT PATTERNS CHECK**

**Check for inconsistencies:**
```bash
# Different import styles
grep -r "import React from" apps/
grep -r "import \* as React" apps/

# Different export styles
grep -r "export default function" apps/
grep -r "export const.*= ()" apps/

# Different naming conventions
grep -r "const.*_.*=" apps/  # snake_case
grep -r "const.*[A-Z].*=" apps/  # camelCase
```

**Common Inconsistencies:**
- [ ] Import styles (default vs named)
- [ ] Export styles (default vs named)
- [ ] Naming conventions (camelCase vs snake_case)
- [ ] File naming (PascalCase vs kebab-case)

**Action:** Standardize across codebase

---

## 🔧 AUTOMATED AUDIT TOOLS

### **1. ESLint Configuration**

```json
// .eslintrc.json
{
  "rules": {
    "no-duplicate-imports": "error",
    "no-unused-vars": "error",
    "import/no-duplicates": "error"
  }
}
```

### **2. Custom Audit Script**

```bash
#!/bin/bash
# scripts/weekly-audit.sh

echo "🔍 Running Weekly Code Audit..."

# 1. Find duplicate files
echo "\n1. Checking for duplicate files..."
find apps -type f -name "*.tsx" -o -name "*.ts" | sort | uniq -d

# 2. Find unused exports
echo "\n2. Checking for unused exports..."
npx ts-prune

# 3. Find duplicate functions
echo "\n3. Checking for duplicate functions..."
grep -r "export.*function" apps/ api/ | sort | uniq -d

# 4. Check database duplicates
echo "\n4. Checking database duplicates..."
psql $DATABASE_URL -f scripts/check-db-duplicates.sql

echo "\n✅ Audit complete!"
```

---

## 📊 AUDIT REPORT TEMPLATE

### **Weekly Code Audit Report**

**Date:** [Friday Date]  
**Week:** [Week Number]  
**Auditor:** [Name]

---

**1. Duplicate Files Found:**
- [ ] None
- [ ] List duplicates and action taken

**2. Duplicate Functions Found:**
- [ ] None
- [ ] List duplicates and action taken

**3. Duplicate Components Found:**
- [ ] None
- [ ] List duplicates and action taken

**4. Duplicate API Endpoints Found:**
- [ ] None
- [ ] List duplicates and action taken

**5. Duplicate Database Objects Found:**
- [ ] None
- [ ] List duplicates and action taken

**6. Unused Code Found:**
- [ ] None
- [ ] List unused code and action taken

**7. Inconsistent Patterns Found:**
- [ ] None
- [ ] List inconsistencies and action taken

---

**Summary:**
- Files reviewed: [number]
- Issues found: [number]
- Issues resolved: [number]
- Issues deferred: [number]

**Actions Taken:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Next Week Focus:**
- [Area to focus on]

---

## 🎯 SPECIFIC CHECKS FOR PERFORMILE

### **Payment Infrastructure:**
```bash
# Check for duplicate payment files
find api -name "*payment*" -o -name "*stripe*" -o -name "*vipps*" -o -name "*swish*"

# Should find:
# - api/stripe/create-checkout-session.ts (subscriptions)
# - api/stripe/create-c2c-payment.ts (C2C)
# - api/vipps/create-payment.ts (Norway C2C)
# - api/swish/create-payment.ts (Sweden C2C)
# - api/c2c/get-payment-methods.ts (selector)

# No duplicates allowed!
```

### **Consumer App:**
```bash
# Check for duplicate consumer screens
find apps/web/src/pages/consumer -name "*.tsx"
find apps/mobile/src/screens/consumer -name "*.tsx"

# Should be:
# Web: Dashboard.tsx, Orders.tsx, C2CCreate.tsx
# Mobile: DashboardScreen.tsx, OrdersScreen.tsx, TrackingScreen.tsx

# Clear naming convention!
```

### **Database Tables:**
```sql
-- Check for duplicate payment tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name LIKE '%payment%'
ORDER BY table_name;

-- Should find:
-- - stripe_c2c_payments (Stripe C2C)
-- - vipps_payments (Vipps C2C)
-- - swish_payments (Swish C2C)
-- - subscriptions (Stripe subscriptions)

-- Each has clear purpose!
```

---

## 🚨 RED FLAGS

**Immediate Action Required If:**
- ❌ Same function name in 3+ files
- ❌ Same component name in 2+ places
- ❌ Same API endpoint in 2+ locations
- ❌ Same table/column name with different purposes
- ❌ >10% unused code
- ❌ >5 inconsistent patterns

**Escalate to:** Lead Developer / Architect

---

## 📅 AUDIT SCHEDULE

### **Weekly (Every Friday):**
- Full code audit
- Generate report
- Fix critical issues
- Plan improvements

### **Monthly (Last Friday):**
- Deep audit
- Refactoring session
- Architecture review
- Documentation update

### **Quarterly:**
- Complete codebase review
- Performance audit
- Security audit
- Technical debt assessment

---

## 🛠️ REMEDIATION PROCESS

### **For Duplicate Files:**
1. Identify which is canonical
2. Merge functionality
3. Update imports
4. Delete duplicate
5. Test thoroughly

### **For Duplicate Functions:**
1. Extract to shared utility
2. Update all references
3. Add JSDoc comments
4. Add unit tests
5. Delete duplicates

### **For Duplicate Components:**
1. Create shared component
2. Add props for variations
3. Update all usages
4. Delete duplicates
5. Update Storybook

### **For Duplicate API Endpoints:**
1. Consolidate logic
2. Update routes
3. Update frontend calls
4. Deprecate old endpoint
5. Remove after grace period

---

## 📈 SUCCESS METRICS

**Target Goals:**
- Zero duplicate files
- <5 duplicate functions
- <3 duplicate components
- Zero duplicate API endpoints
- <2% unused code
- 100% consistent patterns

**Track Weekly:**
- Number of duplicates found
- Number of duplicates resolved
- Time spent on audit
- Code quality score

---

## 🎓 LEARNING FROM DUPLICATES

**Why Duplicates Happen:**
1. Lack of awareness of existing code
2. Tight deadlines
3. Poor documentation
4. Unclear naming conventions
5. Missing code review

**Prevention:**
1. Better documentation
2. Code review checklist
3. Shared component library
4. Clear naming conventions
5. Regular audits

---

## ✅ TODAY'S AUDIT (November 9, 2025)

### **Findings:**

**Duplicate Files:**
- [ ] Check web vs mobile consumer screens
- [ ] Check payment API endpoints
- [ ] Check database migration files

**Duplicate Functions:**
- [ ] Check fetchOrders implementations
- [ ] Check payment creation logic
- [ ] Check validation functions

**Duplicate Components:**
- [ ] Check Dashboard components
- [ ] Check Order components
- [ ] Check Payment components

**Action Items:**
1. Review all consumer screens (web vs mobile)
2. Consolidate payment logic
3. Create shared utilities
4. Update documentation

---

## 🔐 INTEGRATION WITH SPEC-DRIVEN FRAMEWORK

**This is now RULE #33 in the Spec-Driven Framework:**

**RULE #33: WEEKLY CODE AUDIT**
- Every Friday, perform comprehensive audit
- Check for duplicates (files, functions, components, APIs, DB)
- Check for unused code
- Check for inconsistent patterns
- Generate audit report
- Fix critical issues immediately
- Plan improvements for next week

**NO EXCEPTIONS.**

---

**STATUS:** 🔴 MANDATORY  
**FREQUENCY:** Every Friday  
**NEXT AUDIT:** November 15, 2025  
**RESPONSIBLE:** Development Team

---

**Last Updated:** November 9, 2025, 3:25 PM
