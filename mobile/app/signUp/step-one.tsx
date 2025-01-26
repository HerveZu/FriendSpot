import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { isEmail } from 'validator';

import { AuthForm, AuthFormInput } from '~/authentication/AuthForm';
import { HeroTitle } from '~/components/HeroTitle';
import { minLength, notEmpty } from '~/lib/utils';

export default function StepOneScreen() {
  const [displayName, setDisplayName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const router = useRouter();

  function handleSubmit(email: string) {
    router.push({
      pathname: '/signUp/step-two',
      params: { displayName, email },
    });
  }

  return (
    <SafeAreaView>
      <AuthForm
        title={<HeroTitle part1="Créer un" part2="compte" />}
        onSubmit={() => handleSubmit(email!)}
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
          validators={[
            {
              validate: (email) => !email || isEmail(email),
              message: "L'adresse e-mail n'est pas valide",
            },
            // todo
            // {
            //   validate: checkMailUnique,
            //   message: "Cette adresse e-mail est déjà utilisé",
            // },
            {
              validate: notEmpty,
            },
          ]}
        />
      </AuthForm>
    </SafeAreaView>
  );
}
