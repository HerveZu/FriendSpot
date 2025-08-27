import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { AuthForm, AuthFormTitle } from '~/authentication/AuthForm';
import LoginIllustration from '~/assets/login.svg';
import { firebaseAuth } from '~/authentication/firebase';
import { Modal, ModalProps, ModalTitle } from '~/components/Modal';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { Form, FormContext } from '~/form/Form';
import { FormInput } from '~/form/FormInput';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/cn';
import { useValidators } from '~/form/validators';
import { FormInfo, FormMessages } from '~/form/FormMessages';
import { useRedirectToInitialUrl } from '~/authentication/useRedirectToInitialUrl';

export default function LoginScreen() {
  const { t } = useTranslation();
  const autoFillParams = useLocalSearchParams<{ email?: string; password?: string }>();

  const [email, setEmail] = useState<string>(autoFillParams.email || '');
  const [password, setPassword] = useState<string>(autoFillParams.password || '');
  const [error, setError] = useState<string>();
  const [isPendingMailModalOpen, setIsPendingMailModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const redirectToInitialUrl = useRedirectToInitialUrl();
  const validators = useValidators();

  useEffect(() => {
    if (!autoFillParams.email || !autoFillParams.password) {
      return;
    }

    signInUser(autoFillParams.email, autoFillParams.password).then();
  }, [autoFillParams]);

  async function signInUser(email: string, password: string) {
    let signIn: UserCredential;
    try {
      signIn = await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch {
      setError(t('auth.login.errors.incorrectCredentials'));
      return;
    }

    if (!signIn.user.emailVerified) {
      setIsPendingMailModalOpen(true);
      return;
    }

    setError(undefined);
    setIsPendingMailModalOpen(false);
    setIsResetPasswordModalOpen(false);
    redirectToInitialUrl('/');
  }

  return (
    <>
      <MailConfirmationPendingModal
        open={isPendingMailModalOpen}
        onOpenChange={setIsPendingMailModalOpen}
      />
      <ResetPasswordModal
        open={isResetPasswordModalOpen}
        onOpenChange={setIsResetPasswordModalOpen}
      />
      <AuthForm
        Illustration={LoginIllustration}
        title={<AuthFormTitle title={t('auth.login.title')} />}
        error={error}
        onSubmit={() => signInUser(email!, password!)}
        submitText={t('auth.login.title')}
        autoTouch={!!autoFillParams}>
        <FormInput
          value={email}
          onValueChange={(value) => setEmail(value || '')}
          placeholder={t('auth.email')}
          inputMode="email"
          autoCapitalize="none"
          keyboardType="email-address"
          validators={[validators.email, validators.required]}
        />
        <FormInput
          value={password}
          onValueChange={(value) => setPassword(value || '')}
          placeholder={t('auth.password')}
          secure
          validators={[validators.required]}
        />
        <Pressable
          className="flex-row justify-center"
          onPress={() => setIsResetPasswordModalOpen(true)}>
          <Text variant="footnote" className="text-primary">
            {t('auth.login.forgotPassword')}
          </Text>
        </Pressable>
      </AuthForm>
    </>
  );
}

function MailConfirmationPendingModal(props: ModalProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    props.open && setMessage('');
  }, [props.open]);

  async function sendEmail() {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return;
    }

    try {
      await sendEmailVerification(currentUser).then(() => {
        setMessage(t('auth.signUp.errors.emailRequestPending'));
      });
    } catch {
      setMessage(t('auth.errors.tryAgainLater'));
    }
  }

  async function checkIfEmailIsVerified() {
    const user = firebaseAuth.currentUser;

    await user?.reload();
    if (user?.emailVerified) {
      props.onOpenChange(false);
    } else {
      setMessage(t('auth.signUp.errors.emailNotVerified'));
    }
  }

  return (
    <Modal {...props}>
      <ModalTitle text={t('auth.mailConfirmation.title')} />
      <View className="gap-4">
        <Text className="text-base text-foreground">{t('auth.mailConfirmation.description')}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-md text-center text-foreground">
            {t('auth.mailConfirmation.noEmailReceived')}
          </Text>
          <Pressable onPress={() => sendEmail()}>
            <Text className="text-md text-primary">{t('auth.mailConfirmation.clickHere')}</Text>
          </Pressable>
        </View>
        {message && <Text className="text-md text-destructive">{message}</Text>}
        <Button variant="primary" className="mt-2" onPress={() => checkIfEmailIsVerified()}>
          <Text>{t('common.done')}</Text>
        </Button>
      </View>
    </Modal>
  );
}

function ResetPasswordModal({ className, ...props }: ModalProps) {
  const { t } = useTranslation();

  return (
    <Modal {...props} className={cn('gap-4', className)}>
      <ModalTitle text={t('auth.resetPassword.title')} />
      <View className="flex-row items-center ">
        <Text className="text-sm text-foreground">{t('auth.resetPassword.description')}</Text>
      </View>

      <ResetPasswordForm />
    </Modal>
  );
}

function ResetPasswordForm() {
  const { t } = useTranslation();

  const { colors } = useColorScheme();
  const validators = useValidators();

  const [email, setEmail] = useState<string>();
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();

  async function resetPassword(email: string) {
    setInfo(t('auth.resetPassword.sending'));
    await sendPasswordResetEmail(firebaseAuth, email)
      .then(() => setInfo(t('auth.resetPassword.emailSent')))
      .catch((e: Error) => setError(e.message));
  }

  return (
    <Form>
      {({ isValid, handleSubmit, isLoading }) => (
        <>
          <FormInput
            value={email}
            onValueChange={setEmail}
            placeholder={t('auth.email')}
            inputMode="email"
            autoCapitalize="none"
            keyboardType="email-address"
            validators={[validators.email, validators.required]}
          />
          {error && <FormMessages>{error}</FormMessages>}
          {info && <FormInfo>{info}</FormInfo>}
          <Button
            size={Platform.select({ default: 'md' })}
            disabled={!isValid}
            onPress={handleSubmit(() => resetPassword(email!))}
            variant="primary"
            className="w-full">
            {isLoading && <ActivityIndicator color={colors.foreground} />}
            <Text>Envoyer</Text>
          </Button>
        </>
      )}
    </Form>
  );
}
