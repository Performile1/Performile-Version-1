# =====================================================
# CREATE DATABASE SNAPSHOT
# =====================================================
# Creates a complete backup/snapshot of your Supabase database
# =====================================================

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$snapshotDir = "snapshots"
$snapshotFile = "$snapshotDir/performile_snapshot_$timestamp.sql"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "PERFORMILE DATABASE SNAPSHOT CREATOR" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Create snapshots directory if it doesn't exist
if (!(Test-Path $snapshotDir)) {
    New-Item -ItemType Directory -Path $snapshotDir | Out-Null
    Write-Host "✓ Created snapshots directory" -ForegroundColor Green
}

Write-Host "This script will help you create a database snapshot." -ForegroundColor Yellow
Write-Host ""
Write-Host "You have two options:" -ForegroundColor White
Write-Host ""
Write-Host "OPTION 1: Using Supabase Dashboard (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Go to your Supabase project dashboard" -ForegroundColor White
Write-Host "  2. Click on 'Database' in the left sidebar" -ForegroundColor White
Write-Host "  3. Click on 'Backups' tab" -ForegroundColor White
Write-Host "  4. Click 'Download' on the latest backup" -ForegroundColor White
Write-Host "  5. Save the file to: $snapshotDir" -ForegroundColor White
Write-Host ""
Write-Host "OPTION 2: Using pg_dump (If you have PostgreSQL tools installed)" -ForegroundColor Cyan
Write-Host "  Run the following command:" -ForegroundColor White
Write-Host ""
Write-Host "  pg_dump -h <your-supabase-host> -U postgres -d postgres --schema=public > $snapshotFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "  You'll need:" -ForegroundColor White
Write-Host "  - Your Supabase database host (from project settings)" -ForegroundColor White
Write-Host "  - Your database password" -ForegroundColor White
Write-Host ""
Write-Host "OPTION 3: Run SQL Query in Supabase" -ForegroundColor Cyan
Write-Host "  1. Open Supabase SQL Editor" -ForegroundColor White
Write-Host "  2. Run: database/GENERATE_DATABASE_SNAPSHOT.sql" -ForegroundColor White
Write-Host "  3. Copy all results and save to: $snapshotFile" -ForegroundColor White
Write-Host ""

# Check if pg_dump is available
$pgDumpAvailable = $null -ne (Get-Command pg_dump -ErrorAction SilentlyContinue)

if ($pgDumpAvailable) {
    Write-Host "✓ pg_dump is available on your system" -ForegroundColor Green
    Write-Host ""
    
    $response = Read-Host "Would you like to create a snapshot using pg_dump now? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host ""
        $dbHost = Read-Host "Enter your Supabase database host (e.g., db.xxxxx.supabase.co)"
        $dbPort = Read-Host "Enter port (default: 5432)"
        if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
        
        Write-Host ""
        Write-Host "Creating snapshot..." -ForegroundColor Yellow
        Write-Host "You will be prompted for your database password." -ForegroundColor Yellow
        Write-Host ""
        
        $env:PGPASSWORD = Read-Host "Enter database password" -AsSecureString | ConvertFrom-SecureString
        
        try {
            pg_dump -h $dbHost -p $dbPort -U postgres -d postgres --schema=public --no-owner --no-acl -f $snapshotFile
            
            if (Test-Path $snapshotFile) {
                $fileSize = (Get-Item $snapshotFile).Length / 1KB
                Write-Host ""
                Write-Host "✓ Snapshot created successfully!" -ForegroundColor Green
                Write-Host "  File: $snapshotFile" -ForegroundColor White
                Write-Host "  Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor White
                Write-Host ""
                
                # Create a summary file
                $summaryFile = "$snapshotDir/snapshot_summary_$timestamp.txt"
                @"
PERFORMILE DATABASE SNAPSHOT SUMMARY
=====================================
Created: $(Get-Date)
File: $snapshotFile
Size: $([math]::Round($fileSize, 2)) KB
Host: $dbHost
Port: $dbPort
Schema: public
=====================================
"@ | Out-File -FilePath $summaryFile
                
                Write-Host "✓ Summary saved to: $summaryFile" -ForegroundColor Green
            }
        }
        catch {
            Write-Host ""
            Write-Host "✗ Error creating snapshot: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please use Option 1 (Supabase Dashboard) instead." -ForegroundColor Yellow
        }
        finally {
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "✗ pg_dump is not available on your system" -ForegroundColor Red
    Write-Host "  Please use Option 1 (Supabase Dashboard) or Option 3 (SQL Query)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "SNAPSHOT PROCESS COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Snapshots are saved in: $snapshotDir" -ForegroundColor White
Write-Host ""
