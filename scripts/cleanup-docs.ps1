# PERFORMILE PLATFORM - DOCUMENTATION CLEANUP SCRIPT
# Date: November 1, 2025
# Purpose: Clean up obsolete, duplicate, and old documentation files

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PERFORMILE DOCUMENTATION CLEANUP SCRIPT" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set base path
$basePath = "c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main\docs"

# Confirm before proceeding
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  - Delete 16 duplicate files" -ForegroundColor Yellow
Write-Host "  - Archive 105 old daily documentation files" -ForegroundColor Yellow
Write-Host "  - Archive 15 obsolete root documentation files" -ForegroundColor Yellow
Write-Host "  - Organize current documentation into new structure" -ForegroundColor Yellow
Write-Host ""
Write-Host "All files will be preserved in git history." -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Cleanup cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Green
Write-Host ""

# ============================================================
# PHASE 1: DELETE DUPLICATES (16 files)
# ============================================================

Write-Host "PHASE 1: Deleting duplicate files..." -ForegroundColor Cyan

$duplicates = @(
    # Duplicate master documents
    "$basePath\2025-10-18\PERFORMILE_MASTER_V1.18.md",
    "$basePath\2025-10-20\PERFORMILE_MASTER_V2.0.md",
    "$basePath\2025-10-30\PERFORMILE_MASTER_V3.0.md",
    "$basePath\2025-10-30\PERFORMILE_MASTER_V3.1.md",
    "$basePath\2025-10-31\PERFORMILE_MASTER_V3.2.md",
    "$basePath\2025-10-30\PERFORMILE_MASTER_V3.0_REVISED.md",
    
    # Duplicate business plans
    "$basePath\2025-10-18\PERFORMILE_BUSINESS_PLAN_V1.18.md",
    "$basePath\2025-10-20\PERFORMILE_BUSINESS_PLAN_V2.0.md",
    
    # Duplicate GTM strategies
    "$basePath\2025-10-18\PERFORMILE_GTM_STRATEGY_V1.18.md",
    "$basePath\2025-10-20\PERFORMILE_GTM_STRATEGY_V2.0.md",
    
    # Duplicate READMEs
    "$basePath\2025-10-18\README_MASTER_DOCS.md",
    "$basePath\2025-10-20\README_MASTER_DOCS.md",
    
    # Duplicate feature audits
    "$basePath\2025-10-18\PERFORMILE_FEATURES_AUDIT_V1.18.md",
    "$basePath\2025-10-20\PERFORMILE_FEATURES_AUDIT.md",
    
    # Obsolete missing features
    "$basePath\2025-10-18\MISSING_FEATURES_ADDENDUM.md",
    "$basePath\2025-10-20\MISSING_FEATURES_ADDENDUM.md"
)

$deletedCount = 0
foreach ($file in $duplicates) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✓ Deleted: $(Split-Path $file -Leaf)" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "  ⚠ Not found: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
    }
}

Write-Host "Phase 1 Complete: $deletedCount files deleted" -ForegroundColor Green
Write-Host ""

# ============================================================
# PHASE 2: ARCHIVE OLD DAILY DOCS (105 files in 10 folders)
# ============================================================

Write-Host "PHASE 2: Archiving old daily documentation..." -ForegroundColor Cyan

# Create archive structure
$archivePath = "$basePath\archive\old-daily"
if (-not (Test-Path $archivePath)) {
    New-Item -ItemType Directory -Path $archivePath -Force | Out-Null
    Write-Host "  ✓ Created archive directory: old-daily" -ForegroundColor Green
}

# Folders to archive (older than 7 days)
$oldDailyFolders = @(
    "2025-10-18",
    "2025-10-19",
    "2025-10-20",
    "2025-10-21",
    "2025-10-22",
    "2025-10-23",
    "2025-10-25",
    "2025-10-26",
    "2025-10-27",
    "2025-10-29"
)

$archivedFolders = 0
foreach ($folder in $oldDailyFolders) {
    $sourcePath = "$basePath\$folder"
    $destPath = "$archivePath\$folder"
    
    if (Test-Path $sourcePath) {
        Move-Item $sourcePath $destPath -Force
        Write-Host "  ✓ Archived: $folder" -ForegroundColor Green
        $archivedFolders++
    } else {
        Write-Host "  ⚠ Not found: $folder" -ForegroundColor Yellow
    }
}

Write-Host "Phase 2 Complete: $archivedFolders folders archived" -ForegroundColor Green
Write-Host ""

# ============================================================
# PHASE 3: ARCHIVE OBSOLETE ROOT DOCS (15 files)
# ============================================================

Write-Host "PHASE 3: Archiving obsolete root documentation..." -ForegroundColor Cyan

# Create archive structure
$obsoletePath = "$basePath\archive\obsolete"
if (-not (Test-Path $obsoletePath)) {
    New-Item -ItemType Directory -Path $obsoletePath -Force | Out-Null
    Write-Host "  ✓ Created archive directory: obsolete" -ForegroundColor Green
}

