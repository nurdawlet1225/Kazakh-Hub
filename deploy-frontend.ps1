# PowerShell script for deploying frontend to Google Cloud Run
# Usage: .\deploy-frontend.ps1 -BackendUrl "https://kazakh-hub-backend-xxxxx.run.app/api"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [string]$GoogleClientId = "",
    [string]$FirebaseApiKey = "",
    [string]$FirebaseAuthDomain = "",
    [string]$FirebaseProjectId = "",
    [string]$FirebaseStorageBucket = "",
    [string]$FirebaseMessagingSenderId = "",
    [string]$FirebaseAppId = "",
    [string]$FirebaseMeasurementId = ""
)

Write-Host "Building and deploying frontend to Google Cloud Run..." -ForegroundColor Green
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Cyan

# Change to frontend directory
Set-Location frontend

# Build Docker image with build arguments
Write-Host "Building Docker image with environment variables..." -ForegroundColor Yellow

$buildArgs = @(
    "build",
    "--build-arg", "VITE_API_BASE_URL=$BackendUrl"
)

if ($GoogleClientId) {
    $buildArgs += "--build-arg", "VITE_GOOGLE_CLIENT_ID=$GoogleClientId"
}
if ($FirebaseApiKey) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_API_KEY=$FirebaseApiKey"
}
if ($FirebaseAuthDomain) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_AUTH_DOMAIN=$FirebaseAuthDomain"
}
if ($FirebaseProjectId) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_PROJECT_ID=$FirebaseProjectId"
}
if ($FirebaseStorageBucket) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_STORAGE_BUCKET=$FirebaseStorageBucket"
}
if ($FirebaseMessagingSenderId) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_MESSAGING_SENDER_ID=$FirebaseMessagingSenderId"
}
if ($FirebaseAppId) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_APP_ID=$FirebaseAppId"
}
if ($FirebaseMeasurementId) {
    $buildArgs += "--build-arg", "VITE_FIREBASE_MEASUREMENT_ID=$FirebaseMeasurementId"
}

$buildArgs += "-t", "gcr.io/kazakh-hub/kazakh-hub-frontend:latest", "."

docker @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Push to Container Registry
Write-Host "Pushing to Container Registry..." -ForegroundColor Yellow
docker push gcr.io/kazakh-hub/kazakh-hub-frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker push failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy kazakh-hub-frontend `
  --image gcr.io/kazakh-hub/kazakh-hub-frontend:latest `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 256Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend deployed successfully!" -ForegroundColor Green
    $url = gcloud run services describe kazakh-hub-frontend --region us-central1 --format 'value(status.url)'
    Write-Host "Frontend URL: $url" -ForegroundColor Cyan
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Set-Location ..
