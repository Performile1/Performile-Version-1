# ============================================================================
# PRICING API TEST SCRIPT
# Purpose: Test pricing API endpoints locally or on Vercel
# Date: November 19, 2025
# ============================================================================

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$CourierId = "",
    [switch]$Vercel
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

Write-Host "`n🧪 PRICING API TEST SUITE" -ForegroundColor $Cyan
Write-Host "========================`n" -ForegroundColor $Cyan

# Set base URL
if ($Vercel) {
    $BaseUrl = "https://performile-platform-main.vercel.app"
    Write-Host "🌐 Testing Vercel deployment: $BaseUrl`n" -ForegroundColor $Yellow
} else {
    Write-Host "🏠 Testing local server: $BaseUrl`n" -ForegroundColor $Yellow
}

# Function to make API request
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Endpoint,
        [hashtable]$Body
    )
    
    Write-Host "📋 Test: $Name" -ForegroundColor $Cyan
    Write-Host "   Endpoint: POST $Endpoint" -ForegroundColor Gray
    
    try {
        $jsonBody = $Body | ConvertTo-Json -Depth 10
        Write-Host "   Request: $jsonBody" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" `
            -Method Post `
            -ContentType "application/json" `
            -Body $jsonBody `
            -ErrorAction Stop
        
        Write-Host "   ✅ Success!" -ForegroundColor $Green
        Write-Host "   Response:" -ForegroundColor Gray
        Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "   ❌ Failed!" -ForegroundColor $Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor $Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor $Red
        }
        Write-Host ""
        return $false
    }
}

# Get courier ID if not provided
if (-not $CourierId) {
    Write-Host "⚠️  No courier_id provided. Using placeholder." -ForegroundColor $Yellow
    Write-Host "   To test with real courier: .\test-pricing-api.ps1 -CourierId 'your-uuid-here'`n" -ForegroundColor $Yellow
    $CourierId = "00000000-0000-0000-0000-000000000000"
}

# Test results
$results = @{
    Passed = 0
    Failed = 0
}

# ============================================================================
# TEST 1: Basic Calculation (Oslo to Oslo)
# ============================================================================

$test1 = Test-ApiEndpoint `
    -Name "Basic Calculation (Oslo to Oslo, 5kg, 50km)" `
    -Endpoint "/api/couriers/calculate-shipping-price" `
    -Body @{
        courier_id = $CourierId
        service_level = "standard"
        weight = 5.0
        distance = 50
        from_postal = "0150"
        to_postal = "0250"
        surcharges = @()
    }

if ($test1) { $results.Passed++ } else { $results.Failed++ }

# ============================================================================
# TEST 2: With Fuel Surcharge
# ============================================================================

$test2 = Test-ApiEndpoint `
    -Name "With Fuel Surcharge (8.5%)" `
    -Endpoint "/api/couriers/calculate-shipping-price" `
    -Body @{
        courier_id = $CourierId
        service_level = "standard"
        weight = 5.0
        distance = 50
        from_postal = "0150"
        to_postal = "0250"
        surcharges = @("fuel")
    }

if ($test2) { $results.Passed++ } else { $results.Failed++ }

# ============================================================================
# TEST 3: Express Service
# ============================================================================

$test3 = Test-ApiEndpoint `
    -Name "Express Service (Oslo to Bergen)" `
    -Endpoint "/api/couriers/calculate-shipping-price" `
    -Body @{
        courier_id = $CourierId
        service_level = "express"
        weight = 10.0
        distance = 150
        from_postal = "0150"
        to_postal = "5003"
        surcharges = @("fuel", "insurance")
    }

if ($test3) { $results.Passed++ } else { $results.Failed++ }

# ============================================================================
# TEST 4: Remote Area (Northern Norway)
# ============================================================================

$test4 = Test-ApiEndpoint `
    -Name "Remote Area (Oslo to Tromsø)" `
    -Endpoint "/api/couriers/calculate-shipping-price" `
    -Body @{
        courier_id = $CourierId
        service_level = "standard"
        weight = 15.0
        distance = 500
        from_postal = "0150"
        to_postal = "9000"
        surcharges = @("fuel")
    }

if ($test4) { $results.Passed++ } else { $results.Failed++ }

# ============================================================================
# TEST 5: Compare Prices (All Couriers)
# ============================================================================

