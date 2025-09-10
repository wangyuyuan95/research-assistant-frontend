import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '@/locales/en.json';
import zhTranslations from '@/locales/zh.json';
import zhTwTranslations from '@/locales/zh-TW.json';

const initI18n = () => {
  return i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: process.env.NODE_ENV === 'development',
      fallbackLng: 'en',
      lng: undefined, // Let LanguageDetector determine the language
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          translation: enTranslations,
        },
        zh: {
          translation: zhTranslations,
        },
        'zh-TW': {
          translation: zhTwTranslations,
        },
        'zh-HK': {
          translation: zhTwTranslations,
        },
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
    });
};

// Initialize i18n
initI18n();

export default i18n; 