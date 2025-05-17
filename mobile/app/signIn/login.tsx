import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
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
import { Validators } from '~/form/validators';

export default function LoginScreen() {
  const autoFillParams = useLocalSearchParams<{ email?: string; password?: string }>();

  const [email, setEmail] = useState<string>(autoFillParams.email || '');
  const [password, setPassword] = useState<string>(autoFillParams.password || '');
  const [error, setError] = useState<string>();
  const [isPendingMailModalOpen, setIsPendingMailModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    if (!autoFillParams.email || !autoFillParams.password) {
      return;
    }

    signInUser(autoFillParams.email, autoFillParams.password).then();
  }, [autoFillParams]);

  async function signInUser(email: string, password: string) {
    let signIn: UserCredential;
    try {
      signIn = await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Email ou mot de passe incorrect');
      return;
    }

    if (!signIn.user.emailVerified) {
      setIsPendingMailModalOpen(true);
      return;
    }

    router.push('/my-spot');
    setError(undefined);
    setIsPendingMailModalOpen(false);
    setIsResetPasswordModalOpen(false);
  }

  return (
    <>
      <MailConfirmationPendingModal
        open={isPendingMailModalOpen}
        onOpenChange={setIsPendingMailModalOpen}
        onError={setError}
      />
      <ResetPasswordModal
        open={isResetPasswordModalOpen}
        onOpenChange={setIsResetPasswordModalOpen}
      />
      <AuthForm
        Illustration={LoginIllustration}
        title={<AuthFormTitle title="Se connecter" />}
        error={error}
        onSubmit={() => signInUser(email!, password!)}
        submitText="Se connecter"
        autoTouch={!!autoFillParams}>
        <FormInput
          value={email}
          onValueChange={(value) => setEmail(value || '')}
          placeholder="Adresse email"
          inputMode="email"
          autoCapitalize="none"
          keyboardType="email-address"
          validators={[Validators.email, Validators.required]}
        />
        <FormInput
          value={password}
          onValueChange={(value) => setPassword(value || '')}
          placeholder="Mot de passe"
          secure
          validators={[Validators.required]}
        />
        <Pressable
          className="flex-row justify-center"
          onPress={() => setIsResetPasswordModalOpen(true)}>
          <Text variant="footnote" className="text-primary">
            Mot de passe oublié ?
          </Text>
        </Pressable>
      </AuthForm>
    </>
  );
}

function MailConfirmationPendingModal(props: ModalProps & { onError: (error: string) => void }) {
  async function sendEmail() {
    props.onOpenChange(false);

    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return;
    }

    try {
      await sendEmailVerification(currentUser);
    } catch {
      props.onError('Merci de réessayer ultérieurement.');
    }
  }

  return (
    <Modal {...props}>
      <ModalTitle text="Vérifie ta boîte mail !" />
      <View className="gap-4">
        <Text className="text-base text-foreground">
          Nous avons besoin que tu confirmes ton adresse e-mail pour finaliser ton inscription.
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-center text-xs text-foreground">Aucun email de reçu ?</Text>
          <Pressable onPress={() => sendEmail()}>
            <Text className="text-xs text-primary">Clique ici.</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ResetPasswordModal({ className, ...props }: ModalProps) {
  return (
    <Modal {...props} className={cn('gap-4', className)}>
      <ModalTitle text="Entre ton adresse e-mail" />
      <View className="flex-row items-center ">
        <Text className="text-sm text-foreground">
          On t’enverra un lien pour réinitialiser ton mot de passe. Assure-toi que l’adresse est
          valide.
        </Text>
      </View>

      <Form>
        <ResetPasswordForm />
      </Form>
    </Modal>
  );
}

function ResetPasswordForm() {
  const { isValid, handleSubmit, isLoading } = useContext(FormContext);

  const auth = getAuth();
  const { colors } = useColorScheme();

  const [email, setEmail] = useState<string>();
  const [resetEmailStatus, setResetEmailStatus] = useState('Envoyer');

  async function resetPassword(email: string) {
    setResetEmailStatus('Envoie en cours..');
    await sendPasswordResetEmail(auth, email);
    setResetEmailStatus('Un email a été envoyé');
  }

  return (
    <>
      <FormInput
        value={email}
        onValueChange={setEmail}
        placeholder="Adresse email"
        inputMode="email"
        autoCapitalize="none"
        keyboardType="email-address"
        validators={[Validators.email, Validators.required]}
      />
      <Button
        size={Platform.select({ default: 'md' })}
        disabled={!isValid}
        onPress={handleSubmit(() => resetPassword(email!))}
        variant="primary"
        className="w-full">
        {isLoading && <ActivityIndicator color={colors.foreground} />}
        <Text>{resetEmailStatus}</Text>
      </Button>
    </>
  );
}
