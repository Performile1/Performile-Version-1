# ============================================================================
# TEST CHECKOUT ANALYTICS WITH REAL DATABASE IDs
# ============================================================================

$DOMAIN = "https://performile-platform-main.vercel.app"
$CRON_SECRET = "51f724279239aa9b9fde55d03dd84351c310f6b06468df6aaa50bd666486d7b2"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 1: Get Real IDs from Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please run this SQL in Supabase and paste the results:" -ForegroundColor Yellow
Write-Host ""
Write-Host "-- Get a merchant ID" -ForegroundColor Gray
Write-Host "SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 1;" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Get courier IDs" -ForegroundColor Gray
Write-Host "SELECT courier_id, courier_name FROM couriers WHERE is_active = true LIMIT 3;" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for merchant ID
$merchantId = Read-Host "Enter merchant_id (UUID)"
if (-not $merchantId) {
    Write-Host "❌ No merchant ID provided. Exiting." -ForegroundColor Red
    exit
}

# Prompt for courier IDs
$courier1Id = Read-Host "Enter first courier_id (UUID)"
$courier2Id = Read-Host "Enter second courier_id (UUID)"

if (-not $courier1Id -or -not $courier2Id) {
    Write-Host "❌ Need at least 2 courier IDs. Exiting." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Test APIs with Real Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# TEST 1: Log Courier Display
# ============================================================================

Write-Host "TEST 1: Log Courier Display" -ForegroundColor Yellow
Write-Host ""

$sessionId = "test_session_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

$displayPayload = @{
    checkout_session_id = $sessionId
    merchant_id = $merchantId
    couriers = @(
        @{
            courier_id = $courier1Id
            position_shown = 1
            trust_score = 4.5
            price = 89.00
            delivery_time_hours = 24
        },
        @{
            courier_id = $courier2Id
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
    Write-Host ""
    Write-Host "Session ID: $sessionId" -ForegroundColor Cyan
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
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
    Write-Host ""

    $selectionPayload = @{
        checkout_session_id = $sessionId
        selected_courier_id = $courier2Id
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
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# TEST 3: Verify in Database
# ============================================================================

Write-Host "STEP 3: Verify in Database" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this SQL in Supabase to verify:" -ForegroundColor Gray
Write-Host ""
Write-Host "SELECT * FROM checkout_courier_analytics" -ForegroundColor Cyan
Write-Host "WHERE checkout_session_id = '$sessionId'" -ForegroundColor Cyan
Write-Host "ORDER BY position_shown;" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected: 2 rows, one with was_selected = true" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# TEST 4: Trigger Cron Job
# ============================================================================

Write-Host "TEST 4: Trigger Ranking Update (Manual)" -ForegroundColor Yellow
Write-Host ""

$cronTest = Read-Host "Do you want to test the cron job? (y/n)"
if ($cronTest -eq 'y') {
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
        if ($_.ErrorDetails.Message) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "⚠️  If you get 401 Unauthorized:" -ForegroundColor Yellow
        Write-Host "1. Check CRON_SECRET in Vercel matches this script" -ForegroundColor Gray
        Write-Host "2. Redeploy after adding the secret" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
