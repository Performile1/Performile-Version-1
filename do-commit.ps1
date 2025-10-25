#!/usr/bin/env pwsh
# Commit script for critical fixes

$commitMessage = @"
Fix critical bugs: claims API, routing, and 404 page

- Remove duplicate WHERE clause in claims API (fixes 500 error)
- Add service-performance route redirects
- Remove confusing red badge from 404 page
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Ready to push. Run: git push" -ForegroundColor Cyan
} else {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
}
