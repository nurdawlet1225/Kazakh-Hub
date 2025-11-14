import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import kkTranslations from './locales/kk.json';
import ruTranslations from './locales/ru.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      kk: {
        translation: kkTranslations,
      },
      ru: {
        translation: ruTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    lng: 'kk',
    fallbackLng: 'kk',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    // Қазақшаны әдепкі тіл ретінде орнату
    defaultNS: 'translation',
  });

export default i18n;

