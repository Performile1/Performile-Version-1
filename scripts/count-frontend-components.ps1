# ============================================================================
# FRONTEND COMPONENT COUNTER - November 4, 2025, 7:13 PM
# ============================================================================
# Purpose: Count all React components, pages, and related files
# ============================================================================

Write-Host "=== FRONTEND COMPONENT AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# Base paths
$webPath = "apps\web\src"
$componentsPath = "$webPath\components"
$pagesPath = "$webPath\pages"

# ============================================================================
# 1. COUNT COMPONENTS
# ============================================================================

Write-Host "1. COMPONENTS:" -ForegroundColor Yellow

# All component files
$allComponents = Get-ChildItem -Path $componentsPath -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
$componentCount = $allComponents.Count

Write-Host "   Total Component Files: $componentCount" -ForegroundColor Green

# Components by directory
Write-Host ""
Write-Host "   Components by Directory:" -ForegroundColor White
$componentsByDir = $allComponents | Group-Object { Split-Path $_.DirectoryName -Leaf } | Sort-Object Count -Descending | Select-Object -First 10
foreach ($dir in $componentsByDir) {
    Write-Host "   - $($dir.Name): $($dir.Count)" -ForegroundColor Gray
}

# ============================================================================
# 2. COUNT PAGES
# ============================================================================

Write-Host ""
Write-Host "2. PAGES:" -ForegroundColor Yellow

# All page files
$allPages = Get-ChildItem -Path $pagesPath -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
$pageCount = $allPages.Count

Write-Host "   Total Page Files: $pageCount" -ForegroundColor Green

# Pages by directory
Write-Host ""
Write-Host "   Pages by Directory:" -ForegroundColor White
$pagesByDir = $allPages | Group-Object { Split-Path $_.DirectoryName -Leaf } | Sort-Object Count -Descending
foreach ($dir in $pagesByDir) {
    Write-Host "   - $($dir.Name): $($dir.Count)" -ForegroundColor Gray
}

# List all pages
Write-Host ""
Write-Host "   All Pages:" -ForegroundColor White
foreach ($page in $allPages | Sort-Object Name) {
    $relativePath = $page.FullName -replace [regex]::Escape($PWD.Path + "\"), ""
    Write-Host "   - $($page.Name)" -ForegroundColor Gray
}

# ============================================================================
# 3. COUNT HOOKS
# ============================================================================

Write-Host ""
Write-Host "3. CUSTOM HOOKS:" -ForegroundColor Yellow

$hooksPath = "$webPath\hooks"
if (Test-Path $hooksPath) {
    $allHooks = Get-ChildItem -Path $hooksPath -Recurse -Filter "*.ts*" -ErrorAction SilentlyContinue
    $hookCount = $allHooks.Count
    Write-Host "   Total Custom Hooks: $hookCount" -ForegroundColor Green
} else {
    Write-Host "   Hooks directory not found" -ForegroundColor Red
}

# ============================================================================
# 4. COUNT UTILITIES
# ============================================================================

Write-Host ""
Write-Host "4. UTILITIES:" -ForegroundColor Yellow

$utilsPath = "$webPath\utils"
if (Test-Path $utilsPath) {
    $allUtils = Get-ChildItem -Path $utilsPath -Recurse -Filter "*.ts*" -ErrorAction SilentlyContinue
    $utilCount = $allUtils.Count
    Write-Host "   Total Utility Files: $utilCount" -ForegroundColor Green
} else {
    Write-Host "   Utils directory not found" -ForegroundColor Red
}

# ============================================================================
# 5. COUNT CONTEXTS
# ============================================================================

Write-Host ""
Write-Host "5. CONTEXTS:" -ForegroundColor Yellow

$contextsPath = "$webPath\contexts"
if (Test-Path $contextsPath) {
    $allContexts = Get-ChildItem -Path $contextsPath -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
    $contextCount = $allContexts.Count
    Write-Host "   Total Context Files: $contextCount" -ForegroundColor Green
} else {
    Write-Host "   Contexts directory not found" -ForegroundColor Red
}

# ============================================================================
# 6. COUNT TYPES
# ============================================================================

Write-Host ""
Write-Host "6. TYPE DEFINITIONS:" -ForegroundColor Yellow

$typesPath = "$webPath\types"
if (Test-Path $typesPath) {
    $allTypes = Get-ChildItem -Path $typesPath -Recurse -Filter "*.ts*" -ErrorAction SilentlyContinue
    $typeCount = $allTypes.Count
    Write-Host "   Total Type Files: $typeCount" -ForegroundColor Green
} else {
    Write-Host "   Types directory not found" -ForegroundColor Red
}

# ============================================================================
# 7. TOTAL LINES OF CODE
# ============================================================================

Write-Host ""
Write-Host "7. LINES OF CODE:" -ForegroundColor Yellow

$allTsxFiles = Get-ChildItem -Path $webPath -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
$allTsFiles = Get-ChildItem -Path $webPath -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue

$tsxLines = ($allTsxFiles | Get-Content | Measure-Object -Line).Lines
$tsLines = ($allTsFiles | Get-Content | Measure-Object -Line).Lines

Write-Host "   TSX Files: $($allTsxFiles.Count) files, $tsxLines lines" -ForegroundColor Green
Write-Host "   TS Files: $($allTsFiles.Count) files, $tsLines lines" -ForegroundColor Green
Write-Host "   Total: $($allTsxFiles.Count + $allTsFiles.Count) files, $($tsxLines + $tsLines) lines" -ForegroundColor Cyan

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Components: $componentCount" -ForegroundColor White
Write-Host "Pages: $pageCount" -ForegroundColor White
Write-Host "Hooks: $hookCount" -ForegroundColor White
Write-Host "Utils: $utilCount" -ForegroundColor White
Write-Host "Contexts: $contextCount" -ForegroundColor White
Write-Host "Types: $typeCount" -ForegroundColor White
Write-Host "Total TSX/TS Files: $($allTsxFiles.Count + $allTsFiles.Count)" -ForegroundColor White
Write-Host "Total Lines: $($tsxLines + $tsLines)" -ForegroundColor White
Write-Host ""
