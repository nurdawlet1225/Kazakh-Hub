# Billing Quota Мәселесін Шешу

## Мәселе

```
ERROR: Cloud billing quota exceeded
```

Бұл billing аккаунтына байланыстырылған проекттер санының лимиті асып кеткенін білдіреді.

## Шешу жолдары

### Әдіс 1: Басқа проекттерді ажырату (Ұсынылады)

Егер сізде billing аккаунтына байланыстырылған көптеген проекттер болса, оларды ажыратып, тек қажеттілерін қалдырыңыз:

```bash
# Барлық проекттерді көру
gcloud projects list

# Басқа проекттерді billing-ден ажырату (мысал)
gcloud billing projects unlink project-21f2b751-c213-4623-b6e
gcloud billing projects unlink kazakhub
# және т.б.

# Содан кейін kazakh-hub-ті байланыстыру
gcloud billing projects link kazakh-hub --billing-account=01E7B6-CE5A2F-7B548C
```

### Әдіс 2: Браузер арқылы

1. [Google Cloud Console - Billing](https://console.cloud.google.com/billing) ашыңыз
2. Billing аккаунтыңызды таңдаңыз
3. "Projects" бөлімінде барлық проекттерді көру
4. Қажетсіз проекттерді ажыратыңыз
5. Содан кейін `kazakh-hub` проектін байланыстырыңыз

### Әдіс 3: Жаңа Billing аккаунты жасау

Егер сізде еркін tier-дің 12 айы әлі бітпеген болса, жаңа billing аккаунты жасауға болады:

1. [Google Cloud Console - Billing](https://console.cloud.google.com/billing) ашыңыз
2. "Create billing account" батырмасын басыңыз
3. Жаңа billing аккаунтын жасаңыз
4. `kazakh-hub` проектін жаңа billing аккаунтына байланыстырыңыз

### Әдіс 4: Quota арттыру сұрау

Егер сізге көптеген проекттер қажет болса:

1. [Google Cloud Support](https://support.google.com/code/contact/billing_quota_increase) бетіне өтіңіз
2. Quota арттыру сұрауын жіберіңіз
3. Күтіңіз (бірнеше күн алуы мүмкін)

## Қадам-қадам нұсқаулық

### 1. Қажетсіз проекттерді табу

```bash
# Барлық проекттерді көру
gcloud projects list

# Әрбір проекттің billing статусын тексеру
gcloud billing projects describe PROJECT_ID
```

### 2. Қажетсіз проекттерді ажырату

```bash
# Проектті billing-ден ажырату
gcloud billing projects unlink PROJECT_ID
```

### 3. kazakh-hub-ті байланыстыру

```bash
# Billing аккаунтын байланыстыру
gcloud billing projects link kazakh-hub --billing-account=01E7B6-CE5A2F-7B548C

# Тексеру
gcloud billing projects describe kazakh-hub
```

### 4. API-лерді іске қосу

Billing байланыстырылғаннан кейін (5-10 минут күтіңіз):

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

## Тез шешу (ең оңай)

Егер сізде басқа проекттерді ажыратуға болатын проекттер болса:

```bash
# Мысал: басқа проекттерді ажырату
gcloud billing projects unlink kazakhub
gcloud billing projects unlink project-21f2b751-c213-4623-b6e

# Содан кейін kazakh-hub-ті байланыстыру
gcloud billing projects link kazakh-hub --billing-account=01E7B6-CE5A2F-7B548C

# 5-10 минут күту
# Содан кейін API-лерді іске қосу
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```
