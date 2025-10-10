# Fix ALL Pool instances including multi-line declarations
$files = Get-ChildItem -Path "frontend\api" -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue | Where-Object { 
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $content -and ($content -match "const pool = new Pool")
}

$count = 0
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        
        # Replace multi-line Pool declarations (handles newlines and any content between braces)
        $content = $content -replace "const pool = new Pool\(\{[^}]*\}\);", "const pool = getPool();"
        
        # Also handle single-line versions
        $content = $content -replace "const pool = new Pool\([^\)]*\);", "const pool = getPool();"
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Fixed: $($file.Name)"
    } catch {
        Write-Host "Error fixing $($file.Name): $_"
    }
}

Write-Host "`nFixed $count files"
