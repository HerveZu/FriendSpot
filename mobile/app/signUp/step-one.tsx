import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import profileIllustration from '~/assets/profile.svg';

import { AuthForm, AuthFormTitle } from '~/authentication/AuthForm';
import { minLength } from '~/lib/utils';
import { Validators } from '~/form/validators';
import { FormInput } from '~/form/FormInput';

export default function StepOneScreen() {
  const [displayName, setDisplayName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const router = useRouter();

  function goToStep2(email: string) {
    router.push({
      pathname: '/signUp/step-two',
      params: { displayName, email },
    });
  }

  return (
    <AuthForm
      Illustration={profileIllustration}
      title={<AuthFormTitle title="Créer un compte" />}
      onSubmit={async () => goToStep2(email!)}
      submitText="Suivant">
      <FormInput
        value={displayName}
        onValueChange={setDisplayName}
        placeholder="Nom d'utilisateur"
        validators={[
          {
            validate: minLength(3),
            errorMessage: "Nom d'utilisateur trop court",
          },
          Validators.required,
        ]}
      />
      <FormInput
        value={email}
        onValueChange={setEmail}
        placeholder="Adresse email"
        inputMode="email"
        autoCapitalize="none"
        keyboardType="email-address"
        validators={[Validators.email, Validators.required]}
      />
    </AuthForm>
  );
}
