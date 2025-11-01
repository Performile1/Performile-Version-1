# ORGANIZE ROOT DOCUMENTATION FILES INTO DATE-NAMED FOLDERS
# Date: November 1, 2025
# Purpose: Move all root .md files into appropriate date-named folders in docs/

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "ORGANIZE ROOT DOCUMENTATION FILES" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = "c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main"
$docsPath = "$rootPath\docs"

# Get all .md files in root (excluding specific files)
$excludeFiles = @(
    "README.md",
    "CHANGELOG.md",
    "SPEC_DRIVEN_FRAMEWORK.md"
)

Write-Host "Scanning for .md files in root directory..." -ForegroundColor Yellow
$mdFiles = Get-ChildItem -Path $rootPath -Filter "*.md" | Where-Object { 
    $excludeFiles -notcontains $_.Name 
}

Write-Host "Found $($mdFiles.Count) files to organize" -ForegroundColor Green
Write-Host ""

if ($mdFiles.Count -eq 0) {
    Write-Host "No files to organize. Exiting." -ForegroundColor Green
    exit
}

# Group files by creation date
$filesByDate = @{}
foreach ($file in $mdFiles) {
    $creationDate = $file.CreationTime.ToString("yyyy-MM-dd")
    if (-not $filesByDate.ContainsKey($creationDate)) {
        $filesByDate[$creationDate] = @()
    }
    $filesByDate[$creationDate] += $file
}

Write-Host "Files grouped by creation date:" -ForegroundColor Cyan
foreach ($date in $filesByDate.Keys | Sort-Object) {
    Write-Host "  $date : $($filesByDate[$date].Count) files" -ForegroundColor White
}
Write-Host ""

# Confirm before proceeding
$confirmation = Read-Host "Do you want to proceed with organizing these files? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Organization cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting organization..." -ForegroundColor Green
Write-Host ""

$totalMoved = 0
$errors = @()

foreach ($date in $filesByDate.Keys | Sort-Object) {
    $targetFolder = "$docsPath\archive\root-docs-$date"
    
    # Create target folder if it doesn't exist
    if (-not (Test-Path $targetFolder)) {
        New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
        Write-Host "Created folder: archive\root-docs-$date" -ForegroundColor Green
    }
    
    # Move files
    foreach ($file in $filesByDate[$date]) {
        try {
            $targetPath = "$targetFolder\$($file.Name)"
            
            # Check if file already exists in target
            if (Test-Path $targetPath) {
                Write-Host "  ⚠ Skipped: $($file.Name) (already exists in target)" -ForegroundColor Yellow
                continue
            }
            
            Move-Item -Path $file.FullName -Destination $targetPath -Force
            Write-Host "  ✓ Moved: $($file.Name) → archive\root-docs-$date\" -ForegroundColor Green
            $totalMoved++
        }
        catch {
            $errorMsg = "Failed to move $($file.Name): $($_.Exception.Message)"
            $errors += $errorMsg
            Write-Host "  ✗ Error: $($file.Name)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "ORGANIZATION COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  - Files moved: $totalMoved" -ForegroundColor Green
Write-Host "  - Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "Errors encountered:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Files organized into:" -ForegroundColor White
foreach ($date in $filesByDate.Keys | Sort-Object) {
    Write-Host "  docs\archive\root-docs-$date\" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review the organized files" -ForegroundColor White
Write-Host "  2. Commit changes: git add . && git commit -m 'docs: Organize root files into date folders'" -ForegroundColor White
Write-Host "  3. Push to GitHub: git push" -ForegroundColor White
Write-Host ""
Write-Host "All files preserved in git history!" -ForegroundColor Green
Write-Host ""
