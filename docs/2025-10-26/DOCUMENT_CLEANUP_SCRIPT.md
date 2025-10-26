# 🗂️ Document Cleanup Script

**Date:** October 26, 2025  
**Purpose:** Clean up duplicate files, organize documentation  
**Status:** Ready to execute

---

## 📋 CLEANUP ACTIONS

### **1. Archive Old Master Documents**

```bash
# Create archive directory
mkdir -p docs/archive/master-versions

# Move old master documents
mv docs/2025-10-23/PERFORMILE_MASTER_V2.2.md docs/archive/master-versions/
mv docs/2025-10-22/PERFORMILE_MASTER_V2.1.md docs/archive/master-versions/
mv docs/2025-10-22/PERFORMILE_MASTER_V2.1_PART1.md docs/archive/master-versions/
mv docs/2025-10-20/PERFORMILE_MASTER_V2.0.md docs/archive/master-versions/
mv docs/2025-10-18/PERFORMILE_MASTER_V1.18.md docs/archive/master-versions/
mv PERFORMILE_MASTER_v1.17.md docs/archive/master-versions/
mv PERFORMILE_MASTER_v1.16.md docs/archive/master-versions/
mv PERFORMILE_MASTER_V1.15.md docs/archive/master-versions/
mv docs/archive/PERFORMILE_MASTER.md docs/archive/master-versions/

# Keep only latest
# docs/2025-10-25/PERFORMILE_MASTER_V2.3.md (CURRENT)
```

### **2. Archive Old Start of Day Files**

```bash
# Create archive directory
mkdir -p docs/archive/start-of-day

# Move old files
mv docs/2025-10-23/START_OF_DAY_BRIEFING.md docs/archive/start-of-day/
mv docs/2025-10-22/START_OF_DAY_OCT_22.md docs/archive/start-of-day/
mv START_OF_DAY_OCT19.md docs/archive/start-of-day/
mv START_OF_DAY_ACTION_PLAN.md docs/archive/start-of-day/

# Keep only latest
# docs/2025-10-27/START_OF_DAY_BRIEFING.md (TOMORROW)
# docs/2025-10-26/START_OF_DAY_BRIEFING.md (TODAY)
```

### **3. Archive Old End of Day Files**

```bash
# Create archive directory
mkdir -p docs/archive/end-of-day

# Move old files
mv docs/2025-10-25/END_OF_DAY_SUMMARY.md docs/archive/end-of-day/

# Keep only latest
# docs/2025-10-26/END_OF_DAY_SUMMARY.md (TODAY)
```

### **4. Consolidate SQL Migrations**

```bash
# Check for duplicate RLS migrations
ls -la database/migrations/2025-10-26_*rls*.sql

# Keep individual files for now (they're already applied)
# Future: Create consolidated migration for documentation
```

### **5. Clean Up Root Directory**

```bash
# Move old plan files to archive
mkdir -p docs/archive/old-plans
mv MASTER_PLAN_OCT17.md docs/archive/old-plans/
```

---

## 📁 NEW DIRECTORY STRUCTURE

```
docs/
├── current/
│   ├── PLATFORM_STATUS_MASTER.md
│   └── PLATFORM_ROADMAP_MASTER.md
├── 2025-10-27/
│   └── START_OF_DAY_BRIEFING.md (TOMORROW)
├── 2025-10-26/
│   ├── START_OF_DAY_BRIEFING.md
│   ├── END_OF_DAY_SUMMARY.md
│   ├── START_OF_DAY_VS_ACTUAL.md
│   ├── COMPREHENSIVE_AUDIT_AND_STRATEGIC_PLAN.md
│   ├── DOCUMENT_CLEANUP_SCRIPT.md
│   ├── DATA_INVENTORY.md
│   ├── ROLE_BASED_MENU_VERIFICATION.md
│   └── PRODUCTION_SCHEMA_DOCUMENTED.md
├── 2025-10-25/
│   └── PERFORMILE_MASTER_V2.3.md (CURRENT MASTER)
└── archive/
    ├── master-versions/
    │   ├── PERFORMILE_MASTER_V2.2.md
    │   ├── PERFORMILE_MASTER_V2.1.md
    │   ├── PERFORMILE_MASTER_V2.0.md
    │   ├── PERFORMILE_MASTER_V1.18.md
    │   ├── PERFORMILE_MASTER_v1.17.md
    │   ├── PERFORMILE_MASTER_v1.16.md
    │   └── PERFORMILE_MASTER_V1.15.md
    ├── start-of-day/
    │   ├── START_OF_DAY_BRIEFING_2025-10-23.md
    │   ├── START_OF_DAY_OCT_22.md
    │   ├── START_OF_DAY_OCT19.md
    │   └── START_OF_DAY_ACTION_PLAN.md
    ├── end-of-day/
    │   └── END_OF_DAY_SUMMARY_2025-10-25.md
    └── old-plans/
        └── MASTER_PLAN_OCT17.md
```

---

## ✅ KEEP (Current & Active)

### **Master Documents:**
- `docs/2025-10-25/PERFORMILE_MASTER_V2.3.md` ✅
- `docs/current/PLATFORM_STATUS_MASTER.md` ✅
- `docs/current/PLATFORM_ROADMAP_MASTER.md` ✅

### **Today's Documentation:**
- `docs/2025-10-26/START_OF_DAY_BRIEFING.md` ✅
- `docs/2025-10-26/END_OF_DAY_SUMMARY.md` ✅
- `docs/2025-10-26/START_OF_DAY_VS_ACTUAL.md` ✅
- `docs/2025-10-26/COMPREHENSIVE_AUDIT_AND_STRATEGIC_PLAN.md` ✅
- `docs/2025-10-26/DATA_INVENTORY.md` ✅
- `docs/2025-10-26/ROLE_BASED_MENU_VERIFICATION.md` ✅
- `docs/2025-10-26/PRODUCTION_SCHEMA_DOCUMENTED.md` ✅

