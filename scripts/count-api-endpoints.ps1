# ============================================================================
# API ENDPOINT COUNTER - November 4, 2025, 7:13 PM
# ============================================================================
# Purpose: Count all API endpoints and serverless functions
# ============================================================================

Write-Host "=== API ENDPOINT AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# Base path
$apiPath = "api"

# ============================================================================
# 1. COUNT ALL API FILES
# ============================================================================

Write-Host "1. API FILES:" -ForegroundColor Yellow

$allApiFiles = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue
$apiFileCount = $allApiFiles.Count

Write-Host "   Total API Files: $apiFileCount" -ForegroundColor Green

# ============================================================================
# 2. COUNT BY DIRECTORY
# ============================================================================

Write-Host ""
Write-Host "2. API FILES BY DIRECTORY:" -ForegroundColor Yellow

$apiByDir = $allApiFiles | Group-Object { Split-Path $_.DirectoryName -Leaf } | Sort-Object Count -Descending
foreach ($dir in $apiByDir) {
    Write-Host "   - $($dir.Name): $($dir.Count)" -ForegroundColor Gray
}

# ============================================================================
# 3. LIST ALL API ENDPOINTS
# ============================================================================

Write-Host ""
Write-Host "3. ALL API ENDPOINTS:" -ForegroundColor Yellow

foreach ($file in $allApiFiles | Sort-Object FullName) {
    $relativePath = $file.FullName -replace [regex]::Escape($PWD.Path + "\api\"), ""
    $endpoint = "/" + ($relativePath -replace "\\", "/" -replace "\.ts$", "")
    Write-Host "   - $endpoint" -ForegroundColor Gray
}

# ============================================================================
# 4. COUNT HTTP METHODS
# ============================================================================

Write-Host ""
Write-Host "4. HTTP METHODS ANALYSIS:" -ForegroundColor Yellow

$getMethods = 0
$postMethods = 0
$putMethods = 0
$deleteMethods = 0
$patchMethods = 0

foreach ($file in $allApiFiles) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match "req\.method\s*===\s*['\`"]GET['\`"]" -or $content -match "case\s+['\`"]GET['\`"]") { $getMethods++ }
    if ($content -match "req\.method\s*===\s*['\`"]POST['\`"]" -or $content -match "case\s+['\`"]POST['\`"]") { $postMethods++ }
    if ($content -match "req\.method\s*===\s*['\`"]PUT['\`"]" -or $content -match "case\s+['\`"]PUT['\`"]") { $putMethods++ }
    if ($content -match "req\.method\s*===\s*['\`"]DELETE['\`"]" -or $content -match "case\s+['\`"]DELETE['\`"]") { $deleteMethods++ }
    if ($content -match "req\.method\s*===\s*['\`"]PATCH['\`"]" -or $content -match "case\s+['\`"]PATCH['\`"]") { $patchMethods++ }
}

Write-Host "   GET: $getMethods" -ForegroundColor Green
Write-Host "   POST: $postMethods" -ForegroundColor Green
Write-Host "   PUT: $putMethods" -ForegroundColor Green
Write-Host "   DELETE: $deleteMethods" -ForegroundColor Green
Write-Host "   PATCH: $patchMethods" -ForegroundColor Green

# ============================================================================
# 5. LINES OF CODE
# ============================================================================

Write-Host ""
Write-Host "5. LINES OF CODE:" -ForegroundColor Yellow

$totalLines = ($allApiFiles | Get-Content | Measure-Object -Line).Lines

Write-Host "   Total API Files: $apiFileCount" -ForegroundColor Green
Write-Host "   Total Lines: $totalLines" -ForegroundColor Green
Write-Host "   Average Lines per File: $([math]::Round($totalLines / $apiFileCount, 0))" -ForegroundColor Green

# ============================================================================
# 6. LARGEST API FILES
# ============================================================================

Write-Host ""
Write-Host "6. LARGEST API FILES (Top 10):" -ForegroundColor Yellow

$filesBySize = $allApiFiles | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    [PSCustomObject]@{
        Name = $_.Name
        Lines = $lines
        Path = $_.FullName -replace [regex]::Escape($PWD.Path + "\"), ""
    }
} | Sort-Object Lines -Descending | Select-Object -First 10

foreach ($file in $filesBySize) {
    Write-Host "   - $($file.Name): $($file.Lines) lines" -ForegroundColor Gray
}

# ============================================================================
# 7. API CATEGORIES
# ============================================================================

Write-Host ""
Write-Host "7. API CATEGORIES:" -ForegroundColor Yellow

$categories = @{}
foreach ($file in $allApiFiles) {
    $category = Split-Path (Split-Path $file.DirectoryName -Parent) -Leaf
    if ($category -eq "api") {
        $category = Split-Path $file.DirectoryName -Leaf
    }
    
    if (-not $categories.ContainsKey($category)) {
        $categories[$category] = 0
    }
    $categories[$category]++
}

$categories.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host "   - $($_.Key): $($_.Value)" -ForegroundColor Gray
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total API Files: $apiFileCount" -ForegroundColor White
Write-Host "Total Lines: $totalLines" -ForegroundColor White
Write-Host "GET Endpoints: $getMethods" -ForegroundColor White
Write-Host "POST Endpoints: $postMethods" -ForegroundColor White
Write-Host "PUT Endpoints: $putMethods" -ForegroundColor White
Write-Host "DELETE Endpoints: $deleteMethods" -ForegroundColor White
Write-Host "PATCH Endpoints: $patchMethods" -ForegroundColor White
Write-Host "Total HTTP Methods: $($getMethods + $postMethods + $putMethods + $deleteMethods + $patchMethods)" -ForegroundColor Cyan
Write-Host ""
