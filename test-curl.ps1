# Test production API
Write-Host "Testing production API..." -ForegroundColor Cyan
curl -v https://performile-platform.vercel.app/api/auth

# Test deployment API
Write-Host "\nTesting deployment API..." -ForegroundColor Cyan
curl -v https://performile-platform-yhep.vercel.app/api/auth

# Test deployment frontend
Write-Host "\nTesting deployment frontend..." -ForegroundColor Cyan
curl -v https://performile-platform-yhep.vercel.app/
