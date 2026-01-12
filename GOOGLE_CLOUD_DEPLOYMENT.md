# Google Cloud Platform Деплой Нұсқаулығы

Бұл нұсқаулық Kazakh Hub сайтын Google Cloud Platform-ға деплойлау үшін қажетті қадамдарды сипаттайды.

## Алдын ала талаптар

1. **Google Cloud аккаунты** - [Google Cloud Console](https://console.cloud.google.com/) арқылы жасаңыз
2. **Google Cloud SDK** - [gcloud CLI орнату](https://cloud.google.com/sdk/docs/install)
3. **Docker** - Локальды тестілеу үшін (міндетті емес)
4. **Billing аккаунты** - Міндетті! (Еркін tier-де де қажет)

## Бастапқы баптау

### 1. Google Cloud проектін жасау

```bash
# Google Cloud-қа кіру
gcloud auth login

# Жаңа проект жасау (немесе бар проектті таңдау)
gcloud projects create kazakh-hub --name="Kazakh Hub"

# Проектті таңдау
gcloud config set project kazakh-hub
```

### 2. Billing аккаунтын байланыстыру (МІНДЕТТІ!)

**Ескерту:** Google Cloud-та кез келген сервисті пайдалану үшін billing аккаунты қажет, тіпті еркін tier-де де.

#### Браузер арқылы (Ұсынылады):

1. [Google Cloud Console](https://console.cloud.google.com/) ашыңыз
2. Сол жақтағы менюден **"Billing"** таңдаңыз
3. Егер billing аккаунтыңыз болса:
   - **"Link a billing account"** батырмасын басыңыз
   - Бар billing аккаунтыңызды таңдаңыз
4. Егер billing аккаунтыңыз жоқ болса:
   - **"Create billing account"** батырмасын басыңыз
   - Кредит картасын енгізіңіз (еркін tier-де ақысыз)
   - Billing аккаунтын жасаңыз
   - Проектіңізге байланыстырыңыз

#### gcloud CLI арқылы:

```bash
# Бар billing аккаунтын көру
gcloud billing accounts list

# Проектке billing аккаунтын байланыстыру
# BILLING_ACCOUNT_ID-ді жоғарыдағы командадан алыңыз
gcloud billing projects link kazakh-hub --billing-account=BILLING_ACCOUNT_ID
```

**Еркін Tier ақпараты:**
- Google Cloud еркін tier-де айына $300 кредит береді
- Cloud Run: айына 2 миллион request-ке дейін тегін
- Container Registry: айына 0.5GB storage тегін
- Кредит картасы қажет, бірақ еркін tier шегінен аспасаңыз, ақы алынбайды

### 3. Қажетті API-лерді іске қосу

**Ескерту:** Бұл қадамды тек billing аккаунтын байланыстырғаннан кейін орындаңыз!

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Барлығын бір ретте іске қосу
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

Егер қате алсаңыз: `FAILED_PRECONDITION: Billing account for project...`
- Billing аккаунтын байланыстыруды тексеріңіз (2-қадам)
- Браузерде [Google Cloud Console > Billing](https://console.cloud.google.com/billing) ашып тексеріңіз

### 3. Environment Variables дайындау

Frontend үшін `.env.production` файлын жасаңыз:

```bash
cd frontend
```

`.env.production` файлын жасаңыз:

```env
VITE_API_BASE_URL=https://kazakh-hub-backend-xxxxx.run.app/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
```

**Ескерту:** `VITE_API_BASE_URL` мәнін алдымен backend деплойдан кейін алыңыз.

## Деплой әдістері

### Әдіс 0: PowerShell скрипттері арқылы (Ең оңай)

#### Backend деплой

```powershell
.\deploy-backend.ps1
```

Бұл скрипт:
1. Docker образын құрады
2. Container Registry-ге жібереді
3. Cloud Run-ға деплойлайды
4. Backend URL-ін көрсетеді

#### Frontend деплой

Backend URL-ін алғаннан кейін:

```powershell
.\deploy-frontend.ps1 -BackendUrl "https://kazakh-hub-backend-xxxxx.run.app/api" `
  -GoogleClientId "your-client-id" `
  -FirebaseApiKey "your-api-key" `
  -FirebaseAuthDomain "your-auth-domain" `
  -FirebaseProjectId "your-project-id" `
  -FirebaseStorageBucket "your-storage-bucket" `
  -FirebaseMessagingSenderId "your-sender-id" `
  -FirebaseAppId "your-app-id" `
  -FirebaseMeasurementId "your-measurement-id"
```

### Әдіс 1: Cloud Build арқылы автоматты деплой (Ұсынылады)

Бұл әдіс `cloudbuild.yaml` файлын пайдаланады және барлық процесті автоматтандырады.

**Алдымен backend-ті деплойлаңыз**, содан кейін frontend-ті деплойлаңыз (себебі frontend-ке backend URL қажет):

#### 1-қадам: Backend деплой

```bash
# Проект түбінен
cd "c:\Users\nurda\code\Kazakh Hub"

# Тек backend-ті деплойлау
gcloud builds submit --config cloudbuild-backend-only.yaml
```

Немесе қолмен:

```bash
cd backend
docker build -t gcr.io/kazakh-hub/kazakh-hub-backend:latest .
docker push gcr.io/kazakh-hub/kazakh-hub-backend:latest
gcloud run deploy kazakh-hub-backend \
  --image gcr.io/kazakh-hub/kazakh-hub-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

Backend URL-ін алыңыз (мысалы: `https://kazakh-hub-backend-xxxxx.run.app`)

#### 2-қадам: Frontend деплой (backend URL-імен)

```bash
# Environment variables-ді орнатып, frontend-ті деплойлау
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_BACKEND_URL=https://kazakh-hub-backend-xxxxx.run.app/api,_GOOGLE_CLIENT_ID=your-client-id,_FIREBASE_API_KEY=your-key,_FIREBASE_AUTH_DOMAIN=your-domain,_FIREBASE_PROJECT_ID=your-project,_FIREBASE_STORAGE_BUCKET=your-bucket,_FIREBASE_MESSAGING_SENDER_ID=your-sender-id,_FIREBASE_APP_ID=your-app-id,_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Ескерту:** Environment variables-ді Cloud Build substitution variables ретінде беру керек. Оларды Cloud Build settings-те де сақтауға болады.

### Әдіс 2: Қолмен деплой

#### Backend деплой

```bash
# Backend директориясына өту
cd backend

# Docker образын құру
docker build -t gcr.io/kazakh-hub/kazakh-hub-backend:latest .

# Container Registry-ге жіберу
docker push gcr.io/kazakh-hub/kazakh-hub-backend:latest

# Cloud Run-ға деплой
gcloud run deploy kazakh-hub-backend \
  --image gcr.io/kazakh-hub/kazakh-hub-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

Деплойдан кейін backend URL-ін алыңыз (мысалы: `https://kazakh-hub-backend-xxxxx.run.app`)

#### Frontend деплой

Алдымен `.env.production` файлында `VITE_API_BASE_URL` мәнін backend URL-іне орнатыңыз:

```env
VITE_API_BASE_URL=https://kazakh-hub-backend-xxxxx.run.app/api
```

Содан кейін:

```bash
# Frontend директориясына өту
cd frontend

# Docker образын құру
docker build -t gcr.io/kazakh-hub/kazakh-hub-frontend:latest .

# Container Registry-ге жіберу
docker push gcr.io/kazakh-hub/kazakh-hub-frontend:latest

# Cloud Run-ға деплой
gcloud run deploy kazakh-hub-frontend \
  --image gcr.io/kazakh-hub/kazakh-hub-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

## Environment Variables орнату

### Backend үшін

```bash
gcloud run services update kazakh-hub-backend \
  --region us-central1 \
  --set-env-vars "KEY1=value1,KEY2=value2"
```

### Frontend үшін

Frontend environment variables Docker build кезінде орнатылады (`.env.production` файлы арқылы).

## CORS баптау

Backend CORS баптауы `main.py` файлында бар. Егер frontend URL-і өзгерсе, оны жаңартыңыз:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kazakh-hub-frontend-xxxxx.run.app"],  # Frontend URL-ін қосыңыз
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Деректер қоры (Database)

Қазіргі уақытта SQLite пайдаланылады. Production ортасында Cloud SQL-ді пайдалану ұсынылады:

```bash
# Cloud SQL instance жасау
gcloud sql instances create kazakh-hub-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Database жасау
gcloud sql databases create kazakh_hub --instance=kazakh-hub-db
```

Содан кейін `backend/db.py` файлын PostgreSQL-ге өзгертіңіз.

## Файлдарды сақтау (File Storage)

Қазіргі уақытта файлдар локальды `uploads` директориясында сақталады. Production үшін Cloud Storage пайдалану ұсынылады:

```bash
# Cloud Storage bucket жасау
gsutil mb -p kazakh-hub -c STANDARD -l us-central1 gs://kazakh-hub-uploads
```

## Мониторинг және Логи

```bash
# Логилерді көру
gcloud run services logs read kazakh-hub-backend --region us-central1
gcloud run services logs read kazakh-hub-frontend --region us-central1

# Real-time логилер
gcloud run services logs tail kazakh-hub-backend --region us-central1
```

## Домен байланыстыру

```bash
# Доменді байланыстыру
gcloud run domain-mappings create \
  --service kazakh-hub-frontend \
  --domain yourdomain.com \
  --region us-central1
```

## Шығындарды бақылау

Cloud Run pay-per-use модельін пайдаланады:
- **Backend**: 512MB memory, 1 CPU - шамамен $0.00002400/request
- **Frontend**: 256MB memory, 1 CPU - шамамен $0.00001200/request

Еркін tier-де айына 2 миллион request-ке дейін тегін.

## Жаңартулар

Кодты жаңартқаннан кейін:

```bash
# Cloud Build арқылы
gcloud builds submit --config cloudbuild.yaml

# Немесе қолмен
cd backend && docker build -t gcr.io/kazakh-hub/kazakh-hub-backend:latest . && docker push gcr.io/kazakh-hub/kazakh-hub-backend:latest && gcloud run deploy kazakh-hub-backend --image gcr.io/kazakh-hub/kazakh-hub-backend:latest --region us-central1
cd frontend && docker build -t gcr.io/kazakh-hub/kazakh-hub-frontend:latest . && docker push gcr.io/kazakh-hub/kazakh-hub-frontend:latest && gcloud run deploy kazakh-hub-frontend --image gcr.io/kazakh-hub/kazakh-hub-frontend:latest --region us-central1
```

## Мәселелерді шешу

### Backend іске қосылмайды

1. Логилерді тексеріңіз: `gcloud run services logs read kazakh-hub-backend --region us-central1`
2. PORT environment variable-ын тексеріңіз (Cloud Run автоматты түрде орнатады)
3. Database файлының жолын тексеріңіз

### Frontend API-ға қосыла алмайды

1. `VITE_API_BASE_URL` дұрыс орнатылғанын тексеріңіз
2. CORS баптауын тексеріңіз
3. Backend URL-ін браузерде ашып тексеріңіз

### WebSocket қосылымы жұмыс істемейді

Cloud Run WebSocket-ті қолдайды, бірақ timeout-тарды баптау керек:

```bash
gcloud run services update kazakh-hub-backend \
  --region us-central1 \
  --timeout 3600
```

## Қосымша ресурстар

- [Cloud Run Документациясы](https://cloud.google.com/run/docs)
- [Cloud Build Документациясы](https://cloud.google.com/build/docs)
- [Docker Документациясы](https://docs.docker.com/)
