# =====================================================
# PERFORMILE CODEBASE AUDIT SCRIPT
# =====================================================
# Automatically scans codebase for database-related code
# =====================================================

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "audit-report-$timestamp.md"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "PERFORMILE CODEBASE AUDIT" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Define all 49 tables
$tables = @(
    "users", "couriers", "stores", "orders", "reviews",
    "subscription_plans", "user_subscriptions", "merchantshops",
    "servicetypes", "orderservicetype", "courier_api_credentials",
    "courierdocuments", "courier_analytics", "trustscorecache",
    "merchantcouriercheckout", "delivery_requests", "delivery_proof",
    "tracking_data", "tracking_events", "tracking_subscriptions",
    "tracking_api_logs", "ratinglinks", "merchant_couriers",
    "reviewrequests", "reviewrequestresponses", "reviewrequestsettings",
    "review_reminders", "conversations", "messages",
    "conversationparticipants", "messagereadreceipts", "messagereactions",
    "notificationpreferences", "ecommerce_integrations", "shopintegrations",
    "email_templates", "leadsmarketplace", "leaddownloads",
    "shopanalyticssnapshots", "marketsharesnapshots", "platform_analytics",
    "usage_logs", "subscription_plan_changes", "subscription_cancellations",
    "paymenthistory", "team_invitations", "user_sessions", "postal_codes",
    "spatial_ref_sys"
)

$report = @"
# PERFORMILE CODEBASE AUDIT REPORT
Generated: $(Get-Date)

---

## SUMMARY

"@

Write-Host "Scanning codebase..." -ForegroundColor Yellow
Write-Host ""

# Initialize counters
$apiEndpointsFound = 0
$frontendComponentsFound = 0
$modelsFound = 0

# Check for API endpoints
Write-Host "1. Checking API endpoints..." -ForegroundColor Cyan
$report += "`n## API ENDPOINTS`n`n"

foreach ($table in $tables) {
    $searchPatterns = @(
        "api/$table",
        "api/${table}s",
        "/api/$table",
        "/api/${table}s",
        "route('$table",
        "router.get('/$table",
        "router.post('/$table"
    )
    
    $found = $false
    foreach ($pattern in $searchPatterns) {
        $results = Get-ChildItem -Path . -Recurse -Include *.js,*.ts,*.jsx,*.tsx -ErrorAction SilentlyContinue | 
                   Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
        
        if ($results) {
            $found = $true
            break
        }
    }
    
    if ($found) {
        $report += "- ✅ **$table**: API endpoint found`n"
        $apiEndpointsFound++
        Write-Host "  ✓ $table" -ForegroundColor Green
    } else {
        $report += "- ❌ **$table**: No API endpoint found`n"
        Write-Host "  ✗ $table" -ForegroundColor Red
    }
}

# Check for frontend components
Write-Host "`n2. Checking frontend components..." -ForegroundColor Cyan
$report += "`n## FRONTEND COMPONENTS`n`n"

$componentPatterns = @(
    "User", "Courier", "Store", "Order", "Review",
    "Subscription", "Tracking", "Message", "Conversation",
    "Analytics", "Integration", "Lead", "Payment"
)

foreach ($pattern in $componentPatterns) {
    $results = Get-ChildItem -Path . -Recurse -Include *.jsx,*.tsx,*.vue -ErrorAction SilentlyContinue | 
               Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
    
    if ($results) {
        $report += "- ✅ **${pattern}**: Component found`n"
        $frontendComponentsFound++
        Write-Host "  ✓ $pattern" -ForegroundColor Green
    } else {
        $report += "- ❌ **${pattern}**: No component found`n"
        Write-Host "  ✗ $pattern" -ForegroundColor Red
    }
}

# Check for database models/queries
Write-Host "`n3. Checking database models..." -ForegroundColor Cyan
$report += "`n## DATABASE MODELS/QUERIES`n`n"

foreach ($table in $tables) {
    $searchPatterns = @(
        "FROM $table",
        "from('$table')",
        "table('$table')",
        "model $table",
        "class $table"
    )
    
    $found = $false
    foreach ($pattern in $searchPatterns) {
        $results = Get-ChildItem -Path . -Recurse -Include *.js,*.ts,*.sql -ErrorAction SilentlyContinue | 
                   Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
        
        if ($results) {
            $found = $true
            break
        }
    }
    
    if ($found) {
        $report += "- ✅ **$table**: Model/query found`n"
        $modelsFound++
    } else {
        $report += "- ❌ **$table**: No model/query found`n"
    }
}

# Check for specific features
Write-Host "`n4. Checking specific features..." -ForegroundColor Cyan
$report += "`n## SPECIFIC FEATURES`n`n"

$features = @{
    "Tracking System" = @("tracking", "trackingData", "trackingEvents")
    "Review Automation" = @("reviewRequest", "ratingLink", "reviewReminder")
    "Messaging System" = @("conversation", "message", "chat")
    "Analytics" = @("analytics", "metrics", "dashboard")
    "Subscriptions" = @("subscription", "plan", "stripe")
    "Integrations" = @("shopify", "woocommerce", "integration")
    "Lead Marketplace" = @("lead", "marketplace", "leadDownload")
}

foreach ($feature in $features.Keys) {
    $patterns = $features[$feature]
    $found = $false
    
    foreach ($pattern in $patterns) {
        $results = Get-ChildItem -Path . -Recurse -Include *.js,*.ts,*.jsx,*.tsx -ErrorAction SilentlyContinue | 
                   Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
        
        if ($results) {
            $found = $true
            break
        }
    }
    
    if ($found) {
        $report += "- ✅ **$feature**: Implementation found`n"
        Write-Host "  ✓ $feature" -ForegroundColor Green
    } else {
        $report += "- ❌ **$feature**: No implementation found`n"
        Write-Host "  ✗ $feature" -ForegroundColor Red
    }
}

# Generate summary statistics
$totalTables = $tables.Count
$apiCoverage = [math]::Round(($apiEndpointsFound / $totalTables) * 100, 2)
$modelCoverage = [math]::Round(($modelsFound / $totalTables) * 100, 2)

$report += @"

---

## STATISTICS

**Total Tables:** $totalTables
**API Endpoints Found:** $apiEndpointsFound / $totalTables ($apiCoverage%)
**Frontend Components Found:** $frontendComponentsFound / $($componentPatterns.Count)
**Database Models Found:** $modelsFound / $totalTables ($modelCoverage%)

---

## RECOMMENDATIONS

### HIGH PRIORITY (Missing Critical Features)

"@

# Add recommendations based on findings
if ($apiEndpointsFound -lt ($totalTables * 0.5)) {
    $report += "`n- ⚠️ Less than 50% of tables have API endpoints - prioritize API development"
}

if ($modelsFound -lt ($totalTables * 0.5)) {
    $report += "`n- ⚠️ Less than 50% of tables have models/queries - implement database layer"
}

$report += @"

### NEXT STEPS

1. Review this report and prioritize missing features
2. Create implementation tickets for critical gaps
3. Update DATABASE_CODE_AUDIT.md with findings
4. Plan sprints to address high-priority items

---

**Report generated:** $(Get-Date)
"@

# Save report
$report | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "AUDIT COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Report saved to: $reportFile" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  API Coverage: $apiCoverage%" -ForegroundColor $(if ($apiCoverage -gt 50) { "Green" } else { "Red" })
Write-Host "  Model Coverage: $modelCoverage%" -ForegroundColor $(if ($modelCoverage -gt 50) { "Green" } else { "Red" })
Write-Host ""
