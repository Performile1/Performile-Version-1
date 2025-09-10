# Check if Node.js is installed in common locations
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:USERPROFILE\AppData\Roaming\nvm\node.exe",
    "$env:USERPROFILE\scoop\shims\node.exe"
)

$nodeFound = $false

Write-Host "Checking for Node.js installation..." -ForegroundColor Cyan

foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeFound = $true
        $nodeVersion = & $path --version
        Write-Host "Node.js found at: $path" -ForegroundColor Green
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
        
        # Add to PATH if not already there
        $nodeDir = Split-Path $path -Parent
        if ($env:PATH -notlike "*$nodeDir*") {
            $env:PATH = "$nodeDir;$env:PATH"
            [Environment]::SetEnvironmentVariable("Path", $env:PATH, [System.EnvironmentVariableTarget]::User)
            Write-Host "Added Node.js to PATH" -ForegroundColor Yellow
        }
        break
    }
}

if (-not $nodeFound) {
    Write-Host "Node.js not found in common locations." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verify npm is available
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm is not working properly. Please reinstall Node.js." -ForegroundColor Red
    exit 1
}

Write-Host "npm version: $npmVersion" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies." -ForegroundColor Red
    exit 1
}

# Run build
Write-Host "`nRunning build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
