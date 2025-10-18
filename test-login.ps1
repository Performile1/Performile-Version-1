# Test login endpoint
$body = @{
    action = "login"
    email = "admin@performile.com"
    password = "Admin123!"
} | ConvertTo-Json

Write-Host "Testing login endpoint..." -ForegroundColor Cyan
Write-Host "URL: https://performile-platform-main.vercel.app/api/auth" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://performile-platform-main.vercel.app/api/auth" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 30

    Write-Host "`n✅ Login Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`n❌ Login Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}
