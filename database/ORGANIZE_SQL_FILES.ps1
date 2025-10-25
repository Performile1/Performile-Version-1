# ============================================================================
# ORGANIZE SQL FILES - PowerShell Script
# ============================================================================
# Date: October 23, 2025, 8:55 AM
# Purpose: Move 100+ SQL files into organized folder structure
# Framework: SPEC_DRIVEN_FRAMEWORK v1.21
# ============================================================================

Write-Host "🗂️  Starting SQL File Organization..." -ForegroundColor Cyan
Write-Host ""

# Get current directory
$dbPath = "c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main\database"
Set-Location $dbPath

# ============================================================================
# STEP 1: Create folder structure (if not exists)
# ============================================================================

Write-Host "📁 Creating folder structure..." -ForegroundColor Yellow

$folders = @(
    "active",
    "archive\checks",
    "archive\fixes",
    "archive\utilities",
    "archive\data",
    "archive\old-migrations",
    "archive\setup",
    "archive\rls"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✅ Created: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Exists: $folder" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================================================
# STEP 2: Move CHECK_* files to archive/checks/
# ============================================================================

Write-Host "🔍 Moving CHECK files..." -ForegroundColor Yellow

$checkFiles = @(
    "CHECK_AND_CREATE_MISSING_TABLES.sql",
    "CHECK_AND_ENABLE_RLS.sql",
    "CHECK_COMPLETE_DATABASE_CONTENT.sql",
    "CHECK_CURRENT_SUBSCRIPTION_PLANS.sql",
    "CHECK_DATABASE_SAFE.sql",
    "CHECK_DATABASE_SIMPLE.sql",
    "CHECK_DATABASE_ULTIMATE.sql",
    "CHECK_NOTIFICATION_DUPLICATE.sql",
    "CHECK_ORDERS_SCHEMA.sql",
    "CHECK_WEEK3_TABLES.sql",
    "COMPARE_NOTIFICATION_COLUMNS.sql",
    "COMPREHENSIVE_DATABASE_VALIDATION.sql",
    "GET_ALL_TABLE_NAMES.sql",
    "LIST_ALL_TABLES.sql",
    "VERIFY_DATABASE_SETUP.sql",
    "quick-check-merchant.sql",
    "quick-database-check.sql",
    "simple-database-check.sql",
    "show-all-tables-with-counts.sql",
    "what-exists.sql",
    "list-all-tables.sql",
    "FIND_MISSING_TABLE.sql"
)

foreach ($file in $checkFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\checks\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# STEP 3: Move FIX_* and QUICK_FIX_* files to archive/fixes/
# ============================================================================

Write-Host "🔧 Moving FIX files..." -ForegroundColor Yellow

$fixFiles = @(
    "FIX_TIER_CONSTRAINT.sql",
    "DROP_DUPLICATE_NOTIFICATION_PREFERENCES.sql",
    "RENAME_WEEK3_TABLES.sql",
    "RESET_TEST_PASSWORD.sql",
    "CLEANUP_SUBSCRIPTION_PLANS.sql",
    "cleanup-duplicate-subscription-tables.sql",
    "fix-database-issues.sql",
    "quick-fix-admin.sql",
    "disable-rls.sql"
)

foreach ($file in $fixFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\fixes\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# STEP 4: Move utility/export files to archive/utilities/
# ============================================================================

Write-Host "🛠️  Moving UTILITY files..." -ForegroundColor Yellow

$utilityFiles = @(
    "EXPORT_DATABASE_REPORT.sql",
    "GENERATE_DATABASE_SNAPSHOT.sql",
    "create-snapshot.ps1",
    "DEPLOY_TO_SUPABASE.sql"
)

foreach ($file in $utilityFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\utilities\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# STEP 5: Move seed/demo data files to archive/data/
# ============================================================================

Write-Host "📊 Moving DATA files..." -ForegroundColor Yellow

$dataFiles = @(
    "demo_data.sql",
    "demo_users_crypto.sql",
    "seed-all-couriers.sql",
    "seed-demo-data.sql",
    "seed-sample-data.sql",
    "seed-simple-data.sql",
    "seed-test-data.sql",
    "seed_data.sql",
    "create-sample-orders-simple.sql",
    "create-sample-orders.sql",
    "create-test-users.sql",
    "create-consumer-user.sql",
    "insert-real-couriers.sql",
    "marketplace-demo-data.sql",
    "setup-merchant-data.sql",
    "assign-test-subscriptions.sql",
    "verify-merchant-data.sql",
    "populate-analytics-cache.sql",
    "INSERT_SUBSCRIPTION_PLANS.sql"
)

foreach ($file in $dataFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\data\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# STEP 6: Move old migration/setup files to archive/old-migrations/
# ============================================================================

Write-Host "📦 Moving OLD MIGRATION files..." -ForegroundColor Yellow

$oldMigrationFiles = @(
    "add-admin-features.sql",
    "add-api-key-column.sql",
    "add-claims-rls-policies.sql",
    "add-new-features-final.sql",
    "add-review-text.sql",
    "add-review-tracking-columns.sql",
    "add-review-tracking.sql",
    "add-stripe-fields.sql",
    "add-team-member-limits.sql",
    "add-tracking-description.sql",
    "bulk-import-postal-codes-api.sql",
    "courier-checkout-analytics-FRESH.sql",
    "courier-checkout-analytics-schema.sql",
    "create-analytics-cache.sql",
    "create-claims-system.sql",
    "create-claims-tables-only.sql",
    "create-missing-tables.sql",
    "create-orders-related-tables.sql",
    "create-postal-codes-table.sql",
    "create-sessions-table.sql",
    "create-subscription-limits-function.sql",
    "create-subscription-system.sql",
    "create-team-invitations-table.sql",
    "create-tracking-system.sql",
    "enhance-subscription-system.sql",
    "import-postal-codes.sql",
    "integration_schema.sql",
    "market-share-analytics.sql",
    "merchant-courier-preferences.sql",
    "merchant-courier-selection-with-limits.sql",
    "merchant-multi-shop-system.sql",
    "messaging-and-reviews-system.sql",
    "missing-tables-only.sql",
    "shopify_schema.sql",
    "subscription-system.sql",
    "supabase_update.sql",
    "supabase_update_safe.sql",
    "trustscore_functions.sql",
    "update-tracking-system.sql"
)

foreach ($file in $oldMigrationFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\old-migrations\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# STEP 7: Move setup/RLS files to archive/setup/ and archive/rls/
# ============================================================================

Write-Host "⚙️  Moving SETUP files..." -ForegroundColor Yellow

$setupFiles = @(
    "ADD_COURIER_ENTERPRISE_PLAN.sql",
    "FINAL_SETUP_SUBSCRIPTION_PLANS.sql",
    "setup-claims-complete.sql"
)

foreach ($file in $setupFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\setup\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔒 Moving RLS files..." -ForegroundColor Yellow

$rlsFiles = @(
    "RLS_COMPREHENSIVE_TEST.sql",
    "RLS_TEST_SIMPLE.sql",
    "row-level-security-safe.sql",
    "row-level-security.sql",
    "enable-rls-production.sql",
    "update-rls-only.sql"
)

foreach ($file in $rlsFiles) {
    if (Test-Path $file) {
        Move-Item $file "archive\rls\" -Force
        Write-Host "  ✅ Moved: $file" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================================================
# STEP 8: Keep active migrations in active/ folder
# ============================================================================

Write-Host "✨ Active migrations already in active/ folder" -ForegroundColor Green
Write-Host "  - CONSOLIDATED_MIGRATION_2025_10_22.sql" -ForegroundColor Gray
Write-Host "  - WEEK4_PHASE1_service_performance.sql" -ForegroundColor Gray
Write-Host "  - WEEK4_PHASE2_parcel_points.sql" -ForegroundColor Gray
Write-Host "  - WEEK4_PHASE3_service_registration.sql" -ForegroundColor Gray

Write-Host ""

# ============================================================================
# STEP 9: Summary
# ============================================================================

Write-Host "📊 Organization Summary:" -ForegroundColor Cyan
Write-Host ""

$summary = @{
    "active/" = (Get-ChildItem "active" -File).Count
    "archive/checks/" = (Get-ChildItem "archive\checks" -File -ErrorAction SilentlyContinue).Count
    "archive/fixes/" = (Get-ChildItem "archive\fixes" -File -ErrorAction SilentlyContinue).Count
    "archive/utilities/" = (Get-ChildItem "archive\utilities" -File -ErrorAction SilentlyContinue).Count
    "archive/data/" = (Get-ChildItem "archive\data" -File -ErrorAction SilentlyContinue).Count
    "archive/old-migrations/" = (Get-ChildItem "archive\old-migrations" -File -ErrorAction SilentlyContinue).Count
    "archive/setup/" = (Get-ChildItem "archive\setup" -File -ErrorAction SilentlyContinue).Count
    "archive/rls/" = (Get-ChildItem "archive\rls" -File -ErrorAction SilentlyContinue).Count
}

foreach ($folder in $summary.Keys | Sort-Object) {
    $count = $summary[$folder]
    Write-Host "  $folder : $count files" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ SQL File Organization Complete!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# END OF SCRIPT
# ============================================================================
