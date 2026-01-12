# PowerShell script to fix billing quota issue
Write-Host "Billing Quota мәселесін шешу..." -ForegroundColor Green

# Check current project
$currentProject = gcloud config get-value project
Write-Host "`nАғымдағы проект: $currentProject" -ForegroundColor Yellow

# Check billing status
Write-Host "`nBilling статусын тексеру..." -ForegroundColor Yellow
gcloud billing projects describe $currentProject

# List projects with billing
Write-Host "`nBilling аккаунтына байланыстырылған проекттер:" -ForegroundColor Yellow
Write-Host "1. kazakhub" -ForegroundColor Cyan
Write-Host "2. project-21f2b751-c213-4623-b6e" -ForegroundColor Cyan
Write-Host "3. kazakh-hub (байланыстырылмаған)" -ForegroundColor Red

Write-Host "`nҚадам-қадам:" -ForegroundColor Green
Write-Host "1. Басқа проекттерді ажырату (егер қажет болса)" -ForegroundColor White
Write-Host "2. kazakh-hub-ті байланыстыру" -ForegroundColor White
Write-Host "3. API-лерді іске қосу" -ForegroundColor White

$choice = Read-Host "`nkazakhub проектін ажырату керек пе? (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "kazakhub проектін ажырату..." -ForegroundColor Yellow
    gcloud billing projects unlink kazakhub
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ kazakhub ажыратылды" -ForegroundColor Green
    }
}

$choice2 = Read-Host "`nproject-21f2b751-c213-4623-b6e проектін ажырату керек пе? (y/n)"
if ($choice2 -eq "y" -or $choice2 -eq "Y") {
    Write-Host "project-21f2b751-c213-4623-b6e проектін ажырату..." -ForegroundColor Yellow
    gcloud billing projects unlink project-21f2b751-c213-4623-b6e
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ project-21f2b751-c213-4623-b6e ажыратылды" -ForegroundColor Green
    }
}

# Link kazakh-hub
Write-Host "`nkazakh-hub-ті байланыстыру..." -ForegroundColor Yellow
gcloud billing projects link kazakh-hub --billing-account=01E7B6-CE5A2F-7B548C

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ kazakh-hub байланыстырылды!" -ForegroundColor Green
    Write-Host "`n5-10 минут күтіңіз, содан кейін API-лерді іске қосыңыз:" -ForegroundColor Cyan
    Write-Host "gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com" -ForegroundColor White
} else {
    Write-Host "✗ Қате! Quota әлі де асып кеткен болуы мүмкін." -ForegroundColor Red
    Write-Host "Басқа проекттерді ажыратып, қайталап көріңіз." -ForegroundColor Yellow
}
