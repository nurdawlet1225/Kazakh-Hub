# PowerShell script to check billing status
Write-Host "Checking billing status..." -ForegroundColor Green

# Get current project
Write-Host "`nCurrent project:" -ForegroundColor Yellow
gcloud config get-value project

# Check billing accounts
Write-Host "`nAvailable billing accounts:" -ForegroundColor Yellow
gcloud billing accounts list

# Check if project has billing enabled
Write-Host "`nProject billing status:" -ForegroundColor Yellow
$project = gcloud config get-value project
gcloud billing projects describe $project

# Check if APIs are enabled
Write-Host "`nChecking API status..." -ForegroundColor Yellow
gcloud services list --enabled --filter="name:run.googleapis.com OR name:containerregistry.googleapis.com OR name:cloudbuild.googleapis.com"

Write-Host "`nIf billing is linked but APIs still fail, try:" -ForegroundColor Cyan
Write-Host "1. Wait a few minutes for changes to propagate" -ForegroundColor White
Write-Host "2. Check project ID (not project number)" -ForegroundColor White
Write-Host "3. Try enabling APIs one by one" -ForegroundColor White
