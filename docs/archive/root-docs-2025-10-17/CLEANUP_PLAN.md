# Performile Platform - Cleanup Plan
**Date:** October 17, 2025  
**Purpose:** Remove duplicates, archive old docs, optimize codebase

---

## 📋 FILES TO REMOVE

### Backend Example Files (Safe to Delete)
```bash
# Example/template files not used in production
backend/src/routes/orders-refactored-example.ts  # 9.3 KB - Example implementation
```

**Impact:** None - these are example files  
**Action:** Delete immediately

---

## 📦 FILES TO ARCHIVE

### Old Audit Documents (Move to docs/archive/)
```bash
# Historical audits - keep for reference but archive
AUDIT_OCT_14_2025.md
AUDIT_SUMMARY_OCT_14.md
AUTH_FLOW_VERIFICATION.md
BUG_FIX_SUMMARY.md
CREATE_REMAINING_COMPONENTS.md
CURRENT_STATE.md
DASHBOARD_FIX_PLAN.md
DATABASE_CODE_AUDIT.md
DATABASE_DEPLOYMENT_GUIDE.md
DATABASE_SCHEMA_VERIFICATION_NEEDED.md
DATABASE_SETUP_COMPLETE.md
DATA_LEAKAGE_PREVENTION.md
DAY1_PROGRESS.md
DEPLOYMENT_FIXES.md
DEPLOYMENT_STATUS.md
DEVELOPMENT_PLAN.md
FINAL_STATUS_OCT_15_2025.md
FRONTEND_AUDIT_TEMPLATE.md
IMPLEMENTATION_COMPLETE.md
IMPLEMENTATION_PLAN_SUMMARY.md
IMPLEMENTATION_STATUS.md
MANUAL_VERIFICATION_RESULTS.md
MERCHANT_AUDIT_REPORT.md
MERCHANT_AUDIT_RESULTS.md
MERCHANT_DASHBOARD_BUG_FIX.md
MERCHANT_LOGIN_FIX.md
MERCHANT_ROLE_COMPLETE_AUDIT.md
MISSING_API_ENDPOINTS.md
MISSING_FEATURES_IMPLEMENTATION.md
NEXT_SESSION_PLAN.md
PERFORMILE_V1.11_AUDIT.md
PERFORMILE_V1.12_AUDIT.md
```

**Impact:** None - historical reference only  
**Action:** Move to `docs/archive/` folder

---

## ✅ FILES TO KEEP (Active Documentation)

### Current & Essential Documents
```bash
# Master documents
PERFORMILE_MASTER_V1.15.md          # THIS IS THE MAIN DOCUMENT
MASTER_PLAN_OCT17.md                # Current development plan

# API Documentation
API_AUDIT_OCT17.md                  # Latest API audit
API_DOCUMENTATION.md                # API reference

# Database
SUPABASE_MIGRATION_GUIDE.md         # Active migration guide
VERIFY_MIGRATION.sql                # Verification queries
FIX_RLS_POLICIES.sql               # RLS fixes

# Testing
FINAL_SUCCESS_REPORT_OCT17.md       # Latest test results
e2e-tests/RUN_TESTS.md             # Test execution guide

# Features
COURIER_CHECKOUT_ANALYTICS.md       # Feature spec
COURIER_MARKET_INSIGHTS.md          # Feature spec

# Project Structure
MONOREPO_STRUCTURE.md               # Architecture doc
CHANGELOG.md                        # Version history
README.md                           # Project readme
```

---

## 🗂️ PROPOSED FOLDER STRUCTURE

```
performile-platform-main/
├── docs/
│   ├── archive/                    # OLD: Historical documents
│   │   ├── 2025-10-14/
│   │   │   ├── AUDIT_OCT_14_2025.md
│   │   │   ├── AUDIT_SUMMARY_OCT_14.md
│   │   │   └── DAY1_PROGRESS.md
│   │   ├── 2025-10-15/
│   │   │   ├── FINAL_STATUS_OCT_15_2025.md
│   │   │   └── MERCHANT_LOGIN_FIX.md
│   │   └── 2025-10-16/
│   │       ├── PERFORMILE_V1.11_AUDIT.md
│   │       ├── PERFORMILE_V1.12_AUDIT.md
│   │       └── DEPLOYMENT_FIXES.md
│   │
│   ├── api/                        # CURRENT: API documentation
│   │   ├── API_DOCUMENTATION.md
│   │   └── API_AUDIT_OCT17.md
│   │
│   ├── database/                   # CURRENT: Database docs
│   │   ├── SUPABASE_MIGRATION_GUIDE.md
│   │   ├── VERIFY_MIGRATION.sql
│   │   └── FIX_RLS_POLICIES.sql
│   │
│   ├── features/                   # CURRENT: Feature specs
│   │   ├── COURIER_CHECKOUT_ANALYTICS.md
│   │   └── COURIER_MARKET_INSIGHTS.md
│   │
│   └── testing/                    # CURRENT: Test docs
│       ├── FINAL_SUCCESS_REPORT_OCT17.md
│       └── RUN_TESTS.md
│
├── PERFORMILE_MASTER_V1.15.md      # MAIN DOCUMENT
├── MASTER_PLAN_OCT17.md            # CURRENT PLAN
├── CHANGELOG.md                    # VERSION HISTORY
└── README.md                       # PROJECT README
```

