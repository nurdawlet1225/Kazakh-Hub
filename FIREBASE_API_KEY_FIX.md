# Firebase API Key қатесін шешу

## ❌ Қате
```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

## 🔍 Мүмкін себептер

1. **API key жарамсыз немесе өшірілген** - Firebase Console-да API key-ті өшірген болуыңыз мүмкін
2. **API key-ке шектеулер қойылған** - Google Cloud Console-да API key-ке домен немесе API шектеулері қойылған
3. **API key мерзімі өткен** - Кейбір жағдайларда API key-тер мерзімі өтеді
4. **API key дұрыс емес** - Кодта қате API key пайдаланылған

## ✅ Шешім

### Қадам 1: Firebase Console-да жаңа API key алу

1. [Firebase Console](https://console.firebase.google.com/) сайтына барыңыз
2. **kazakh-hub** проектіңізді таңдаңыз
3. Сол жақтағы ⚙️ **Project Settings** (Проект параметрлері) батырмасын басыңыз
4. Төменге скроллдап, **Your apps** бөлімінде веб-приложениеңызды табыңыз
5. **Config** (Конфигурация) бөлімінде келесі мәндерді көресіз:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`

### Қадам 2: API key-ті жаңарту

#### Вариант A: Environment variable пайдалану (Ұсынылады)

1. `frontend` папкасында `.env` файлын құрыңыз:

```bash
cd frontend
touch .env
```

2. `.env` файлына келесі мәндерді енгізіңіз (Firebase Console-дан алынған мәндермен):

```env
VITE_FIREBASE_API_KEY=AIzaSy... (Firebase Console-дан алынған жаңа API key)
VITE_FIREBASE_AUTH_DOMAIN=kazakh-hub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kazakh-hub
VITE_FIREBASE_STORAGE_BUCKET=kazakh-hub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=669228897264
VITE_FIREBASE_APP_ID=1:669228897264:web:095fe725a868d1eb768335
VITE_FIREBASE_MEASUREMENT_ID=G-N2X6FB3KXN
```

3. Development серверін қайта бастаңыз:

```bash
npm run dev
```

#### Вариант B: Кодта тікелей жаңарту

Егер environment variable пайдаланғыңыз келмесе, `frontend/src/utils/firebase.ts` файлында API key-ті тікелей жаңартыңыз:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSy...", // Firebase Console-дан алынған жаңа API key
  // ... басқа мәндер
};
```

### Қадам 3: Google Cloud Console-да API key шектеулерін тексеру

1. [Google Cloud Console](https://console.cloud.google.com/) сайтына барыңыз
2. **kazakh-hub** проектіңізді таңдаңыз
3. **APIs & Services** → **Credentials** табына барыңыз
4. API key-ті табып, ашыңыз
5. **API restrictions** бөлімінде:
   - Егер шектеулер қойылған болса, оларды тексеріңіз
   - **Firebase Authentication API** және **Cloud Firestore API** қосылған екеніне көз жеткізіңіз
6. **Application restrictions** бөлімінде:
   - Егер **HTTP referrers** таңдалған болса, домендеріңіздің қосылғанын тексеріңіз
   - `localhost` және `127.0.0.1` қосылған екеніне көз жеткізіңіз

### Қадам 4: API-ларды қосу

Егер API-лар қосылмаған болса:

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Library**
2. Келесі API-ларды іздеп, қосыңыз:
   - **Firebase Authentication API**
   - **Cloud Firestore API**
   - **Firebase Realtime Database API** (егер пайдалансаңыз)

### Қадам 5: Тестілеу

1. Браузерді толығымен жабып, қайта ашыңыз
2. Development серверін қайта бастаңыз
3. Браузер консольінде қателерді тексеріңіз
4. Firebase Authentication-ды тексеріңіз (тіркелу/кіру)

## 🔒 Қауіпсіздік ескертулері

- **API key-ті Git-ке коммиттемеңіз!** `.env` файлын `.gitignore`-ға қосыңыз
- Production-да environment variable-ларды пайдаланыңыз
- API key-ке домен шектеулерін қойыңыз (production үшін)

## 📝 Ескертулер

- Environment variable-ларды өзгерткеннен кейін development серверін қайта бастау керек
- Firebase настройкаларының жүктелуіне 5-10 минут уақыт кетуі мүмкін
- Егер қате жалғаса, Firebase Console-да API key-ті жаңадан құруды көріңіз

## 🆘 Қосымша көмек

Егер мәселе шешілмесе:
1. Firebase Console-да **Project Settings** → **General** → **Your apps** бөлімінде жаңа веб-приложение құрыңыз
2. Жаңа конфигурация мәндерін алып, кодта жаңартыңыз






