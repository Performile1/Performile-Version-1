# PowerShell script to resize image for PWA icons
# Requires: Windows with .NET (built-in)

param(
    [string]$InputImage = "C:\Users\ricka\Downloads\Gemini_Generated_Image_to39qrto39qrto39.jpeg",
    [string]$OutputDir = "C:\Users\ricka\Downloads\performile-platform-main\performile-platform-main\frontend\public"
)

Write-Host "PWA Icon Resizer" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host ""

# Check if input file exists
if (-not (Test-Path $InputImage)) {
    Write-Host "ERROR: Input image not found: $InputImage" -ForegroundColor Red
    exit 1
}

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    Write-Host "Creating output directory: $OutputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

# Function to resize image
function Resize-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height
    )
    
    try {
        Write-Host "Resizing to ${Width}x${Height}..." -NoNewline
        
        # Load original image
        $image = [System.Drawing.Image]::FromFile($InputPath)
        
        # Create new bitmap with target size
        $newImage = New-Object System.Drawing.Bitmap($Width, $Height)
        
        # Create graphics object for high-quality resize
        $graphics = [System.Drawing.Graphics]::FromImage($newImage)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        # Draw resized image
        $graphics.DrawImage($image, 0, 0, $Width, $Height)
        
        # Save as PNG
        $newImage.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Cleanup
        $graphics.Dispose()
        $newImage.Dispose()
        $image.Dispose()
        
        Write-Host " Done!" -ForegroundColor Green
        Write-Host "  Saved to: $OutputPath" -ForegroundColor Gray
        
        return $true
    }
    catch {
        Write-Host " Failed!" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

# Resize to 192x192
$output192 = Join-Path $OutputDir "pwa-192x192.png"
$success192 = Resize-Image -InputPath $InputImage -OutputPath $output192 -Width 192 -Height 192

# Resize to 512x512
$output512 = Join-Path $OutputDir "pwa-512x512.png"
$success512 = Resize-Image -InputPath $InputImage -OutputPath $output512 -Width 512 -Height 512

# Summary
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "--------" -ForegroundColor Cyan
if ($success192) {
    Write-Host "✓ 192x192 icon created" -ForegroundColor Green
} else {
    Write-Host "✗ 192x192 icon failed" -ForegroundColor Red
}

if ($success512) {
    Write-Host "✓ 512x512 icon created" -ForegroundColor Green
} else {
    Write-Host "✗ 512x512 icon failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the icons in: $OutputDir" -ForegroundColor Gray
Write-Host "2. Re-enable PWA manifest in vite.config.ts" -ForegroundColor Gray
Write-Host "3. Commit and deploy to Vercel" -ForegroundColor Gray
Write-Host ""
