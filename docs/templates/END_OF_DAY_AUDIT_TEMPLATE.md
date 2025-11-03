# END OF DAY AUDIT - [DATE]

**Date:** [YYYY-MM-DD]  
**Day:** [Week X, Day Y]  
**Time:** [HH:MM PM]  
**Auditor:** [Name]

---

## 📊 DATABASE AUDIT

### **Tables Added Today:**
- [ ] Table 1: `table_name` (X columns, Y indexes, Z policies)
- [ ] Table 2: `table_name` (X columns, Y indexes, Z policies)

### **Functions Added Today:**
- [ ] Function 1: `function_name()` - Purpose
- [ ] Function 2: `function_name()` - Purpose

### **Views Added Today:**
- [ ] View 1: `view_name` - Purpose

### **Total Database Objects:**
```sql
-- Run this query
SELECT 
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'Functions',
  COUNT(DISTINCT routine_name)
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 
  'Views',
  COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public';
```

**Results:**
- Tables: [X]
- Functions: [Y]
- Views: [Z]

---

## 🔍 DUPLICATE CHECK

### **Tables Checked:**
```sql
-- Check for duplicates in today's domain
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%[domain]%'
ORDER BY table_name;
```

**Results:**
- [ ] No duplicates found
- [ ] Duplicates found: [list them]

### **Columns Checked:**
```sql
-- Check for duplicate columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name LIKE '%[key_column]%'
ORDER BY table_name, column_name;
```

**Results:**
- [ ] No duplicate columns
- [ ] Duplicate columns: [list them]

---

## 📈 RECORD COUNTS

### **Key Tables:**
```sql
-- Count records in important tables
SELECT 
  'orders' as table_name,
  COUNT(*) as records
FROM orders
UNION ALL
SELECT 'couriers', COUNT(*) FROM couriers
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT '[new_table]', COUNT(*) FROM [new_table];
```

**Results:**
- orders: [X] records
- couriers: [Y] records
- reviews: [Z] records
- [new_table]: [N] records

---

## 🔐 RLS VERIFICATION

### **Tables with RLS:**
```sql
SELECT 
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
```

**Results:**
- Total tables with RLS: [X]
- Tables added today with RLS: [Y]
- [ ] All new tables have RLS enabled

---

## 📝 CODE AUDIT

### **APIs Added Today:**
- [ ] `api/[endpoint].ts` ([X] lines) - Purpose
- [ ] `api/[endpoint].ts` ([Y] lines) - Purpose

### **Components Added Today:**
- [ ] `components/[name].tsx` ([X] lines) - Purpose
- [ ] `components/[name].tsx` ([Y] lines) - Purpose

### **Code Reused:**
- [ ] Reused: `[existing_file]` - How it was reused
- [ ] Reused: `[existing_service]` - How it was reused

### **Total Lines of Code:**
- New code written: [X] lines
- Code reused: [Y] lines
- Documentation: [Z] lines
- **Total:** [X+Y+Z] lines

---

## 📋 COMPLIANCE CHECK

### **SPEC_DRIVEN_FRAMEWORK:**
- [ ] Rule #1: Database validated before coding
- [ ] Rule #2: No existing database changes
- [ ] Rule #3: Conformed to existing schema
- [ ] Rule #23: Checked for duplicates
- [ ] Rule #24: Reused existing code
- [ ] Rule #25: Documented everything

**Compliance Score:** [X/6] = [%]

---

## 🎯 TODAY'S ACCOMPLISHMENTS

### **Features Completed:**
1. [Feature 1] - Status: ✅ Complete
2. [Feature 2] - Status: ✅ Complete
3. [Feature 3] - Status: ⏳ In Progress

### **Bugs Fixed:**
1. [Bug 1] - Fixed: [description]
2. [Bug 2] - Fixed: [description]

### **Documentation Created:**
1. [Doc 1] - [X] lines
2. [Doc 2] - [Y] lines

---

## 🚨 ISSUES FOUND

### **Blocking Issues:**
- [ ] Issue 1: [description] - Impact: [high/medium/low]
- [ ] Issue 2: [description] - Impact: [high/medium/low]

### **Non-Blocking Issues:**
- [ ] Issue 1: [description] - Can defer to: [date]
- [ ] Issue 2: [description] - Can defer to: [date]

---

## 📊 MASTER DOCUMENT UPDATE

### **Version Update:**
- Previous: V[X.Y]
- New: V[X.Z]
- Changes: [summary]

### **Completion Percentage:**
- Previous: [X]%
- New: [Y]%
- Change: +[Z]%

---

## 🎯 TOMORROW'S PRIORITIES

### **Must Do:**
1. [ ] [Priority 1] - Estimated: [X]h
2. [ ] [Priority 2] - Estimated: [Y]h
3. [ ] [Priority 3] - Estimated: [Z]h

### **Should Do:**
1. [ ] [Task 1] - Estimated: [X]h
2. [ ] [Task 2] - Estimated: [Y]h

### **Nice to Have:**
1. [ ] [Task 1] - Estimated: [X]h

---

## 📦 COMMITS

### **Commits Pushed Today:**
1. [commit_hash] - [message]
2. [commit_hash] - [message]
3. [commit_hash] - [message]

**Total Commits:** [X]

---

## ✅ CHECKLIST BEFORE LEAVING

- [ ] All code committed and pushed
- [ ] All documentation committed and pushed
- [ ] Database audit completed
- [ ] Master document updated
- [ ] Tomorrow's briefing created
- [ ] No uncommitted changes
- [ ] All tests passing (if applicable)
- [ ] No blocking errors

---

## 📝 NOTES

**What Went Well:**
- [Note 1]
- [Note 2]

**What Could Be Better:**
- [Note 1]
- [Note 2]

**Lessons Learned:**
- [Lesson 1]
- [Lesson 2]

---

**Status:** ✅ **DAY COMPLETE**  
**Next Session:** [Date/Time]  
**Ready for:** [Next task]

---

*Created: [Date, Time]*  
*Audit Duration: [X] minutes*  
*Compliance: [%]*