$test5 = Test-ApiEndpoint `
    -Name "Compare Prices (All Couriers)" `
    -Endpoint "/api/couriers/compare-shipping-prices" `
    -Body @{
        service_level = "standard"
        weight = 5.0
        distance = 100
        from_postal = "0150"
        to_postal = "5003"
        surcharges = @("fuel")
    }

if ($test5) { $results.Passed++ } else { $results.Failed++ }

# ============================================================================
# TEST 6: Invalid Weight (Should Fail)
# ============================================================================

Write-Host "📋 Test: Invalid Weight (Should Fail)" -ForegroundColor $Cyan
Write-Host "   Endpoint: POST /api/couriers/calculate-shipping-price" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/couriers/calculate-shipping-price" `
        -Method Post `
        -ContentType "application/json" `
        -Body (@{
            courier_id = $CourierId
            service_level = "standard"
            weight = -5.0
            distance = 50
            from_postal = "0150"
            to_postal = "0250"
        } | ConvertTo-Json) `
        -ErrorAction Stop
    
    Write-Host "   ❌ Test Failed - Should have returned error!" -ForegroundColor $Red
    $results.Failed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Correctly rejected invalid weight!" -ForegroundColor $Green
        $results.Passed++
    } else {
        Write-Host "   ❌ Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor $Red
        $results.Failed++
    }
}
Write-Host ""

# ============================================================================
# TEST 7: Invalid Service Level (Should Fail)
# ============================================================================

Write-Host "📋 Test: Invalid Service Level (Should Fail)" -ForegroundColor $Cyan
Write-Host "   Endpoint: POST /api/couriers/calculate-shipping-price" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/couriers/calculate-shipping-price" `
        -Method Post `
        -ContentType "application/json" `
        -Body (@{
            courier_id = $CourierId
            service_level = "super_fast"
            weight = 5.0
            distance = 50
            from_postal = "0150"
            to_postal = "0250"
        } | ConvertTo-Json) `
        -ErrorAction Stop
    
    Write-Host "   ❌ Test Failed - Should have returned error!" -ForegroundColor $Red
    $results.Failed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Correctly rejected invalid service level!" -ForegroundColor $Green
        $results.Passed++
    } else {
        Write-Host "   ❌ Wrong error code: $($_.Exception.Response.StatusCode)" -ForegroundColor $Red
        $results.Failed++
    }
}
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "`n📊 TEST SUMMARY" -ForegroundColor $Cyan
Write-Host "===============`n" -ForegroundColor $Cyan

$total = $results.Passed + $results.Failed
$passRate = if ($total -gt 0) { [math]::Round(($results.Passed / $total) * 100, 1) } else { 0 }

Write-Host "Total Tests: $total" -ForegroundColor $Cyan
Write-Host "✅ Passed: $($results.Passed)" -ForegroundColor $Green
Write-Host "❌ Failed: $($results.Failed)" -ForegroundColor $Red
Write-Host "Pass Rate: $passRate%`n" -ForegroundColor $(if ($passRate -ge 80) { $Green } elseif ($passRate -ge 50) { $Yellow } else { $Red })

if ($results.Failed -eq 0) {
    Write-Host "🎉 All tests passed! Pricing API is working correctly.`n" -ForegroundColor $Green
} elseif ($results.Passed -gt $results.Failed) {
    Write-Host "⚠️  Some tests failed. Review errors above.`n" -ForegroundColor $Yellow
} else {
    Write-Host "❌ Most tests failed. Check API deployment and database.`n" -ForegroundColor $Red
}

# ============================================================================
# NEXT STEPS
# ============================================================================

Write-Host "📋 NEXT STEPS:" -ForegroundColor $Cyan
Write-Host "1. If tests failed, check:" -ForegroundColor Gray
Write-Host "   - Supabase pricing tables deployed" -ForegroundColor Gray
Write-Host "   - Pricing function deployed" -ForegroundColor Gray
Write-Host "   - API endpoints deployed to Vercel" -ForegroundColor Gray
Write-Host "   - Sample data exists for courier" -ForegroundColor Gray
Write-Host "2. To test with real courier:" -ForegroundColor Gray
Write-Host "   .\test-pricing-api.ps1 -CourierId 'your-uuid-here'" -ForegroundColor Gray
Write-Host "3. To test Vercel deployment:" -ForegroundColor Gray
Write-Host "   .\test-pricing-api.ps1 -Vercel -CourierId 'your-uuid-here'`n" -ForegroundColor Gray

# Exit with appropriate code
exit $(if ($results.Failed -eq 0) { 0 } else { 1 })
