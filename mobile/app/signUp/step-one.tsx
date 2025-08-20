import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import profileIllustration from '~/assets/profile.svg';

import { AuthForm, AuthFormTitle } from '~/authentication/AuthForm';
import { minLength } from '~/lib/utils';
import { FormInput } from '~/form/FormInput';
import { useValidators } from '~/form/validators';

export default function StepOneScreen() {
  const [displayName, setDisplayName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const router = useRouter();
  const { t } = useTranslation();
  const validators = useValidators();

  function goToStep2(email: string) {
    router.push({
      pathname: '/signUp/step-two',
      params: { displayName, email },
    });
  }

  return (
    <AuthForm
      Illustration={profileIllustration}
      title={<AuthFormTitle title={t('auth.createAccount')} />}
      onSubmit={async () => goToStep2(email!)}
      submitText={t('common.next')}>
      <FormInput
        value={displayName}
        onValueChange={setDisplayName}
        placeholder={t('auth.username')}
        validators={[
          {
            validate: minLength(3),
            errorMessage: t('auth.errors.usernameTooShort'),
          },
          validators.required,
        ]}
      />
      <FormInput
        value={email}
        onValueChange={setEmail}
        placeholder={t('auth.email')}
        inputMode="email"
        autoCapitalize="none"
        keyboardType="email-address"
        validators={[validators.email, validators.required]}
      />
    </AuthForm>
  );
}
