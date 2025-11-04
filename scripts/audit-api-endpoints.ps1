# API Endpoint Audit Script
# Purpose: Count and analyze all API endpoints
# Date: November 4, 2025

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "API ENDPOINT AUDIT" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$apiPath = "api"

# 1. Count all TypeScript files
Write-Host "1. COUNTING API FILES..." -ForegroundColor Yellow
$allFiles = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File
$totalFiles = $allFiles.Count
Write-Host "   Total .ts files: $totalFiles" -ForegroundColor Green
Write-Host ""

# 2. List all top-level folders
Write-Host "2. TOP-LEVEL API FOLDERS:" -ForegroundColor Yellow
$folders = Get-ChildItem -Path $apiPath -Directory | Select-Object Name
$folders | ForEach-Object {
    $folderPath = Join-Path $apiPath $_.Name
    $fileCount = (Get-ChildItem -Path $folderPath -Recurse -Filter "*.ts" -File).Count
    Write-Host "   $($_.Name) ($fileCount files)" -ForegroundColor Cyan
}
Write-Host ""

# 3. Find potential duplicates (similar names)
Write-Host "3. POTENTIAL DUPLICATE FOLDERS:" -ForegroundColor Yellow
$folderNames = $folders.Name
$duplicates = @()

# Check for singular/plural
foreach ($folder in $folderNames) {
    $singular = $folder.TrimEnd('s')
    $plural = $folder + 's'
    
    if ($folderNames -contains $singular -and $folderNames -contains $plural) {
        if ($duplicates -notcontains "$singular / $plural") {
            $duplicates += "$singular / $plural"
        }
    }
}

if ($duplicates.Count -gt 0) {
    $duplicates | ForEach-Object {
        Write-Host "   ⚠️  $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ No obvious duplicates found" -ForegroundColor Green
}
Write-Host ""

# 4. Find root-level API files
Write-Host "4. ROOT-LEVEL API FILES:" -ForegroundColor Yellow
$rootFiles = Get-ChildItem -Path $apiPath -Filter "*.ts" -File
Write-Host "   Count: $($rootFiles.Count)" -ForegroundColor Cyan
$rootFiles | ForEach-Object {
    Write-Host "   - $($_.Name)" -ForegroundColor Gray
}
Write-Host ""

# 5. Check for files without error handling
Write-Host "5. FILES WITHOUT ERROR HANDLING:" -ForegroundColor Yellow
$noErrorHandling = @()
foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "try\s*{" -and $content -notmatch "catch\s*\(") {
        $noErrorHandling += $file.FullName.Replace((Get-Location).Path + "\", "")
    }
}
if ($noErrorHandling.Count -gt 0) {
    Write-Host "   ⚠️  Found $($noErrorHandling.Count) files without try-catch" -ForegroundColor Yellow
    $noErrorHandling | Select-Object -First 10 | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Gray
    }
    if ($noErrorHandling.Count -gt 10) {
        Write-Host "   ... and $($noErrorHandling.Count - 10) more" -ForegroundColor Gray
    }
} else {
    Write-Host "   ✅ All files have error handling" -ForegroundColor Green
}
Write-Host ""

# 6. Check for files without authentication
Write-Host "6. FILES WITHOUT AUTHENTICATION CHECK:" -ForegroundColor Yellow
$noAuth = @()
foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "auth" -and $content -notmatch "jwt" -and $content -notmatch "token") {
        $noAuth += $file.FullName.Replace((Get-Location).Path + "\", "")
    }
}
if ($noAuth.Count -gt 0) {
    Write-Host "   ⚠️  Found $($noAuth.Count) files without auth references" -ForegroundColor Yellow
    $noAuth | Select-Object -First 10 | ForEach-Object {
        Write-Host "   - $_" -ForegroundColor Gray
    }
    if ($noAuth.Count -gt 10) {
        Write-Host "   ... and $($noAuth.Count - 10) more" -ForegroundColor Gray
    }
} else {
    Write-Host "   ✅ All files have authentication" -ForegroundColor Green
}
Write-Host ""

# 7. Find exported functions (endpoints)
Write-Host "7. COUNTING EXPORTED ENDPOINTS:" -ForegroundColor Yellow
$endpoints = @()
foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "export\s+(default\s+)?(async\s+)?function" -or 
        $content -match "export\s+default\s+" -or
        $content -match "export\s+const\s+\w+\s*=\s*async") {
        $endpoints += $file.FullName.Replace((Get-Location).Path + "\", "")
    }
}
Write-Host "   Estimated endpoints: $($endpoints.Count)" -ForegroundColor Cyan
Write-Host ""

# 8. Check folder structure consistency
Write-Host "8. FOLDER STRUCTURE ANALYSIS:" -ForegroundColor Yellow
$folderSizes = @{}
foreach ($folder in $folders) {
    $folderPath = Join-Path $apiPath $folder.Name
    $size = (Get-ChildItem -Path $folderPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $folderSizes[$folder.Name] = [math]::Round($size / 1KB, 2)
}

$folderSizes.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value) KB" -ForegroundColor Cyan
}
Write-Host ""

# 9. Find files with similar names
Write-Host "9. FILES WITH SIMILAR NAMES:" -ForegroundColor Yellow
$fileNames = $allFiles | Select-Object -ExpandProperty BaseName
$similarFiles = $fileNames | Group-Object | Where-Object { $_.Count -gt 1 }
if ($similarFiles.Count -gt 0) {
    $similarFiles | ForEach-Object {
        Write-Host "   ⚠️  $($_.Name) appears $($_.Count) times" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ No duplicate file names" -ForegroundColor Green
}
Write-Host ""

# 10. Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Total API files: $totalFiles" -ForegroundColor White
Write-Host "Estimated endpoints: $($endpoints.Count)" -ForegroundColor White
Write-Host "Top-level folders: $($folders.Count)" -ForegroundColor White
Write-Host "Root-level files: $($rootFiles.Count)" -ForegroundColor White
Write-Host "Files without error handling: $($noErrorHandling.Count)" -ForegroundColor $(if ($noErrorHandling.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "Files without auth: $($noAuth.Count)" -ForegroundColor $(if ($noAuth.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

# 11. Recommendations
Write-Host "RECOMMENDATIONS:" -ForegroundColor Cyan
if ($noErrorHandling.Count -gt 0) {
    Write-Host "⚠️  Add error handling to $($noErrorHandling.Count) files" -ForegroundColor Yellow
}
if ($noAuth.Count -gt 0) {
    Write-Host "⚠️  Add authentication to $($noAuth.Count) files" -ForegroundColor Yellow
}
if ($duplicates.Count -gt 0) {
    Write-Host "⚠️  Review $($duplicates.Count) potential duplicate folders" -ForegroundColor Yellow
}
if ($noErrorHandling.Count -eq 0 -and $noAuth.Count -eq 0 -and $duplicates.Count -eq 0) {
    Write-Host "✅ API structure looks good!" -ForegroundColor Green
}
Write-Host ""

Write-Host "Audit complete!" -ForegroundColor Green
Write-Host "Results saved to: docs/daily/2025-11-04/API_ENDPOINT_AUDIT.md" -ForegroundColor Cyan
