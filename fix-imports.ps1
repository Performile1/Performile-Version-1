# Fix TypeScript path aliases in backend
Write-Host "Fixing TypeScript path aliases..." -ForegroundColor Green

$files = Get-ChildItem -Path "backend\src" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace @/ imports with relative paths
    $content = $content -replace "from '@/types'", "from '../types'"
    $content = $content -replace "from '@/utils/logger'", "from '../utils/logger'"
    $content = $content -replace "from '@/config/database'", "from '../config/database'"
    $content = $content -replace "from '@/config/redis'", "from '../config/redis'"
    $content = $content -replace "from '@/middleware/auth'", "from '../middleware/auth'"
    $content = $content -replace "from '@/middleware/security'", "from '../middleware/security'"
    $content = $content -replace "from '@/middleware/validation'", "from '../middleware/validation'"
    $content = $content -replace "from '@/controllers/([^']+)'", "from '../controllers/`$1'"
    $content = $content -replace "from '@/routes/([^']+)'", "from '../routes/`$1'"
    $content = $content -replace "from '@/services/([^']+)'", "from '../services/`$1'"
    
    Set-Content $file.FullName $content
}

Write-Host "✅ Fixed all TypeScript imports!" -ForegroundColor Green
