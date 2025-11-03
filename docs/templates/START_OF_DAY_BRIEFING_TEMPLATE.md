# START OF DAY BRIEFING - [DATE]

**Date:** [YYYY-MM-DD]  
**Day:** [Week X, Day Y]  
**Time:** [HH:MM AM]  
**Session:** [Morning/Afternoon]

---

## 🎯 TODAY'S OBJECTIVES

### **Primary Goals:**
1. [ ] [Goal 1] - Priority: HIGH - Est: [X]h
2. [ ] [Goal 2] - Priority: HIGH - Est: [Y]h
3. [ ] [Goal 3] - Priority: MEDIUM - Est: [Z]h

### **Secondary Goals:**
1. [ ] [Goal 1] - Priority: MEDIUM - Est: [X]h
2. [ ] [Goal 2] - Priority: LOW - Est: [Y]h

**Total Estimated Time:** [X] hours  
**Available Time:** [Y] hours  
**Buffer:** [Z] hours

---

## 📊 DATABASE STATE (FROM LAST AUDIT)

### **Total Objects:**
- Tables: [X]
- Functions: [Y]
- Views: [Z]
- Materialized Views: [W]

### **Tables Available for Today's Work:**

**Relevant to Today's Tasks:**
```
[table_name_1] - [X] columns - Purpose: [description]
[table_name_2] - [Y] columns - Purpose: [description]
[table_name_3] - [Z] columns - Purpose: [description]
```

### **Functions Available:**
```
[function_name_1]() - Purpose: [description]
[function_name_2]() - Purpose: [description]
```

### **What Can Be Reused:**
- [ ] `[table/function/api]` - For: [today's task]
- [ ] `[table/function/api]` - For: [today's task]

---

## 🔍 PRE-WORK VALIDATION

### **Before Starting, Run These Queries:**

```sql
-- 1. Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('[table1]', '[table2]', '[table3]')
ORDER BY table_name;

-- 2. Check for duplicates in today's domain
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%[domain]%'
ORDER BY table_name;

-- 3. Verify columns in key tables
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = '[key_table]'
ORDER BY ordinal_position;
```

### **Validation Checklist:**
- [ ] All required tables exist
- [ ] No duplicate tables in domain
- [ ] Column names verified
- [ ] RLS policies checked
- [ ] Sample data verified (if needed)

---

## 📋 YESTERDAY'S CARRYOVER

### **Completed Yesterday:**
- ✅ [Task 1]
- ✅ [Task 2]
- ✅ [Task 3]

### **Issues from Yesterday:**
- [ ] [Issue 1] - Status: [Open/Resolved] - Action: [what to do]
- [ ] [Issue 2] - Status: [Open/Resolved] - Action: [what to do]

### **Deferred from Yesterday:**
- [ ] [Task 1] - Reason: [why deferred] - Priority: [HIGH/MEDIUM/LOW]
- [ ] [Task 2] - Reason: [why deferred] - Priority: [HIGH/MEDIUM/LOW]

---

## 🚨 BLOCKING ISSUES

### **Must Resolve Today:**
1. [ ] [Issue 1] - Impact: [description] - Est: [X]h
2. [ ] [Issue 2] - Impact: [description] - Est: [Y]h

### **Can Defer:**
1. [ ] [Issue 1] - Defer to: [date] - Impact: [low]
2. [ ] [Issue 2] - Defer to: [date] - Impact: [low]

---

## 📝 SPEC_DRIVEN_FRAMEWORK CHECKLIST

### **Before Coding:**
- [ ] **Rule #1:** Run database validation
- [ ] **Rule #23:** Check for duplicates
- [ ] **Rule #24:** Identify code to reuse
- [ ] Document existing schema
- [ ] Document what will be reused
- [ ] Document what will be created NEW (and why)

### **During Coding:**
- [ ] **Rule #2:** Only ADD, never ALTER/DROP
- [ ] **Rule #3:** Conform to existing schema
- [ ] Use `IF NOT EXISTS` for all new objects
- [ ] Test incrementally
- [ ] Commit frequently

### **After Coding:**
- [ ] **Rule #25:** Document everything
- [ ] Update master document
- [ ] Create end-of-day audit
- [ ] Push all commits
- [ ] Verify deployment

---

## 🎯 TODAY'S IMPLEMENTATION PLAN

### **Phase 1: [Name] ([X]h)**

**Goal:** [description]

**Tasks:**
1. [ ] [Task 1] - [X] min
2. [ ] [Task 2] - [Y] min
3. [ ] [Task 3] - [Z] min

**Tables to Use:**
- `[table_name]` - For: [purpose]

**Code to Reuse:**
- `[file/function]` - For: [purpose]

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

### **Phase 2: [Name] ([Y]h)**

**Goal:** [description]

**Tasks:**
1. [ ] [Task 1] - [X] min
2. [ ] [Task 2] - [Y] min
3. [ ] [Task 3] - [Z] min

**Tables to Use:**
- `[table_name]` - For: [purpose]

**Code to Reuse:**
- `[file/function]` - For: [purpose]

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

### **Phase 3: [Name] ([Z]h)**

**Goal:** [description]

**Tasks:**
1. [ ] [Task 1] - [X] min
2. [ ] [Task 2] - [Y] min

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## 📦 DEPENDENCIES

### **External Dependencies:**
- [ ] [Dependency 1] - Status: [Available/Waiting] - ETA: [date]
- [ ] [Dependency 2] - Status: [Available/Waiting] - ETA: [date]

### **Internal Dependencies:**
- [ ] [Task/Feature] must be done before [other task]
- [ ] [API credentials] needed before [integration]

---

## 🔑 API CREDENTIALS STATUS

### **Available:**
- ✅ [Service 1] - Test: [Yes/No] - Prod: [Yes/No]
- ✅ [Service 2] - Test: [Yes/No] - Prod: [Yes/No]

### **Needed Today:**
- [ ] [Service 1] - Type: [Test/Prod] - Action: [how to get]
- [ ] [Service 2] - Type: [Test/Prod] - Action: [how to get]

---

## 📊 PROGRESS TRACKING

### **Week Progress:**
- Week [X], Day [Y] of [Z]
- Completed: [X]% of week's goals
- On track: [Yes/No]

### **Launch Progress:**
- Days until launch: [X]
- Platform completion: [Y]%
- Core functions: [Z] of [N] complete

---

## ⏰ TIME ALLOCATION

### **Morning Session (4h):**
- 8:00-8:30: Validation & Setup
- 8:30-10:30: [Phase 1]
- 10:30-12:00: [Phase 2]
- 12:00-12:30: Documentation & Commit

### **Afternoon Session (4h):**
- 1:00-3:00: [Phase 3]
- 3:00-4:30: [Phase 4]
- 4:30-5:00: End-of-day audit

---

## 📝 NOTES & REMINDERS

### **Important:**
- [ ] [Reminder 1]
- [ ] [Reminder 2]

### **Don't Forget:**
- [ ] [Item 1]
- [ ] [Item 2]

### **Questions to Answer:**
- [ ] [Question 1]
- [ ] [Question 2]

---

## ✅ SESSION START CHECKLIST

- [ ] Coffee/water ready ☕
- [ ] Distractions minimized
- [ ] Database validation run
- [ ] Duplicates checked
- [ ] Code to reuse identified
- [ ] Goals clear
- [ ] Time allocated
- [ ] Ready to code!

---

**Status:** ✅ **READY TO START**  
**First Task:** [Task name]  
**Estimated Completion:** [Time]

---

*Created: [Date, Time]*  
*Prep Duration: [X] minutes*  
*Let's build! 🚀*
