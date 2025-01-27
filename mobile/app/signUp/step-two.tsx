import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { firebaseAuth } from '~/authentication/firebase';
import { notEmpty } from '~/lib/utils';

function strongPassword(password?: string) {
  return !!password && password.length >= 6;
}

export default function StepTwoScreen() {
  const [password, setPassword] = useState<string>();
  const [passwordConfirm, setPasswordConfirm] = useState<string>();
  const [error, setError] = useState<string>();
  const { displayName, email } = useLocalSearchParams<{ displayName: string; email: string }>();

  const router = useRouter();

  function createAccount() {
    createUserWithEmailAndPassword(firebaseAuth, email, password!)
      .then((result) => {
        updateProfile(result.user, { displayName }).then(() => router.navigate('/home'));
      })
      .catch((e) => {
        console.error(e);
        setError('Cette addresse e-mail est déjà utilisé');
      });
  }

  if (!email || !displayName) {
    return <Redirect href="/signUp/step-one" />;
  }

  return (
    <SafeAreaView>
      <AuthForm
        error={error}
        title={<AuthFormTitle title="Créer un compte" />}
        onSubmit={createAccount}
        submitText="S'inscrire">
        <AuthFormInput
          value={password}
          onValueChange={setPassword}
          placeholder="Mot de passe"
          secure
          validators={[
            {
              validate: strongPassword,
              message: 'Le mot de passe doit faire 6 charactères de long',
            },
          ]}
        />
        <AuthFormInput
          value={passwordConfirm}
          onValueChange={setPasswordConfirm}
          placeholder="Confirmer le mot de passe"
          secure
          validators={[
            {
              validate: (confirm?: string) => !confirm || confirm === password,
              message: 'Les mots de passes ne sont pas identiques',
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
