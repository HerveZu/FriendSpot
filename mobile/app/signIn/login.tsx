import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { isEmail } from 'validator';
import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { notEmpty } from '~/lib/utils';
import LoginIllustration from '~/assets/login.svg';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [error, setError] = useState<string>();
  const auth = getAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthForm
        Illustration={LoginIllustration}
        title={<AuthFormTitle title="Se connecter" />}
        error={error}
        onSubmit={() =>
          signInWithEmailAndPassword(auth, email!, password!)
            .then(() => router.navigate('/my-spot'))
            .catch(() => {
              setError('Email ou mot de passe incorrect');
            })
        }
        submitText="Se connecter">
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
        <AuthFormInput
          value={password}
          onValueChange={setPassword}
          placeholder="Mot de passe"
          secure
          validators={[
            {
              validate: notEmpty,
            },
          ]}
        />
      </AuthForm>
    </SafeAreaView>
  );
}
