import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import stepTwoIllustration from '~/assets/security.svg';
import { Modal, ModalTitle } from '~/components/Modal';
import { AuthForm, AuthFormTitle } from '~/authentication/AuthForm';
import { firebaseAuth } from '~/authentication/firebase';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { ExternalLink } from '~/components/ExternalLink';
import { Checkbox } from '~/components/Checkbox';
import { FormInput } from '~/form/FormInput';
import { useValidators } from '~/form/validators';

function strongPassword(password?: string) {
  return !!password && password.length >= 6;
}

export default function StepTwoScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState<string>();
  const [passwordConfirm, setPasswordConfirm] = useState<string>();
  const [error, setError] = useState<string>();
  const [userHasConfirmed, setUserHasConfirmed] = useState(false);

  const { displayName, email } = useLocalSearchParams<{ displayName: string; email: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const validators = useValidators();

  async function createAccount() {
    let signUp: UserCredential;

    try {
      signUp = await createUserWithEmailAndPassword(firebaseAuth, email, password!);
    } catch (e) {
      console.error(e);
      setError(t('auth.signUp.errors.emailAlreadyInUse'));
      return;
    }

    await updateProfile(signUp.user, { displayName });
    await sendEmailVerification(signUp.user);
    setIsModalVisible(true);
  }

  if (!email || !displayName) {
    return <Redirect href="/signUp/step-one" />;
  }

  async function checkIfEmailIsVerified() {
    const user = getAuth().currentUser;
    console.log(user);

    await user?.reload();
    if (user?.emailVerified) {
      setIsModalVisible(false);
      router.push({
        pathname: '/my-spot',
      });
    } else {
      setError(t('auth.signUp.errors.emailNotVerified'));
      console.log('email not verified');
    }
  }

  return (
    <>
      {isModalVisible && (
        <Modal
          open={isModalVisible}
          onOpenChange={setIsModalVisible}
          onBackdropPress={() => router.push({ pathname: '/welcome' })}
          vibration={true}>
          <ModalTitle text={t('auth.signUp.almostDone')} />
          <View className="gap-4">
            <Text className="text-base text-foreground">
              {t('auth.signUp.checkEmailAndConfirm')}
            </Text>
            <Button size={'lg'} onPress={() => checkIfEmailIsVerified()}>
              <Text className="text-foreground">{t('auth.signUp.done')}</Text>
            </Button>
          </View>
        </Modal>
      )}
      <AuthForm
        Illustration={stepTwoIllustration}
        error={error}
        title={<AuthFormTitle title={t('auth.createAccount')} />}
        onSubmit={createAccount}
        submitText={t('auth.signUp.signUp')}
        disabled={!userHasConfirmed}>
        <FormInput
          value={password}
          onValueChange={setPassword}
          placeholder={t('auth.password')}
          secure
          validators={[
            {
              validate: strongPassword,
              errorMessage: t('auth.signUp.errors.passwordTooShort'),
            },
          ]}
        />
        <FormInput
          value={passwordConfirm}
          onValueChange={setPasswordConfirm}
          placeholder={t('auth.signUp.confirmPassword')}
          secure
          validators={[
            {
              validate: (confirm?: string) => !confirm || confirm === password,
              errorMessage: t('auth.signUp.errors.passwordsDoNotMatch'),
            },
            validators.required,
          ]}
        />
        <View className={'mt-4 w-full flex-row items-center gap-4'}>
          <Checkbox
            value={userHasConfirmed}
            onValueChange={(value) => setUserHasConfirmed(value)}
          />
          <Text variant={'caption1'}>
            {t('auth.signUp.confirmPrivacyPolicy.part1')}{' '}
            <ExternalLink
              url={process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? ''}
              variant={'caption1'}
              className={'break-words text-primary'}>
              {t('auth.signUp.confirmPrivacyPolicy.part2')}
            </ExternalLink>
            .
          </Text>
        </View>
      </AuthForm>
    </>
  );
}
