# ============================================================================
# OPEN PLAYWRIGHT TEST USERS SQL FILE
# ============================================================================
# Purpose: Quick script to open the test users SQL file
# Date: October 23, 2025, 10:52 AM
# ============================================================================

Write-Host ""
Write-Host "🎭 PLAYWRIGHT TEST USERS SETUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main\database\CREATE_PLAYWRIGHT_TEST_USERS.sql"

if (Test-Path $sqlFile) {
    Write-Host "✅ Found SQL file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "   1. Copy the entire SQL file content" -ForegroundColor White
    Write-Host "   2. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "   3. Paste and click RUN ▶️" -ForegroundColor White
    Write-Host "   4. Wait for success message" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 TEST CREDENTIALS:" -ForegroundColor Yellow
    Write-Host "   Merchant: test-merchant@performile.com / TestPassword123!" -ForegroundColor White
    Write-Host "   Courier:  test-courier@performile.com / TestPassword123!" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening file in 3 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
    
    # Open in default text editor
    Start-Process $sqlFile
    
    Write-Host ""
    Write-Host "✅ File opened!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ SQL file not found!" -ForegroundColor Red
    Write-Host "   Expected: $sqlFile" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
