# Function to write colored output
function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    
    $colors = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
    }
    
    $color = $colors[$Status]
    if (-not $color) { $color = "White" }
    
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

# Check Node.js installation
Write-Status "Checking Node.js installation..."
$nodePath = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

if ($nodePath) {
    $nodeVersion = node --version
    Write-Status "Node.js found at: $nodePath" "SUCCESS"
    Write-Status "Node.js version: $nodeVersion" "SUCCESS"
} else {
    Write-Status "Node.js is not installed or not in PATH" "ERROR"
    Write-Status "Please download and install Node.js from https://nodejs.org/" "WARNING"
    exit 1
}

# Check npm installation
Write-Status "Checking npm installation..."
$npmPath = Get-Command npm -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

if ($npmPath) {
    $npmVersion = npm --version
    Write-Status "npm found at: $npmPath" "SUCCESS"
    Write-Status "npm version: $npmVersion" "SUCCESS"
} else {
    Write-Status "npm is not installed or not in PATH" "ERROR"
    exit 1
}

# Install dependencies
Write-Status "Installing dependencies..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Status "Failed to install dependencies" "ERROR"
    exit 1
}

# Run build
Write-Status "Running build..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Status "Build failed" "ERROR"
    exit 1
}

Write-Status "Build completed successfully!" "SUCCESS"
Write-Status "You can now run 'npm run preview' to preview the build" "INFO"
