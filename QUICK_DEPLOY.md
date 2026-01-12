# Google Cloud Деплой - Жылдам Нұсқаулық

## Алдын ала дайындау

```bash
# 1. Google Cloud-қа кіру
gcloud auth login

# 2. Проект таңдау/жасау
gcloud config set project kazakh-hub

# 3. BILLING АККАУНТЫН БАЙЛАНЫСТЫРУ (МІНДЕТТІ!)
# Браузерде: https://console.cloud.google.com/billing
# Немесе gcloud арқылы:
gcloud billing accounts list
gcloud billing projects link kazakh-hub --billing-account=BILLING_ACCOUNT_ID

# 4. API-лерді іске қосу (billing байланыстырғаннан кейін)
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

**Ескерту:** Егер billing қатесі алсаңыз, `BILLING_SETUP.md` файлын қараңыз.

## Деплой (PowerShell)

### 1. Backend деплой

```powershell
.\deploy-backend.ps1
```

Backend URL-ін есте сақтаңыз (мысалы: `https://kazakh-hub-backend-xxxxx.run.app`)

### 2. Frontend деплой

```powershell
.\deploy-frontend.ps1 -BackendUrl "https://kazakh-hub-backend-xxxxx.run.app/api"
```

**Ескерту:** Firebase конфигурациясын қосқанда, барлық параметрлерді беріңіз:

```powershell
.\deploy-frontend.ps1 `
  -BackendUrl "https://kazakh-hub-backend-xxxxx.run.app/api" `
  -GoogleClientId "your-client-id" `
  -FirebaseApiKey "your-api-key" `
  -FirebaseAuthDomain "your-domain" `
  -FirebaseProjectId "your-project" `
  -FirebaseStorageBucket "your-bucket" `
  -FirebaseMessagingSenderId "your-sender-id" `
  -FirebaseAppId "your-app-id"
```

## Қолмен деплой

### Backend

```bash
cd backend
docker build -t gcr.io/kazakh-hub/kazakh-hub-backend:latest .
docker push gcr.io/kazakh-hub/kazakh-hub-backend:latest
gcloud run deploy kazakh-hub-backend \
  --image gcr.io/kazakh-hub/kazakh-hub-backend:latest \
  --region us-central1 --platform managed --allow-unauthenticated --port 8080
```

### Frontend

```bash
cd frontend
docker build --build-arg VITE_API_BASE_URL="https://kazakh-hub-backend-xxxxx.run.app/api" \
  -t gcr.io/kazakh-hub/kazakh-hub-frontend:latest .
docker push gcr.io/kazakh-hub/kazakh-hub-frontend:latest
gcloud run deploy kazakh-hub-frontend \
  --image gcr.io/kazakh-hub/kazakh-hub-frontend:latest \
  --region us-central1 --platform managed --allow-unauthenticated --port 8080
```

## Логилерді көру

```bash
# Backend логилері
gcloud run services logs read kazakh-hub-backend --region us-central1

# Frontend логилері  
gcloud run services logs read kazakh-hub-frontend --region us-central1

# Real-time логилер
gcloud run services logs tail kazakh-hub-backend --region us-central1
```

## Service URL-лерін алу

```bash
# Backend URL
gcloud run services describe kazakh-hub-backend --region us-central1 --format 'value(status.url)'

# Frontend URL
gcloud run services describe kazakh-hub-frontend --region us-central1 --format 'value(status.url)'
```

## Толық нұсқаулық

Толық нұсқаулық үшін `GOOGLE_CLOUD_DEPLOYMENT.md` файлын қараңыз.
