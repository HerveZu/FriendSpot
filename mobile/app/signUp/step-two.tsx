import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import stepTwoIllustration from '~/assets/security.svg';

import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { firebaseAuth } from '~/authentication/firebase';
import { notEmpty } from '~/lib/utils';
import { Text } from '~/components/nativewindui/Text';
import { ExternalLink } from '~/components/ExternalLink';
import { Checkbox } from '~/components/Checkbox';

function strongPassword(password?: string) {
  return !!password && password.length >= 6;
}

export default function StepTwoScreen() {
  const [password, setPassword] = useState<string>();
  const [passwordConfirm, setPasswordConfirm] = useState<string>();
  const [error, setError] = useState<string>();
  const [userHasConfirmed, setUserHasConfirmed] = useState(false);
  const { displayName, email } = useLocalSearchParams<{ displayName: string; email: string }>();

  const router = useRouter();

  async function createAccount() {
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password!);
      await updateProfile(result.user, { displayName }).then(() =>
        router.navigate('/user-profile')
      );
    } catch (e) {
      console.error(e);
      setError('Cette adresse e-mail est déjà utilisée.');
    }
  }

  if (!email || !displayName) {
    return <Redirect href="/signUp/step-one" />;
  }

  return (
    <SafeAreaView>
      <AuthForm
        Illustration={stepTwoIllustration}
        error={error}
        title={<AuthFormTitle title="Créer un compte" />}
        disabled={!userHasConfirmed}
        onSubmit={createAccount}
        submitText="S'inscrire"
        submitCaption={
          <View className={'w-full flex-row items-center gap-4'}>
            <Checkbox value={userHasConfirmed} onValueChange={setUserHasConfirmed} />
            <Text variant={'caption1'}>
              Je confirme avoir lu et accepter{' '}
              <ExternalLink
                url={process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? ''}
                variant={'caption1'}
                className={'break-words text-primary'}>
                notre politique de confidentialité
              </ExternalLink>
              .
            </Text>
          </View>
        }>
        <AuthFormInput
          value={password}
          onValueChange={setPassword}
          placeholder="Mot de passe"
          secure
          validators={[
            {
              validate: strongPassword,
              message: 'Le mot de passe doit contenir au moins 6 caractères.',
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
              message: 'Les mots de passes ne sont pas identiques.',
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
