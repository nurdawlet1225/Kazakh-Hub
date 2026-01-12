# PowerShell script for deploying backend to Google Cloud Run
# Usage: .\deploy-backend.ps1

Write-Host "Building and deploying backend to Google Cloud Run..." -ForegroundColor Green

# Change to backend directory
Set-Location backend

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t gcr.io/kazakh-hub/kazakh-hub-backend:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Push to Container Registry
Write-Host "Pushing to Container Registry..." -ForegroundColor Yellow
docker push gcr.io/kazakh-hub/kazakh-hub-backend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker push failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy kazakh-hub-backend `
  --image gcr.io/kazakh-hub/kazakh-hub-backend:latest `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10 `
  --timeout 3600

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend deployed successfully!" -ForegroundColor Green
    Write-Host "Getting service URL..." -ForegroundColor Yellow
    $url = gcloud run services describe kazakh-hub-backend --region us-central1 --format 'value(status.url)'
    Write-Host "Backend URL: $url" -ForegroundColor Cyan
    Write-Host "API URL: $url/api" -ForegroundColor Cyan
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Set-Location ..
