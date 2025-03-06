import React from 'react';
import { SafeAreaView, View, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { isEmail } from 'validator';
import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { notEmpty } from '~/lib/utils';
import Image1 from '~/assets/image1.svg';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [error, setError] = useState<string>();
  const auth = getAuth();
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <AuthForm
              title={<AuthFormTitle title="Se connecter" />}
              error={error}
              onSubmit={() =>
                signInWithEmailAndPassword(auth, email!, password!)
                  .then(() => router.navigate('/home'))
                  .catch(() => {
                    setError('Email ou mot de passe incorrect');
                  })
              }
              submitText="Se connecter"
            >
              <View className='items-center relative top-[-50px]'>
                <Image1 width={300} height={300} />
              </View>
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
        </ScrollView>
    </KeyboardAvoidingView>
  );
}