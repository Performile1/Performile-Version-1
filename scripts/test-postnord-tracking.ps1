# PostNord Tracking Integration Test Script
# Date: November 8, 2025
# Purpose: Test PostNord tracking APIs after rate limit reset

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "POSTNORD TRACKING INTEGRATION TESTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env.courier") {
    Get-Content ".env.courier" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Loaded .env.courier" -ForegroundColor Green
} else {
    Write-Host "❌ .env.courier not found!" -ForegroundColor Red
    exit 1
}

$API_KEY = $env:POSTNORD_API_KEY
if (-not $API_KEY) {
    Write-Host "❌ POSTNORD_API_KEY not set!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ API Key loaded: $($API_KEY.Substring(0,8))..." -ForegroundColor Green
Write-Host ""

# Test 1: Postal Code Search
Write-Host "Test 1: Postal Code Search" -ForegroundColor Yellow
Write-Host "Testing Swedish postal code: 11122" -ForegroundColor Gray

$url = "https://api2.postnord.com/rest/location/v2/address/search?apikey=$API_KEY&channel_id=performile&q=11122&country=SE"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "✅ Postal code search successful!" -ForegroundColor Green
    Write-Host "   Found $($response.addresses.Count) addresses" -ForegroundColor Gray
    if ($response.addresses.Count -gt 0) {
        $addr = $response.addresses[0]
        Write-Host "   First address: $($addr.streetName) $($addr.streetNumber), $($addr.city)" -ForegroundColor Gray
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 429) {
        Write-Host "⚠️  Rate limit still active (429)" -ForegroundColor Yellow
        Write-Host "   Wait ~1 hour and try again" -ForegroundColor Gray
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Track Shipment (example ID)
Write-Host "Test 2: Track Shipment" -ForegroundColor Yellow
Write-Host "Note: Using example shipment ID - replace with real ID" -ForegroundColor Gray

$trackingUrl = "https://api2.postnord.com/rest/shipment/v7/trackandtrace/findByIdentifier.json?apikey=$API_KEY&id=EXAMPLE123&locale=en"

try {
    $response = Invoke-RestMethod -Uri $trackingUrl -Method Get -ErrorAction Stop
    Write-Host "✅ Tracking API accessible!" -ForegroundColor Green
    Write-Host "   Response received" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 429) {
        Write-Host "⚠️  Rate limit still active (429)" -ForegroundColor Yellow
    } elseif ($statusCode -eq 404) {
        Write-Host "✅ API accessible (404 = shipment not found, which is expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error $statusCode : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 3: Tracking URL Generation
Write-Host "Test 3: Tracking URL Generation" -ForegroundColor Yellow
Write-Host "Note: Using example shipment ID" -ForegroundColor Gray

$urlGenUrl = "https://api2.postnord.com/rest/links/v1/shipment/tracking/url?apikey=$API_KEY&shipmentId=EXAMPLE123&countryCode=SE"

try {
    $response = Invoke-RestMethod -Uri $urlGenUrl -Method Get -ErrorAction Stop
    Write-Host "✅ Tracking URL API accessible!" -ForegroundColor Green
    Write-Host "   URL: $($response.url)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 429) {
        Write-Host "⚠️  Rate limit still active (429)" -ForegroundColor Yellow
    } elseif ($statusCode -eq 404) {
        Write-Host "✅ API accessible (404 = shipment not found, which is expected)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error $statusCode : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see 429 errors, wait ~1 hour and run again:" -ForegroundColor Yellow
Write-Host "  .\scripts\test-postnord-tracking.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run database migration" -ForegroundColor Gray
Write-Host "  2. Deploy to Vercel" -ForegroundColor Gray
Write-Host "  3. Test API endpoints" -ForegroundColor Gray
Write-Host ""
