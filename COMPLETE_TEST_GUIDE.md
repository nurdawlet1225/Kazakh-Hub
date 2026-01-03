# 🧪 Толық Аутентификация Тестілеу Нұсқауы

## ✅ Барлық Тестілеу Әдістері

### 1. Backend API Тестілеу (Python)

#### Алдымен зависимостьтерді орнатыңыз:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

#### API эндпоинттерін тестілеу:
```bash
cd backend
source venv/bin/activate
python3 test_complete_api.py
```

**Бұл тестілеу мынаны тексереді:**
- ✅ Health check
- ✅ Пайдаланушы тіркеу (регистрация)
- ✅ Дубликат тіркеуді жою
- ✅ Email арқылы кіру
- ✅ Username арқылы кіру
- ✅ Дұрыс емес парольді жою
- ✅ Пайдаланушы профилін алу
- ✅ Парольді өзгерту

---

### 2. База Тестілеу (SQL)

```bash
cd backend
./test_sql_auth.sh
```

**Бұл тестілеу мынаны тексереді:**
- ✅ База құрылымы
- ✅ Пайдаланушы құру
- ✅ Пайдаланушыны табу
- ✅ Пайдаланушыны жою

---

### 3. Frontend Интеграция Тестілеу

#### Серверді іске қосыңыз:
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python3 main.py
```

#### Frontend-ті іске қосыңыз:
```bash
# Terminal 2: Frontend
cd frontend
npm run dev
```

#### Браузерде тестілеңіз:

**1. Тіркелу (Register):**
- `http://localhost:5174/register` бетіне барыңыз
- Форманы толтырыңыз:
  - Пайдаланушы аты: `testuser`
  - Email: `test@example.com`
  - Құпия сөз: `test123456`
  - Құпия сөзді растау: `test123456`
- "Тіркелу" батырмасын басыңыз
- ✅ Басты бетке бағытталуы керек
- ✅ localStorage-та пайдаланушы деректері сақталуы керек

**2. Кіру (Login):**
- `http://localhost:5174/login` бетіне барыңыз
- Email арқылы кіру:
  - Email: `test@example.com`
  - Құпия сөз: `test123456`
- Немесе Username арқылы кіру:
  - Username: `testuser`
  - Құпия сөз: `test123456`
- "Кіру" батырмасын басыңыз
- ✅ Басты бетке бағытталуы керек
- ✅ Пайдаланушы деректері localStorage-та болуы керек

**3. Профильді тексеру:**
- Басты бетте профиль модалын ашыңыз
- ✅ Пайдаланушы деректері көрінуі керек
- ✅ Email және username дұрыс көрінуі керек

**4. Парольді өзгерту:**
- Профиль модалында "Парольді өзгерту" батырмасын басыңыз
- Ескі пароль: `test123456`
- Жаңа пароль: `newpassword123`
- ✅ Пароль сәтті өзгертілуі керек
- ✅ Жаңа парольмен кіру мүмкін болуы керек

---

### 4. API Эндпоинттерін Curl арқылы Тестілеу

#### Регистрация:
```bash
curl -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Күтілетін жауап:**
```json
{
  "user": {
    "id": "123456789012",
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null
  },
  "message": "User registered successfully"
}
```

#### Логин (Email):
```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

#### Логин (Username):
```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123456"
  }'
```

#### Парольді өзгерту:
```bash
curl -X POST http://127.0.0.1:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123456789012",
    "currentPassword": "test123456",
    "newPassword": "newpassword123"
  }'
```

#### Пайдаланушы профилін алу:
```bash
curl http://127.0.0.1:3000/api/user?user_id=123456789012
```

---

## 📊 Тестілеу Нәтижелері

### ✅ Backend API Тестілері:
- [x] Health check endpoint
- [x] User registration
- [x] Duplicate registration rejection
- [x] Login with email
- [x] Login with username
- [x] Wrong password rejection
- [x] Get user profile
- [x] Change password

### ✅ База Тестілері:
- [x] Database initialization
- [x] User creation (CREATE)
- [x] User retrieval (READ)
- [x] User deletion (DELETE)
- [x] Login verification

### ✅ Frontend Интеграция:
- [x] Register page works
- [x] Login page works
- [x] User data saved to localStorage
- [x] Navigation after login/register
- [x] Error handling

---

## 🔍 Техникалық Детальдар

### База Құрылымы:
- **Файл:** `backend/data/kazakh_hub.db`
- **Кесте:** `users`
- **Өрістер:**
  - `id` (VARCHAR(12), PRIMARY KEY)
  - `username` (VARCHAR(100), UNIQUE, INDEXED)
  - `email` (VARCHAR(255), UNIQUE, INDEXED)
  - `password_hash` (VARCHAR(255)) - bcrypt хэш
  - `avatar` (VARCHAR(500))
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

### API Эндпоинттер:
- `POST /api/auth/register` - Тіркелу
- `POST /api/auth/login` - Кіру
- `POST /api/auth/change-password` - Парольді өзгерту
- `GET /api/user` - Пайдаланушы профилін алу

### Қауіпсіздік:
- ✅ Парольдер bcrypt арқылы хэштеледі
- ✅ Парольдер базада түпнұсқа түрде сақталмайды
- ✅ SQL injection қорғанысы (SQLAlchemy ORM)
- ✅ Input validation (Pydantic models)

---

## ⚠️ Егер Қате Көрінсе:

### 1. SQLAlchemy орнатылмаған:
```bash
pip install sqlalchemy bcrypt httpx
```

### 2. База қатесі:
- `backend/data/` папкасында жазу құқығы бар екенін тексеріңіз
- База файлын жойып, қайта құрыңыз

### 3. Сервер қатесі:
- Серверді қайта іске қосыңыз
- Консольда қателерді тексеріңіз

### 4. Frontend қатесі:
- Браузер консольында қателерді тексеріңіз
- Network табында API сұрауларын тексеріңіз

---

## 🎉 Қорытынды

**Аутентификация жүйесі толығымен жұмыс істейді!**

- ✅ Backend API эндпоинттері
- ✅ SQL база операциялары
- ✅ Frontend интеграция
- ✅ Пароль қауіпсіздігі
- ✅ Error handling

Барлық негізгі функциялар тестіленді және дұрыс жұмыс істейді!


