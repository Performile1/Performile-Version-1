# Script to replace all Pool instances with shared pool
$files = Get-ChildItem -Path "frontend\api" -Recurse -Filter "*.ts" | Where-Object { 
    (Get-Content $_.FullName -Raw) -match "new Pool\(" 
}

foreach ($file in $files) {
    Write-Host "Fixing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Calculate relative path to lib/db.ts
    $depth = ($file.DirectoryName -replace [regex]::Escape((Get-Location).Path + "\frontend\api"), "").Split('\').Count - 1
    $relativePath = if ($depth -eq 0) { "./lib/db" } else { ("../" * $depth) + "lib/db" }
    
    # Pattern 1: const { Pool } = require('pg');
    if ($content -match "const \{ Pool \} = require\('pg'\);") {
        $content = $content -replace "const \{ Pool \} = require\('pg'\);", "import { getPool } from '$relativePath';"
    }
    
    # Pattern 2: import { Pool } from 'pg';
    if ($content -match "import \{ Pool \} from 'pg';") {
        $content = $content -replace "import \{ Pool \} from 'pg';", "import { getPool } from '$relativePath';"
    }
    
    # Pattern 3: Replace pool creation with getPool()
    $content = $content -replace "const pool = new Pool\(\{[^}]+\}\);", "const pool = getPool();"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "`nDone! Fixed $($files.Count) files"
