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
3. **Project support email** енгізіңіз
4. **Save** батырмасын басыңыз

## Тестілеу

Аутентификация қосылғаннан кейін:
1. Тіркелу бетінде email/password арқылы тіркелуді тексеріңіз
2. Кіру бетінде email/password арқылы кіруді тексеріңіз
3. Google Sign-In-ді тексеріңіз

## Ескерту

- Email/Password аутентификациясын қосқаннан кейін, барлық пайдаланушылар email және password арқылы тіркеле және кіре алады
- Google Sign-In үшін OAuth consent screen настройкасы қажет (егер қосылмаған болса)