---

## 🔧 CLEANUP SCRIPT

### PowerShell Script (Windows)
```powershell
# cleanup.ps1
# Performile Platform Cleanup Script

Write-Host "🧹 Starting Performile Platform Cleanup..." -ForegroundColor Cyan

# Create archive directories
Write-Host "`n📁 Creating archive directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "docs/archive/2025-10-14" | Out-Null
New-Item -ItemType Directory -Force -Path "docs/archive/2025-10-15" | Out-Null
New-Item -ItemType Directory -Force -Path "docs/archive/2025-10-16" | Out-Null
New-Item -ItemType Directory -Force -Path "docs/api" | Out-Null
New-Item -ItemType Directory -Force -Path "docs/database" | Out-Null
New-Item -ItemType Directory -Force -Path "docs/features" | Out-Null
New-Item -ItemType Directory -Force -Path "docs/testing" | Out-Null

# Remove example files
Write-Host "`n🗑️  Removing example files..." -ForegroundColor Yellow
Remove-Item -Path "backend/src/routes/orders-refactored-example.ts" -ErrorAction SilentlyContinue
Write-Host "   ✅ Removed orders-refactored-example.ts" -ForegroundColor Green

# Archive Oct 14 documents
Write-Host "`n📦 Archiving Oct 14 documents..." -ForegroundColor Yellow
$oct14Files = @(
    "AUDIT_OCT_14_2025.md",
    "AUDIT_SUMMARY_OCT_14.md",
    "DAY1_PROGRESS.md"
)
foreach ($file in $oct14Files) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/archive/2025-10-14/" -Force
        Write-Host "   ✅ Archived $file" -ForegroundColor Green
    }
}

# Archive Oct 15 documents
Write-Host "`n📦 Archiving Oct 15 documents..." -ForegroundColor Yellow
$oct15Files = @(
    "FINAL_STATUS_OCT_15_2025.md",
    "MERCHANT_LOGIN_FIX.md",
    "MERCHANT_DASHBOARD_BUG_FIX.md",
    "MERCHANT_AUDIT_REPORT.md",
    "MERCHANT_AUDIT_RESULTS.md",
    "MERCHANT_ROLE_COMPLETE_AUDIT.md"
)
foreach ($file in $oct15Files) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/archive/2025-10-15/" -Force
        Write-Host "   ✅ Archived $file" -ForegroundColor Green
    }
}

# Archive Oct 16 documents
Write-Host "`n📦 Archiving Oct 16 documents..." -ForegroundColor Yellow
$oct16Files = @(
    "PERFORMILE_V1.11_AUDIT.md",
    "PERFORMILE_V1.12_AUDIT.md",
    "DEPLOYMENT_FIXES.md",
    "DEPLOYMENT_STATUS.md",
    "DATABASE_DEPLOYMENT_GUIDE.md",
    "DATABASE_SETUP_COMPLETE.md"
)
foreach ($file in $oct16Files) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/archive/2025-10-16/" -Force
        Write-Host "   ✅ Archived $file" -ForegroundColor Green
    }
}

# Archive general old documents
Write-Host "`n📦 Archiving general old documents..." -ForegroundColor Yellow
$oldFiles = @(
    "AUTH_FLOW_VERIFICATION.md",
    "BUG_FIX_SUMMARY.md",
    "CREATE_REMAINING_COMPONENTS.md",
    "CURRENT_STATE.md",
    "DASHBOARD_FIX_PLAN.md",
    "DATABASE_CODE_AUDIT.md",
    "DATABASE_SCHEMA_VERIFICATION_NEEDED.md",
    "DATA_LEAKAGE_PREVENTION.md",
    "DEVELOPMENT_PLAN.md",
    "FRONTEND_AUDIT_TEMPLATE.md",
    "IMPLEMENTATION_COMPLETE.md",
    "IMPLEMENTATION_PLAN_SUMMARY.md",
    "IMPLEMENTATION_STATUS.md",
    "MANUAL_VERIFICATION_RESULTS.md",
    "MISSING_API_ENDPOINTS.md",
    "MISSING_FEATURES_IMPLEMENTATION.md",
    "NEXT_SESSION_PLAN.md"
)
foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/archive/" -Force
        Write-Host "   ✅ Archived $file" -ForegroundColor Green
    }
}

# Organize current documentation
Write-Host "`n📚 Organizing current documentation..." -ForegroundColor Yellow

