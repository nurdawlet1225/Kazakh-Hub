# Firebase Email/Password аутентификациясын қосу

## Қадам 1: Firebase Console-ға кіру

1. [Firebase Console](https://console.firebase.google.com/) сайтына барыңыз
2. Проектіңізді таңдаңыз: **kazakh-hub**

## Қадам 2: Authentication-ды қосу

1. Сол жақтағы менюден **Authentication** (Аутентификация) табын таңдаңыз
2. Егер Authentication бұрын қосылмаған болса, **Get started** батырмасын басыңыз

## Қадам 3: Sign-in method-ты қосу

1. **Sign-in method** (Кіру әдісі) табын ашыңыз
2. **Email/Password** әдісін таңдаңыз
3. **Enable** (Қосу) батырмасын басыңыз
4. **Email link (passwordless sign-in)** опциясын қосу/қоспау - бұл опционал
5. **Save** (Сақтау) батырмасын басыңыз

## Қадам 4: Google Sign-In-ді қосу (егер қосылмаған болса)

1. **Sign-in method** табында **Google** әдісін таңдаңыз
2. **Enable** батырмасын басыңыз
3. **Project support email** енгізіңіз (мысалы: your-email@gmail.com)
4. **Save** батырмасын басыңыз

## Қадам 5: Authorized Domains (Рұқсат етілген домендер) қосу

Егер "A valid domain name is required" қатесі көрінсе:

1. Firebase Console-да **Authentication** → **Settings** (Параметрлер) табына барыңыз
2. **Authorized domains** (Рұқсат етілген домендер) бөлімін табыңыз
3. **Add domain** (Домен қосу) батырмасын басыңыз
4. Келесі домендерді қосыңыз:
   - `localhost` (жергілікті дамыту үшін)
   - `127.0.0.1` (жергілікті дамыту үшін)
   - Егер production доменіңіз болса, оны да қосыңыз (мысалы: `myapp.com`)
5. Әр доменді қосқаннан кейін **Add** батырмасын басыңыз

**Ескерту:** Firebase автоматты түрде келесі домендерді қосады:
- `kazakh-hub.firebaseapp.com`
- `kazakh-hub.web.app`
- `localhost` (кейде автоматты қосылмайды, сондықтан қолмен қосу керек)

## Қадам 6: Google Cloud Console-да OAuth настройкасы (егер қате көрінсе)

Егер "A valid domain name is required" қатесі Google Cloud Console-да көрінсе:

1. [Google Cloud Console](https://console.cloud.google.com/) сайтына барыңыз
2. Проектіңізді таңдаңыз (Firebase проектіңізбен бірдей)
3. Сол жақтағы менюден **APIs & Services** → **Credentials** табына барыңыз
4. **OAuth 2.0 Client IDs** бөлімінде клиентті табыңыз (немесе жаңасын құрыңыз)
5. **Authorized JavaScript origins** бөлімінде:
   - `http://localhost:5173` (Vite үшін)
   - `http://localhost:3000` (егер басқа порт пайдалансаңыз)
   - `http://127.0.0.1:5173`
   - Production доменіңіз (егер бар болса)
6. **Authorized redirect URIs** бөлімінде:
   - `http://localhost:5173` (жергілікті дамыту үшін)
   - `https://kazakh-hub.firebaseapp.com/__/auth/handler`
   - Production доменіңіз (егер бар болса)
7. **Save** батырмасын басыңыз

**Маңызды:** Домендерді енгізген кезде тек домен атауын енгізіңіз (мысалы: `localhost` немесе `myapp.com`), протокол мен портты емес. Протокол мен порт тек OAuth redirect URI-лерде қажет.

## Тестілеу

Аутентификация қосылғаннан кейін:
1. Тіркелу бетінде email/password арқылы тіркелуді тексеріңіз
2. Кіру бетінде email/password арқылы кіруді тексеріңіз
3. Google Sign-In-ді тексеріңіз

## Ескерту

- Email/Password аутентификациясын қосқаннан кейін, барлық пайдаланушылар email және password арқылы тіркеле және кіре алады
- Google Sign-In үшін OAuth consent screen настройкасы қажет (егер қосылмаған болса)

