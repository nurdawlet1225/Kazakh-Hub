# API URL Түзету - Мәселе Шешілді

## Проблема
Frontend `http://localhost:8080/api` адресіне қосылуға тырысып тұр, бірақ backend `http://127.0.0.1:3000` портында жұмыс істеп тұр.

**Қате:**
```
GET http://localhost:8080/api/codes?limit=50&offset=0 net::ERR_CONNECTION_REFUSED
```

## Шешім

### 1. `.env` файл жаңартылды
`frontend/.env` файлында `VITE_API_BASE_URL` порты 8080-ден 3000-ге өзгертілді:

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

### 2. Frontend Dev Server-ді қайта бастау керек

Vite environment variable-дар тек қайта бастағанда жүктеледі, сондықтан frontend dev server-ді қайта бастау керек:

```powershell
# Frontend директориясына өту
cd frontend

# Dev server-ді тоқтату (Ctrl+C)

# Қайта бастау
npm run dev
```

### 3. Тексеру

Браузерде консольды ашып, қателердің жоғалғанын тексеріңіз. Енді API сұраулары `http://127.0.0.1:3000/api` адресіне жіберілуі керек.

## Автоматты түзету скрипті

Болашақта мұндай мәселелерді шешу үшін `fix-api-url.ps1` скрипті қолданылады:

```powershell
.\fix-api-url.ps1
```

## Қорытынды

✅ `.env` файл жаңартылды  
✅ API URL порты 3000-ге өзгертілді  
⚠️ Frontend dev server-ді қайта бастау керек

---

**Ескерту:** Егер frontend dev server қайта басталғаннан кейін де мәселе болса, браузер кэшін тазалап көріңіз (Ctrl+Shift+R).