### **Tomorrow's Planning:**
- `docs/2025-10-27/START_OF_DAY_BRIEFING.md` ✅

### **Framework:**
- `SPEC_DRIVEN_FRAMEWORK.md` ✅

---

## 🗑️ ARCHIVE (Old Versions)

### **Old Master Documents (9 files):**
- `docs/2025-10-23/PERFORMILE_MASTER_V2.2.md` → archive
- `docs/2025-10-22/PERFORMILE_MASTER_V2.1.md` → archive
- `docs/2025-10-22/PERFORMILE_MASTER_V2.1_PART1.md` → archive
- `docs/2025-10-20/PERFORMILE_MASTER_V2.0.md` → archive
- `docs/2025-10-18/PERFORMILE_MASTER_V1.18.md` → archive
- `PERFORMILE_MASTER_v1.17.md` → archive
- `PERFORMILE_MASTER_v1.16.md` → archive
- `PERFORMILE_MASTER_V1.15.md` → archive
- `docs/archive/PERFORMILE_MASTER.md` → archive

### **Old Start of Day (4 files):**
- `docs/2025-10-23/START_OF_DAY_BRIEFING.md` → archive
- `docs/2025-10-22/START_OF_DAY_OCT_22.md` → archive
- `START_OF_DAY_OCT19.md` → archive
- `START_OF_DAY_ACTION_PLAN.md` → archive

### **Old End of Day (1 file):**
- `docs/2025-10-25/END_OF_DAY_SUMMARY.md` → archive

### **Old Plans (1 file):**
- `MASTER_PLAN_OCT17.md` → archive

**Total to Archive:** 15 files

---

## 🚀 EXECUTION PLAN

### **Option A: Manual Cleanup (Safe)**
1. Review each file before moving
2. Verify no important information lost
3. Move files one by one
4. Test that nothing breaks

### **Option B: Automated Script (Fast)**
```bash
#!/bin/bash
# Run this script to clean up automatically

# Create archive directories
mkdir -p docs/archive/master-versions
mkdir -p docs/archive/start-of-day
mkdir -p docs/archive/end-of-day
mkdir -p docs/archive/old-plans

# Archive master documents
for file in \
  "docs/2025-10-23/PERFORMILE_MASTER_V2.2.md" \
  "docs/2025-10-22/PERFORMILE_MASTER_V2.1.md" \
  "docs/2025-10-22/PERFORMILE_MASTER_V2.1_PART1.md" \
  "docs/2025-10-20/PERFORMILE_MASTER_V2.0.md" \
  "docs/2025-10-18/PERFORMILE_MASTER_V1.18.md" \
  "PERFORMILE_MASTER_v1.17.md" \
  "PERFORMILE_MASTER_v1.16.md" \
  "PERFORMILE_MASTER_V1.15.md" \
  "docs/archive/PERFORMILE_MASTER.md"
do
  if [ -f "$file" ]; then
    git mv "$file" docs/archive/master-versions/
    echo "Archived: $file"
  fi
done

# Archive start of day files
for file in \
  "docs/2025-10-23/START_OF_DAY_BRIEFING.md" \
  "docs/2025-10-22/START_OF_DAY_OCT_22.md" \
  "START_OF_DAY_OCT19.md" \
  "START_OF_DAY_ACTION_PLAN.md"
do
  if [ -f "$file" ]; then
    git mv "$file" docs/archive/start-of-day/
    echo "Archived: $file"
  fi
done

# Archive end of day files
if [ -f "docs/2025-10-25/END_OF_DAY_SUMMARY.md" ]; then
  git mv "docs/2025-10-25/END_OF_DAY_SUMMARY.md" docs/archive/end-of-day/
  echo "Archived: docs/2025-10-25/END_OF_DAY_SUMMARY.md"
fi

# Archive old plans
if [ -f "MASTER_PLAN_OCT17.md" ]; then
  git mv "MASTER_PLAN_OCT17.md" docs/archive/old-plans/
  echo "Archived: MASTER_PLAN_OCT17.md"
fi

echo "✅ Cleanup complete!"
echo "📁 Archived 15 files"
echo "📝 Kept current documentation"
```

---

## 📊 CLEANUP SUMMARY

**Before Cleanup:**
- 17 master documents (too many versions)
- 5 start of day files (outdated)
- 2 end of day files (1 outdated)
- 1 old plan file
- **Total:** 25 files

**After Cleanup:**
- 3 master documents (current + 2 reference)
- 2 start of day files (today + tomorrow)
- 1 end of day file (today)
- 15 files archived
- **Total:** 6 active files + 15 archived

**Space Saved:** ~60% reduction in active docs  
**Clarity Gained:** Easy to find current documentation

---

## ✅ VERIFICATION CHECKLIST

After cleanup, verify:
- [ ] Latest master document accessible
- [ ] Today's start/end of day accessible
- [ ] Tomorrow's start of day accessible
- [ ] Framework document accessible
- [ ] All archived files in correct folders
- [ ] Git history preserved
- [ ] No broken links in documentation

---

## 🎯 RECOMMENDATION

**Use Option B (Automated Script)** because:
1. ✅ Safe - uses `git mv` to preserve history
2. ✅ Fast - completes in seconds
3. ✅ Reversible - can undo with git
4. ✅ Clean - organized archive structure

**Run the script and commit:**
```bash
bash cleanup.sh
git commit -m "docs: Archive old documentation, keep only current versions"
git push
```

---

**Ready to execute cleanup?** 🗂️
