# Cleanup script for Performile platform

# Remove test and utility scripts
Remove-Item -Path "check-*.js" -Force
Remove-Item -Path "test-*.js" -Force
Remove-Item -Path "test-*.ps1" -Force
Remove-Item -Path "test-*" -Recurse -Force
Remove-Item -Path "direct-test.js" -Force
Remove-Item -Path "get-*.js" -Force
Remove-Item -Path "fix-imports.ps1" -Force
Remove-Item -Path "simple-test.js" -Force

# Remove deployment scripts (we'll create new ones)
Remove-Item -Path "deploy-*.ps1" -Force
Remove-Item -Path "deploy.sh" -Force

# Remove old configuration files
Remove-Item -Path "netlify.toml" -Force
Remove-Item -Path ".env.vercel" -Force

# Remove empty directories
Get-ChildItem -Directory | Where-Object { $_.GetFiles().Count -eq 0 -and $_.GetDirectories().Count -eq 0 } | Remove-Item -Recurse -Force

Write-Host "Cleanup complete. Please review the changes before committing."