# API docs
if (Test-Path "API_DOCUMENTATION.md") {
    Move-Item -Path "API_DOCUMENTATION.md" -Destination "docs/api/" -Force
    Write-Host "   ✅ Moved API_DOCUMENTATION.md" -ForegroundColor Green
}
if (Test-Path "API_AUDIT_OCT17.md") {
    Move-Item -Path "API_AUDIT_OCT17.md" -Destination "docs/api/" -Force
    Write-Host "   ✅ Moved API_AUDIT_OCT17.md" -ForegroundColor Green
}

# Database docs
if (Test-Path "SUPABASE_MIGRATION_GUIDE.md") {
    Move-Item -Path "SUPABASE_MIGRATION_GUIDE.md" -Destination "docs/database/" -Force
    Write-Host "   ✅ Moved SUPABASE_MIGRATION_GUIDE.md" -ForegroundColor Green
}
if (Test-Path "VERIFY_MIGRATION.sql") {
    Move-Item -Path "VERIFY_MIGRATION.sql" -Destination "docs/database/" -Force
    Write-Host "   ✅ Moved VERIFY_MIGRATION.sql" -ForegroundColor Green
}
if (Test-Path "FIX_RLS_POLICIES.sql") {
    Move-Item -Path "FIX_RLS_POLICIES.sql" -Destination "docs/database/" -Force
    Write-Host "   ✅ Moved FIX_RLS_POLICIES.sql" -ForegroundColor Green
}

# Feature docs
if (Test-Path "COURIER_CHECKOUT_ANALYTICS.md") {
    Move-Item -Path "COURIER_CHECKOUT_ANALYTICS.md" -Destination "docs/features/" -Force
    Write-Host "   ✅ Moved COURIER_CHECKOUT_ANALYTICS.md" -ForegroundColor Green
}
if (Test-Path "COURIER_MARKET_INSIGHTS.md") {
    Move-Item -Path "COURIER_MARKET_INSIGHTS.md" -Destination "docs/features/" -Force
    Write-Host "   ✅ Moved COURIER_MARKET_INSIGHTS.md" -ForegroundColor Green
}

# Testing docs
if (Test-Path "FINAL_SUCCESS_REPORT_OCT17.md") {
    Move-Item -Path "FINAL_SUCCESS_REPORT_OCT17.md" -Destination "docs/testing/" -Force
    Write-Host "   ✅ Moved FINAL_SUCCESS_REPORT_OCT17.md" -ForegroundColor Green
}

Write-Host "`n✨ Cleanup complete!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   • Removed example files" -ForegroundColor White
Write-Host "   • Archived old documents" -ForegroundColor White
Write-Host "   • Organized current documentation" -ForegroundColor White
Write-Host "`n📁 Main documents remain in root:" -ForegroundColor Cyan
Write-Host "   • PERFORMILE_MASTER_V1.15.md" -ForegroundColor White
Write-Host "   • MASTER_PLAN_OCT17.md" -ForegroundColor White
Write-Host "   • CHANGELOG.md" -ForegroundColor White
Write-Host "   • README.md" -ForegroundColor White
```

---

## 📝 EXECUTION PLAN

### Step 1: Review
- [ ] Review this cleanup plan
- [ ] Verify files to be removed/archived
- [ ] Confirm no active dependencies

### Step 2: Backup
- [ ] Create full backup of current state
- [ ] Commit all current changes to git
- [ ] Tag current version: `v1.15-pre-cleanup`

### Step 3: Execute
- [ ] Run cleanup script
- [ ] Verify file structure
- [ ] Test application still works

### Step 4: Commit
- [ ] Stage all changes
- [ ] Commit with message: "chore: Clean up documentation and remove duplicates"
- [ ] Tag new version: `v1.15-post-cleanup`
- [ ] Push to repository

### Step 5: Verify
- [ ] Check all links in documentation
- [ ] Verify no broken references
- [ ] Update README if needed

---

## ⚠️ SAFETY CHECKS

### Before Running Script
1. ✅ All changes committed to git
2. ✅ Backup created
3. ✅ No active work in progress
4. ✅ Team notified of cleanup

### After Running Script
1. ✅ Application still runs
2. ✅ All tests still pass
3. ✅ Documentation links work
4. ✅ No broken imports

---

## 📈 EXPECTED RESULTS

### File Count Reduction
- **Before:** ~41 MD files in root
- **After:** ~4 MD files in root (96% reduction)
- **Archived:** ~37 MD files organized by date

### Benefits
- ✅ Cleaner root directory
- ✅ Easier to find current docs
- ✅ Historical docs preserved
- ✅ Better organization
- ✅ Reduced confusion

---

## 🔄 ROLLBACK PLAN

If issues occur:
```powershell
# Rollback to pre-cleanup state
git reset --hard v1.15-pre-cleanup
```

---

**Status:** Ready to Execute  
**Risk Level:** Low (all files backed up)  
**Estimated Time:** 5 minutes  
**Approval Required:** Yes
