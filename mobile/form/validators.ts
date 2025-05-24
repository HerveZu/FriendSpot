import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Validator } from '~/form/FormInput';

export function useValidators() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      required: {
        validate: (value: string) => value != null && value.length > 0,
        errorMessage: t('validation.required'),
      } as Validator,
      email: {
        validate: (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        errorMessage: t('validation.invalidEmail'),
      } as Validator,
    }),
    [t]
  );
}
