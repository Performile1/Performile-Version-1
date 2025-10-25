# Commit and Push Changes
# Date: October 24, 2025

Write-Host "🚀 Committing changes..." -ForegroundColor Cyan

# Commit the changes
git commit -m "Fix: Add service-performance route redirect and remove red badge from 404 page

- Added /service-performance route that redirects to /settings#analytics
- Added /admin/service-analytics route that redirects to /settings#analytics  
- Removed confusing red X badge from 404 page
- Cleaned up unused Close icon import"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Pushing to remote..." -ForegroundColor Cyan
    
    # Push to remote
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Changes deployed to GitHub!" -ForegroundColor Green
        Write-Host "   Vercel will auto-deploy in ~2-3 minutes" -ForegroundColor Gray
    } else {
        Write-Host "❌ Push failed!" -ForegroundColor Red
        Write-Host "   Please check your connection and try again" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    Write-Host "   Please check the error message above" -ForegroundColor Gray
}

Write-Host ""
