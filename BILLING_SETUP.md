# Google Cloud Billing Аккаунтын Байланыстыру

## Мәселе

Егер сіз мынадай қате алсаңыз:

```
ERROR: (gcloud.services.enable) FAILED_PRECONDITION: Billing account for project '...' is not found.
```

Бұл billing аккаунты байланыстырылмағанын білдіреді.

## Шешу әдістері

### Әдіс 1: Google Cloud Console арқылы (Ең оңай)

1. [Google Cloud Console](https://console.cloud.google.com/) ашыңыз
2. Дұрыс проектті таңдағаныңызды тексеріңіз (жоғарғы жақта)
3. Сол жақтағы менюден **"Billing"** таңдаңыз
   - Немесе тікелей: https://console.cloud.google.com/billing
4. Екі нұсқа бар:

#### A) Бар Billing аккаунтыңыз болса:
   - **"Link a billing account"** батырмасын басыңыз
   - Тізімнен billing аккаунтыңызды таңдаңыз
   - **"Set account"** батырмасын басыңыз

#### B) Жаңа Billing аккаунты жасау:
   - **"Create billing account"** батырмасын басыңыз
   - Елді таңдаңыз
   - Кредит картасын енгізіңіз
   - Billing аккаунтын жасаңыз
   - Проектіңізге автоматты түрде байланыстырылады

### Әдіс 2: gcloud CLI арқылы

#### 1. Бар billing аккаунттарын көру:

```bash
gcloud billing accounts list
```

Шығару мынадай болады:
```
ACCOUNT_ID            NAME                OPEN
0X0X0X-0X0X0X-0X0X0X  My Billing Account  True
```

#### 2. Проектке байланыстыру:

```bash
# ACCOUNT_ID-ді жоғарыдағы командадан алыңыз
gcloud billing projects link kazakh-hub --billing-account=0X0X0X-0X0X0X-0X0X0X
```

#### 3. Тексеру:

```bash
# Проекттің billing статусын тексеру
gcloud billing projects describe kazakh-hub
```

## Еркін Tier ақпараты

Google Cloud еркін tier-ді ұсынады:

- **$300 айына кредит** (12 ай бойы)
- **Cloud Run**: Айына 2 миллион request-ке дейін тегін
- **Container Registry**: Айына 0.5GB storage тегін
- **Cloud Build**: Айына 120 минут build уақыты тегін

**Маңызды:**
- Кредит картасы қажет (еркін tier-ді іске қосу үшін)
- Еркін tier шегінен аспасаңыз, ақы алынбайды
- Еркін tier-дің мерзімі біткеннен кейін де пайдалануға болады, тек ақы төлеу керек

## Billing аккаунтын байланыстырғаннан кейін

Billing аккаунтын байланыстырғаннан кейін, API-лерді іске қосуға болады:

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

## Мәселе: Billing байланыстырылған, бірақ қате әлі де келеді

Егер billing аккаунтын байланыстырғаннан кейін де қате келсе, мынаны тексеріңіз:

### 1. Проект ID-ін тексеру

**Маңызды:** `669228897264` - бұл **project number**, **project ID емес**!

```bash
# Ағымдағы проектті көру
gcloud config get-value project

# Егер project number көрсетілсе, project ID-ді табыңыз
gcloud projects list

# Дұрыс project ID-ді таңдаңыз
gcloud config set project PROJECT_ID
```

### 2. Billing статусын тексеру

```bash
# Billing статусын тексеру
gcloud billing projects describe $(gcloud config get-value project)

# Егер "billingAccountName" көрсетілмесе, billing байланыстырылмаған
```

### 3. Күту уақыты

Billing аккаунтын байланыстырғаннан кейін **5-10 минут** күтіңіз. Кейбір жағдайларда өзгерістер таралуға уақыт қажет.

### 4. Браузерде тексеру

1. [Google Cloud Console](https://console.cloud.google.com/) ашыңыз
2. Дұрыс проектті таңдаңыз (жоғарғы жақта)
3. [Billing](https://console.cloud.google.com/billing) бетіне өтіңіз
4. Проекттің billing аккаунты байланыстырылғанын тексеріңіз

### 5. API-лерді бір-бірлеп іске қосу

Кейде бірден көп API-ді іске қосу қате беретін болуы мүмкін:

```bash
# Бір-бірлеп іске қосу
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 6. Проектті қайта байланыстыру

Егер ешнәрсе көмектемесе:

```bash
# Бар billing аккаунттарын көру
gcloud billing accounts list

# Проектті billing аккаунтынан ажырату
gcloud billing projects unlink $(gcloud config get-value project)

# Қайта байланыстыру
gcloud billing projects link $(gcloud config get-value project) --billing-account=BILLING_ACCOUNT_ID

# 5-10 минут күту
# Содан кейін API-лерді іске қосу
```

### 7. Тексеру скрипті

`check-billing.ps1` скриптіні іске қосып, мәселені анықтаңыз:

```powershell
.\check-billing.ps1
```

### 8. Project ID vs Project Number

**Project Number** (мысалы: `669228897264`) - бұл сандық идентификатор
**Project ID** (мысалы: `kazakh-hub`) - бұл таңдалған атау

gcloud командаларында **Project ID** пайдаланылады, Project Number емес!

```bash
# Project ID-ді көру
gcloud projects list

# Дұрыс Project ID-ді таңдау
gcloud config set project kazakh-hub  # Project ID, number емес!
```

## Көмек керек болса

- [Google Cloud Billing Документациясы](https://cloud.google.com/billing/docs)
- [Еркін Tier туралы ақпарат](https://cloud.google.com/free)
- [Billing FAQ](https://cloud.google.com/billing/docs/how-to/get-account-id)
