import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import id from './locales/id.json';
import en from './locales/en.json';

const resources = {
  id: {
    translation: id
  },
  en: {
    translation: en
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'id', // Default to Indonesian
    fallbackLng: 'id',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;