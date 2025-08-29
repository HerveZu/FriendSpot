import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
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
import { useRedirectToInitialUrl } from '~/authentication/useRedirectToInitialUrl';
import { urls } from '~/lib/urls';

function strongPassword(password?: string) {
  return !!password && password.length >= 6;
}

export default function StepTwoScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState<string>();
  const [passwordConfirm, setPasswordConfirm] = useState<string>();
  const [error, setError] = useState<string>('');
  const [userHasConfirmed, setUserHasConfirmed] = useState(false);

  const { displayName, email } = useLocalSearchParams<{ displayName: string; email: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const redirectToInitialUrl = useRedirectToInitialUrl();
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
    const user = firebaseAuth.currentUser;

    await user?.reload();
    if (user?.emailVerified) {
      setIsModalVisible(false);
      redirectToInitialUrl('/');
    } else {
      setError(t('auth.signUp.errors.emailNotVerified'));
    }
  }

  async function sendEmail() {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return;
    }

    try {
      await sendEmailVerification(currentUser);
    } catch {
      setError(t('auth.errors.tryAgainLater'));
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
            <View className="flex-row items-center gap-2">
              <Text className="text-md text-center text-foreground">
                {t('auth.mailConfirmation.noEmailReceived')}
              </Text>
              <Pressable onPress={() => sendEmail()}>
                <Text className="text-md text-primary">{t('auth.mailConfirmation.clickHere')}</Text>
              </Pressable>
            </View>
            {error && <Text className="text-sm text-destructive">{error}</Text>}
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
          <Text className={'text-sm'}>
            {t('auth.signUp.confirmDocuments.confirm')}{' '}
            <ExternalLink url={urls.privacyPolicy} className={'break-words text-sm text-primary'}>
              {t('auth.signUp.confirmDocuments.privacyPolicy')}
            </ExternalLink>{' '}
            {t('auth.signUp.confirmDocuments.and')}{' '}
            <ExternalLink url={urls.termsOfUse} className={'break-words text-sm text-primary'}>
              {t('auth.signUp.confirmDocuments.termsOfUse')}
            </ExternalLink>
            .
          </Text>
        </View>
      </AuthForm>
    </>
  );
}
