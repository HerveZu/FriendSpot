import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import enTrad from './locales/en.json';
import frTrad from './locales/fr.json';
import ukTrad from './locales/uk.json';
import { setDefaultOptions } from 'date-fns';
import { enGB, enUS, fr, Locale, uk } from 'date-fns/locale';

const resources = {
  en: {
    translation: enTrad,
  },
  fr: {
    translation: frTrad,
  },
  uk: {
    translation: ukTrad,
  },
};

export const deviceLocale = getLocales()[0];

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLocale?.languageCode ?? undefined,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  'en-US': enUS,
  'en-GB': enGB,
  fr: fr,
  uk: uk,
};

export function getDateFnsLocale() {
  return (
    dateFnsLocales[deviceLocale.languageTag] ?? dateFnsLocales[deviceLocale.languageCode ?? 'en']
  );
}

setDefaultOptions({ locale: getDateFnsLocale() });
