import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

const deviceLanguage = getLocales()[0].languageCode;

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage ?? undefined,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // not needed
  },
});

export default i18n;
