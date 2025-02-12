import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { isEmail } from 'validator';

import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { minLength, notEmpty } from '~/lib/utils';

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
    <SafeAreaView>
      <AuthForm
        title={<AuthFormTitle title="Créer un compte" />}
        onSubmit={async () => goToStep2(email!)}
        submitText="Suivant">
        <AuthFormInput
          value={displayName}
          onValueChange={setDisplayName}
          placeholder="Nom d'utilisateur"
          validators={[
            {
              validate: minLength(3),
              message: "Nom d'utilisateur trop court",
            },
            {
              validate: notEmpty,
            },
          ]}
        />
        <AuthFormInput
          value={email}
          onValueChange={setEmail}
          placeholder="Adresse email"
          inputMode="email"
          autoCapitalize="none"
          keyboardType="email-address"
          validators={[
            {
              validate: (email) => !email || isEmail(email),
              message: "L'adresse e-mail n'est pas valide",
            },
            {
              validate: notEmpty,
            },
          ]}
        />
      </AuthForm>
    </SafeAreaView>
  );
}
