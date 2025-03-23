import { fr, Locale } from 'date-fns/locale';

export function getCurrentLocale(): Locale {
  return fr;
}

export function pluralize(array: any, suffix = 's') {
  // this is a quick fix, we should use i18n to
  // handle more complex cases & other languages
  if (array > 1) {
    return suffix;
  }
  return '';
}