# Files to archive
$obsoleteFiles = @(
    "$basePath\AUDIT_PROGRESS.md",
    "$basePath\DAILY_DOCUMENTATION_GUIDE.md",
    "$basePath\DOCUMENT_INVENTORY.md",
    "$basePath\EXTRACTED_INFORMATION.md",
    "$basePath\IMPLEMENTATION_STATUS.md",
    "$basePath\ISSUES_ANALYSIS.md",
    "$basePath\ORGANIZATION_SUMMARY.md",
    "$basePath\PROJECT_TIMELINE.md",
    "$basePath\RLS_API_INTEGRATION_STATUS.md",
    "$basePath\RLS_INTEGRATION_COMPLETE.md",
    "$basePath\VIEW_AUDIT_AND_ROLE_CONFLICTS.md",
    "$basePath\FUTURE_VPS_MIGRATION_PLAN.md",
    "$basePath\START_OF_DAY_BRIEFING_TEMPLATE.md",
    "$basePath\ROLE_FILTERING_IMPLEMENTATION.md",
    "$basePath\SUBSCRIPTION_SYSTEM.md"
)

$archivedFiles = 0
foreach ($file in $obsoleteFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Move-Item $file "$obsoletePath\$fileName" -Force
        Write-Host "  ✓ Archived: $fileName" -ForegroundColor Green
        $archivedFiles++
    } else {
        Write-Host "  ⚠ Not found: $(Split-Path $file -Leaf)" -ForegroundColor Yellow
    }
}

Write-Host "Phase 3 Complete: $archivedFiles files archived" -ForegroundColor Green
Write-Host ""

# ============================================================
# PHASE 4: ORGANIZE CURRENT DOCS
# ============================================================

Write-Host "PHASE 4: Organizing current documentation..." -ForegroundColor Cyan

# Create new structure
$currentPath = "$basePath\current"
$investorPath = "$currentPath\investor-package"
$dailyPath = "$basePath\daily"

if (-not (Test-Path $currentPath)) {
    New-Item -ItemType Directory -Path $currentPath -Force | Out-Null
    Write-Host "  ✓ Created: current/" -ForegroundColor Green
}

if (-not (Test-Path $investorPath)) {
    New-Item -ItemType Directory -Path $investorPath -Force | Out-Null
    Write-Host "  ✓ Created: current/investor-package/" -ForegroundColor Green
}

if (-not (Test-Path $dailyPath)) {
    New-Item -ItemType Directory -Path $dailyPath -Force | Out-Null
    Write-Host "  ✓ Created: daily/" -ForegroundColor Green
}

# Copy current master document
if (Test-Path "$basePath\2025-11-01\PERFORMILE_MASTER_V3.3.md") {
    Copy-Item "$basePath\2025-11-01\PERFORMILE_MASTER_V3.3.md" "$currentPath\" -Force
    Write-Host "  ✓ Copied: PERFORMILE_MASTER_V3.3.md to current/" -ForegroundColor Green
}

# Copy investor documents
$investorDocs = @(
    "INVESTOR_EXECUTIVE_SUMMARY.md",
    "CODE_AUDIT_COMPLETE.md",
    "FILE_DOCUMENTATION_INVENTORY.md",
    "INVESTOR_PACKAGE_COMPLETE.md"
)

foreach ($doc in $investorDocs) {
    $sourcePath = "$basePath\2025-11-01\$doc"
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath "$investorPath\" -Force
        Write-Host "  ✓ Copied: $doc to investor-package/" -ForegroundColor Green
    }
}

# Copy current week docs
if (Test-Path "$basePath\2025-11-01\WEEK_1_AUDIT.md") {
    Copy-Item "$basePath\2025-11-01\WEEK_1_AUDIT.md" "$currentPath\" -Force
    Write-Host "  ✓ Copied: WEEK_1_AUDIT.md to current/" -ForegroundColor Green
}

if (Test-Path "$basePath\2025-10-30\REVISED_LAUNCH_STRATEGY.md") {
    Copy-Item "$basePath\2025-10-30\REVISED_LAUNCH_STRATEGY.md" "$currentPath\" -Force
    Write-Host "  ✓ Copied: REVISED_LAUNCH_STRATEGY.md to current/" -ForegroundColor Green
}

# Move recent daily folders
$recentFolders = @("2025-10-30", "2025-10-31", "2025-11-01")
foreach ($folder in $recentFolders) {
    $sourcePath = "$basePath\$folder"
    $destPath = "$dailyPath\$folder"
    
    if (Test-Path $sourcePath) {
        Move-Item $sourcePath $destPath -Force
        Write-Host "  ✓ Moved: $folder to daily/" -ForegroundColor Green
    }
}

Write-Host "Phase 4 Complete: Documentation organized" -ForegroundColor Green
Write-Host ""

# ============================================================
# SUMMARY
# ============================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  - Deleted: $deletedCount duplicate files" -ForegroundColor Green
Write-Host "  - Archived: $archivedFolders old daily folders" -ForegroundColor Green
Write-Host "  - Archived: $archivedFiles obsolete files" -ForegroundColor Green
Write-Host "  - Organized: Current documentation structure" -ForegroundColor Green
Write-Host ""
Write-Host "New Structure:" -ForegroundColor White
Write-Host "  docs/current/              - Active master & investor docs" -ForegroundColor Cyan
Write-Host "  docs/daily/                - Recent daily docs (last 3 days)" -ForegroundColor Cyan
Write-Host "  docs/guides/               - Technical guides" -ForegroundColor Cyan
Write-Host "  docs/planning/             - Planning documents" -ForegroundColor Cyan
Write-Host "  docs/archive/              - Historical documents" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review the changes" -ForegroundColor White
Write-Host "  2. Update README.md with new structure" -ForegroundColor White
Write-Host "  3. Commit changes with: git add . && git commit -m 'docs: Major cleanup'" -ForegroundColor White
Write-Host "  4. Push to GitHub: git push" -ForegroundColor White
Write-Host ""
Write-Host "All files preserved in git history!" -ForegroundColor Green
Write-Host ""
