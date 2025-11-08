#!/usr/bin/env pwsh
# End of Day Script - Updates CHANGELOG.md with today's work
# Usage: .\scripts\end-of-day.ps1
#
# This script:
# 1. Prompts for today's work summary
# 2. Updates CHANGELOG.md automatically
# 3. Shows preview and commit command
#
# Philosophy: One changelog, complete story, updated daily

$ErrorActionPreference = "Stop"

Write-Host "`n🌙 END OF DAY - CHANGELOG UPDATE`n" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Get today's date
$today = Get-Date -Format "MMMM d, yyyy (dddd)"
$todayShort = Get-Date -Format "yyyy-MM-dd"

Write-Host "📅 Date: $today" -ForegroundColor Yellow
Write-Host ""

# Prompt for today's work summary
Write-Host "📝 Quick Update (press Enter for defaults):" -ForegroundColor Green
Write-Host ""

$focus = Read-Host "Main focus today"
if ([string]::IsNullOrWhiteSpace($focus)) {
    Write-Host "❌ Focus is required!" -ForegroundColor Red
    exit 1
}

$status = Read-Host "Status (🟢/🟡/🔴) [default: 🟢]"
if ([string]::IsNullOrWhiteSpace($status)) { $status = "🟢" }

$hours = Read-Host "Hours worked [default: 8]"
if ([string]::IsNullOrWhiteSpace($hours)) { $hours = "8" }

Write-Host ""
Write-Host "✅ What did you complete today? (Enter each item, blank line to finish)" -ForegroundColor Green
$completed = @()
while ($true) {
    $item = Read-Host "  -"
    if ([string]::IsNullOrWhiteSpace($item)) { break }
    $completed += $item
}

Write-Host ""
Write-Host "📊 Quick Metrics:" -ForegroundColor Green
$tablesAdded = Read-Host "Tables added [0]"
if ([string]::IsNullOrWhiteSpace($tablesAdded)) { $tablesAdded = "0" }

$apisAdded = Read-Host "APIs added [0]"
if ([string]::IsNullOrWhiteSpace($apisAdded)) { $apisAdded = "0" }

$componentsAdded = Read-Host "Components added [0]"
if ([string]::IsNullOrWhiteSpace($componentsAdded)) { $componentsAdded = "0" }

$linesOfCode = Read-Host "Lines of code [~500]"
if ([string]::IsNullOrWhiteSpace($linesOfCode)) { $linesOfCode = "500" }

$commits = Read-Host "Commits [1]"
if ([string]::IsNullOrWhiteSpace($commits)) { $commits = "1" }

Write-Host ""
$filesChanged = Read-Host "Key files (comma-separated, optional)"

Write-Host ""
$nextSteps = Read-Host "What's next tomorrow"
if ([string]::IsNullOrWhiteSpace($nextSteps)) { $nextSteps = "Continue development" }

# Build the changelog entry
$changelogEntry = @"

### $today - $focus

**Focus:** $focus  
**Status:** $status  
**Time:** $hours hours

#### ✅ Completed

"@

foreach ($item in $completed) {
    $changelogEntry += "`n- $item"
}

if (![string]::IsNullOrWhiteSpace($filesChanged)) {
    $changelogEntry += @"

`n
**Files:**
"@
    $files = $filesChanged -split ','
    foreach ($file in $files) {
        $changelogEntry += "`n- ``$($file.Trim())``"
    }
}

$changelogEntry += @"

`n
**Metrics:**
- Tables: +$tablesAdded | APIs: +$apisAdded | Components: +$componentsAdded | Commits: $commits
- Lines of Code: ~$linesOfCode

**Next:** $nextSteps

---

"@

# Read current CHANGELOG.md
$changelogPath = "CHANGELOG.md"
if (!(Test-Path $changelogPath)) {
    Write-Host "❌ CHANGELOG.md not found!" -ForegroundColor Red
    exit 1
}

$changelogContent = Get-Content $changelogPath -Raw

# Find the "## 🔥 LATEST UPDATES" section and insert after it
$marker = "## 🔥 LATEST UPDATES"
$markerIndex = $changelogContent.IndexOf($marker)

if ($markerIndex -eq -1) {
    Write-Host "❌ Could not find '## 🔥 LATEST UPDATES' section!" -ForegroundColor Red
    exit 1
}

# Find the end of the marker line
$insertIndex = $changelogContent.IndexOf("`n", $markerIndex) + 1

# Insert the new entry
$newContent = $changelogContent.Substring(0, $insertIndex) + "`n" + $changelogEntry + $changelogContent.Substring($insertIndex)

# Write back to file
Set-Content -Path $changelogPath -Value $newContent -NoNewline

Write-Host ""
Write-Host "✅ CHANGELOG.md updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Entry preview:" -ForegroundColor Cyan
Write-Host $changelogEntry -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ready to commit:" -ForegroundColor Yellow
Write-Host "   git add CHANGELOG.md" -ForegroundColor White
Write-Host "   git commit -m 'EOD: $todayShort - $focus'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Review CHANGELOG.md to see the complete story!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌙 Good night! See you tomorrow! 👋" -ForegroundColor Cyan
Write-Host ""
