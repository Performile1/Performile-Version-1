Write-Host "=== Environment Check ==="
Write-Host "Node.js version:" (node -v)
Write-Host "npm version:" (npm -v)
Write-Host "Current directory:" (Get-Location)
Write-Host "Node path:" (Get-Command node).Source
Write-Host "npm path:" (Get-Command npm).Source

Write-Host "\n=== Running Build ==="
# Run the build command
npm run build
