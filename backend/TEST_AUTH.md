# Аутентификацияны тестілеу

## ✅ База файлы
База файлы дұрыс құрылған: `backend/data/kazakh_hub.db` (20KB)

## 🧪 Тестілеу әдістері

### 1. Frontend арқылы тестілеу (Ұсынылады)

1. **Серверді іске қосыңыз:**
   ```bash
   cd backend
   source venv/bin/activate
   python3 main.py
   ```

2. **Frontend-ті іске қосыңыз:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Браузерде тестілеңіз:**
   - `http://localhost:5174/register` - Тіркелу бетіне барыңыз
   - Жаңа пайдаланушы тіркеңіз:
     - Пайдаланушы аты: `testuser`
     - Email: `test@example.com`
     - Құпия сөз: `test123456`
   - Тіркелуден кейін `/login` бетіне барып кіріңіз

### 2. API арқылы тестілеу (curl)

#### Регистрация тесті:
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

#### Логин тесті (Email арқылы):
```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

#### Логин тесті (Username арқылы):
```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
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
  "message": "Login successful"
}
```

### 3. Python скрипті арқылы тестілеу

```bash
cd backend
source venv/bin/activate
python3 test_auth.py
```

## ✅ Тестілеу нәтижелері

Егер барлығы дұрыс жұмыс істесе, сіз көресіз:
- ✅ База инициализацияланған
- ✅ Парольдер хэштелген
- ✅ Парольдер тексеріледі
- ✅ Пайдаланушылар құрылады
- ✅ Пайдаланушылар ізделеді
- ✅ Логин жұмыс істейді

## ⚠️ Егер қате көрінсе:

1. **SQLAlchemy орнатылмаған:**
   ```bash
   pip install sqlalchemy bcrypt
   ```

2. **База қатесі:**
   - `backend/data/` папкасында жазу құқығы бар екенін тексеріңіз
   - База файлын жойып, қайта құрыңыз

3. **Сервер қатесі:**
   - Серверді қайта іске қосыңыз
   - Консольда қателерді тексеріңіз

## 📝 Ескертулер

- Барлық парольдер bcrypt арқылы хэштеледі
- Пайдаланушылар SQLite базасында сақталады
- Email және username бойынша логин жұмыс істейді
- Firebase енді қажет емес


