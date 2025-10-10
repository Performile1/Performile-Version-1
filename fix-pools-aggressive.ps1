# Aggressive fix for ALL remaining Pool instances
$files = Get-ChildItem -Path "frontend\api" -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue | Where-Object { 
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $content -and ($content -match "new Pool\(")
}

$count = 0
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        
        # Multi-line replacement for new Pool declarations
        $content = $content -replace "const pool = new Pool\(\{[^}]*\}\);", "const pool = getPool();"
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Fixed: $($file.Name)"
    } catch {
        Write-Host "Error fixing $($file.Name): $_"
    }
}

Write-Host "`nFixed $count files"
