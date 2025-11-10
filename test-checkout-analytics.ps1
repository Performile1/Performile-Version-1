# ============================================================================
# TEST CHECKOUT ANALYTICS APIs
# ============================================================================
# Quick test script for the checkout analytics endpoints
# ============================================================================

$DOMAIN = "https://performile-platform-main.vercel.app"
$CRON_SECRET = "51f724279239aa9b9fde55d03dd84351c310f6b06468df6aaa50bd666486d7b2"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CHECKOUT ANALYTICS - API TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# TEST 1: Log Courier Display
# ============================================================================

Write-Host "TEST 1: Log Courier Display" -ForegroundColor Yellow
Write-Host "Endpoint: POST /api/checkout/log-courier-display" -ForegroundColor Gray
Write-Host ""

$displayPayload = @{
    checkout_session_id = "test_session_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    merchant_id = "123e4567-e89b-12d3-a456-426614174000"
    couriers = @(
        @{
            courier_id = "courier1-uuid-test"
            position_shown = 1
            trust_score = 4.5
            price = 89.00
            delivery_time_hours = 24
        },
        @{
            courier_id = "courier2-uuid-test"
            position_shown = 2
            trust_score = 4.2
            price = 79.00
            delivery_time_hours = 48
        }
    )
    order_context = @{
        order_value = 1250.00
        items_count = 3
        package_weight_kg = 5.0
    }
    delivery_location = @{
        postal_code = "0150"
        city = "Oslo"
        country = "NO"
    }
} | ConvertTo-Json -Depth 10

try {
    $response1 = Invoke-RestMethod -Uri "$DOMAIN/api/checkout/log-courier-display" `
        -Method POST `
        -ContentType "application/json" `
        -Body $displayPayload
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response1 | ConvertTo-Json -Depth 5 | Write-Host
    $sessionId = $response1.checkout_session_id
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $sessionId = $null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# TEST 2: Log Courier Selection
# ============================================================================

if ($sessionId) {
    Write-Host "TEST 2: Log Courier Selection" -ForegroundColor Yellow
    Write-Host "Endpoint: POST /api/checkout/log-courier-selection" -ForegroundColor Gray
    Write-Host ""

    $selectionPayload = @{
        checkout_session_id = $sessionId
        selected_courier_id = "courier2-uuid-test"
    } | ConvertTo-Json

    try {
        $response2 = Invoke-RestMethod -Uri "$DOMAIN/api/checkout/log-courier-selection" `
            -Method POST `
            -ContentType "application/json" `
            -Body $selectionPayload
        
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Gray
        $response2 | ConvertTo-Json -Depth 5 | Write-Host
    } catch {
        Write-Host "❌ FAILED!" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# TEST 3: Trigger Cron Job (Manual)
# ============================================================================

Write-Host "TEST 3: Trigger Ranking Update (Cron)" -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/cron/update-rankings" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $CRON_SECRET"
    }
    
    $response3 = Invoke-RestMethod -Uri "$DOMAIN/api/cron/update-rankings" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response3 | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Supabase for test data in checkout_courier_analytics" -ForegroundColor Gray
Write-Host "2. Check courier_ranking_scores for updated rankings" -ForegroundColor Gray
Write-Host "3. Check courier_ranking_history for today's snapshot" -ForegroundColor Gray
Write-Host ""
