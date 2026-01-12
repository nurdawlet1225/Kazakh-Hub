# Get backend URL after deployment
Write-Host "Backend URL-ін алу..." -ForegroundColor Green

$backendUrl = gcloud run services describe kazakh-hub-backend --region us-central1 --format 'value(status.url)'

if ($backendUrl) {
    Write-Host "`n✓ Backend URL табылды:" -ForegroundColor Green
    Write-Host "$backendUrl" -ForegroundColor Cyan
    Write-Host "`nAPI URL: $backendUrl/api" -ForegroundColor Cyan
    Write-Host "`nFrontend деплой үшін:" -ForegroundColor Yellow
    Write-Host ".\deploy-frontend.ps1 -BackendUrl `"$backendUrl/api`"" -ForegroundColor White
} else {
    Write-Host "✗ Backend әлі деплойланбаған немесе қате бар." -ForegroundColor Red
    Write-Host "Build статусын тексеру:" -ForegroundColor Yellow
    Write-Host "gcloud builds list --limit=1" -ForegroundColor White
}
