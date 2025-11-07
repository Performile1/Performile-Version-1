# ============================================================================
# ANALYTICS DASHBOARD PLAYWRIGHT TEST RUNNER
# ============================================================================
# Purpose: Run Playwright tests for Analytics Dashboard features
# Created: November 7, 2025 - Week 2 Day 5
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  ANALYTICS DASHBOARD E2E TESTS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Test options
Write-Host "Select test mode:" -ForegroundColor Yellow
Write-Host "1. Run all tests (headless)" -ForegroundColor White
Write-Host "2. Run all tests (headed - see browser)" -ForegroundColor White
Write-Host "3. Run specific test suite" -ForegroundColor White
Write-Host "4. Run in UI mode (interactive)" -ForegroundColor White
Write-Host "5. Run in debug mode" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`nRunning all tests (headless)..." -ForegroundColor Green
        npx playwright test tests/e2e/analytics-dashboard.spec.ts
    }
    "2" {
        Write-Host "`nRunning all tests (headed)..." -ForegroundColor Green
        npx playwright test tests/e2e/analytics-dashboard.spec.ts --headed
    }
    "3" {
        Write-Host "`nAvailable test suites:" -ForegroundColor Yellow
        Write-Host "1. Available Markets List" -ForegroundColor White
        Write-Host "2. Market Selection & Filtering" -ForegroundColor White
        Write-Host "3. Performance by Location - Table View" -ForegroundColor White
        Write-Host "4. Heatmap View" -ForegroundColor White
        Write-Host "5. Filters & Interactions" -ForegroundColor White
        Write-Host "6. Mobile Responsive" -ForegroundColor White
        Write-Host "7. Error Handling" -ForegroundColor White
        Write-Host "8. Performance" -ForegroundColor White
        Write-Host ""
        
        $suite = Read-Host "Enter suite number (1-8)"
        
        $suiteNames = @{
            "1" = "Available Markets List"
            "2" = "Market Selection & Filtering"
            "3" = "Performance by Location - Table View"
            "4" = "Heatmap View"
            "5" = "Filters & Interactions"
            "6" = "Mobile Responsive"
            "7" = "Error Handling"
            "8" = "Performance"
        }
        
        $suiteName = $suiteNames[$suite]
        Write-Host "`nRunning test suite: $suiteName..." -ForegroundColor Green
        npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "$suiteName"
    }
    "4" {
        Write-Host "`nLaunching UI mode..." -ForegroundColor Green
        npx playwright test tests/e2e/analytics-dashboard.spec.ts --ui
    }
    "5" {
        Write-Host "`nLaunching debug mode..." -ForegroundColor Green
        npx playwright test tests/e2e/analytics-dashboard.spec.ts --debug
    }
    default {
        Write-Host "`nInvalid choice. Running all tests (headless)..." -ForegroundColor Yellow
        npx playwright test tests/e2e/analytics-dashboard.spec.ts
    }
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  TEST RUN COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View HTML report: npx playwright show-report" -ForegroundColor Yellow
Write-Host ""
