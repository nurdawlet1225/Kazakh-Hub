# Complete deployment script for both backend and frontend
Write-Host "=== Kazakh Hub Деплой ===" -ForegroundColor Green

# Step 1: Deploy Backend
Write-Host "`n[1/3] Backend деплой..." -ForegroundColor Yellow
Write-Host "Cloud Build арқылы build жасау..." -ForegroundColor Cyan

gcloud builds submit --config cloudbuild-backend-only.yaml --timeout=30m

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend деплой қатесі!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backend деплойланды!" -ForegroundColor Green

# Step 2: Get Backend URL
Write-Host "`n[2/3] Backend URL-ін алу..." -ForegroundColor Yellow
Start-Sleep -Seconds 10  # Wait for service to be ready

$backendUrl = gcloud run services describe kazakh-hub-backend --region us-central1 --format 'value(status.url)' 2>$null

if (-not $backendUrl) {
    Write-Host "⚠ Backend URL табылмады, қайталап көру..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
    $backendUrl = gcloud run services describe kazakh-hub-backend --region us-central1 --format 'value(status.url)' 2>$null
}

if (-not $backendUrl) {
    Write-Host "✗ Backend URL алу қатесі!" -ForegroundColor Red
    Write-Host "Қолмен тексеру: gcloud run services list --region us-central1" -ForegroundColor Yellow
    exit 1
}

$apiUrl = "$backendUrl/api"
Write-Host "✓ Backend URL: $backendUrl" -ForegroundColor Green
Write-Host "✓ API URL: $apiUrl" -ForegroundColor Green

# Step 3: Deploy Frontend
Write-Host "`n[3/3] Frontend деплой..." -ForegroundColor Yellow
Write-Host "Backend URL: $apiUrl" -ForegroundColor Cyan

# Use default Firebase values from code
$firebaseApiKey = "AIzaSyCQV1oUnC4GISVmWPAk-fIk-3UOoEYBink"
$firebaseAuthDomain = "kazakh-hub.firebaseapp.com"
$firebaseProjectId = "kazakh-hub"
$firebaseStorageBucket = "kazakh-hub.firebasestorage.app"
$firebaseMessagingSenderId = "669228897264"
$firebaseAppId = "1:669228897264:web:095fe725a868d1eb768335"
$firebaseMeasurementId = "G-N2X6FB3KXN"

Write-Host "Cloud Build арқылы frontend build жасау..." -ForegroundColor Cyan

gcloud builds submit --config cloudbuild-frontend-only.yaml `
  --substitutions=_BACKEND_URL=$apiUrl,`
  _GOOGLE_CLIENT_ID="",`
  _FIREBASE_API_KEY=$firebaseApiKey,`
  _FIREBASE_AUTH_DOMAIN=$firebaseAuthDomain,`
  _FIREBASE_PROJECT_ID=$firebaseProjectId,`
  _FIREBASE_STORAGE_BUCKET=$firebaseStorageBucket,`
  _FIREBASE_MESSAGING_SENDER_ID=$firebaseMessagingSenderId,`
  _FIREBASE_APP_ID=$firebaseAppId,`
  _FIREBASE_MEASUREMENT_ID=$firebaseMeasurementId `
  --timeout=30m

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend деплой қатесі!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend деплойланды!" -ForegroundColor Green

# Step 4: Get Frontend URL
Write-Host "`n[4/4] Frontend URL-ін алу..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$frontendUrl = gcloud run services describe kazakh-hub-frontend --region us-central1 --format 'value(status.url)' 2>$null

if ($frontendUrl) {
    Write-Host "`n=== Деплой аяқталды! ===" -ForegroundColor Green
    Write-Host "`nBackend URL: $backendUrl" -ForegroundColor Cyan
    Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
    Write-Host "`nСайтты ашу: $frontendUrl" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Frontend URL табылмады, қолмен тексеру:" -ForegroundColor Yellow
    Write-Host "gcloud run services list --region us-central1" -ForegroundColor White
}
