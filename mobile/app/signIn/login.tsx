import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, } from 'expo-router';
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword} from 'firebase/auth';
import { isEmail } from 'validator';
import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { notEmpty } from '~/lib/utils';
import LoginIllustration from '~/assets/login.svg';
import { firebaseAuth } from '~/authentication/firebase';
import { Modal } from '~/components/Modal';
import { ModalTitle } from '~/components/Modal';
import { sendEmailVerification} from "firebase/auth";
import { Button } from '~/components/nativewindui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>(
    useLocalSearchParams<{ email: string }>().email || ''
  );
  const [password, setPassword] = useState<string>(
    useLocalSearchParams<{ password: string }>().password || ''
  );
  const [error, setError] = useState<string>();
  const [isModalConfirmEmailOpen, setIsModalConfirmEmail] = useState(false)
  const [isPreFilled, setIsPreFilled] = useState(false)
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    if (!email && !password) {
      return
    }
      setIsPreFilled(true);
      handleSubmit()
  }, []);

  async function sendEmail() {
    setIsModalConfirmEmail(false);
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return;
    }
    try {
      await sendEmailVerification(currentUser);
    } catch (error) {
      setError('Merci de réessayer ultérieurement.');
    }
  }
  
  async function handleSubmit() {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email!, password!);
      if (!user.emailVerified) {
        setTimeout(() => {
          setIsModalConfirmEmail(true);
          setError('');
        }, 300);
        return;
      } else {
        router.push('/my-spot');
        setError('');
        setIsModalConfirmEmail(false);
        setIsPreFilled(false);
      }
    }
    catch (error) {
      if (error instanceof Error) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Une erreur est survenue lors de la connexion.');
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
        <Modal open={isModalConfirmEmailOpen} onOpenChange={setIsModalConfirmEmail}>
            <ModalTitle text='Vérifie ta boîte mail !'/>
            <View className='gap-4'>
                <Text className='text-foreground text-base'>
                  Nous avons besoin que tu confirmes ton adresse e-mail pour finaliser ton inscription.  
                </Text>
                  <View className='flex-row items-center gap-2'>
                  <Text className='text-foreground text-center text-xs'>Aucun email de reçu ?</Text>
                    <Pressable onPress={(() => sendEmail())}>
                      <Text className='text-primary text-xs'>Clique ici.</Text>
                    </Pressable>
                  </View>
            </View>
        </Modal>
      <AuthForm
        Illustration={LoginIllustration}
        title={<AuthFormTitle title="Se connecter" />}
        error={error}
        onSubmit={() => handleSubmit()}
        submitText="Se connecter"
        autoTouch={isPreFilled}>
        <AuthFormInput
          value={email}
          onValueChange={(value) => setEmail(value || '')}
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
          onValueChange={(value) => setPassword(value || '')}
          placeholder="Mot de passe"
          secure
          validators={[
            {
              validate: notEmpty,
            },
          ]}
        />
          <Pressable className="flex-row justify-center" onPress={() => setIsOpen(true)}>
            <Text variant="footnote" className="text-foreground">
              Mot de passe oublié ?
            </Text>
          </Pressable>
      </AuthForm>
    </SafeAreaView>
  );
}

function ResetPassordModal() {

  const [isOpen, setIsOpen] = useState(false)
  const auth = getAuth();

  const [email, setEmail] = useState<string>()
   const [resetEmailStatus, setResetEmailStatus] = useState('Envoyer');

   async function resetPassword(email: string) {
      try {
        setResetEmailStatus('Envoie en cours..');
        await sendPasswordResetEmail(auth, email)
        setResetEmailStatus('Un email a été envoyé');
      } catch (error) {
        console.error(error);
      }
    }

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen} className='gap-4'>
          <ModalTitle text='Entre ton adresse e-mail'/>
          <View className='flex-row items-center '>
              <Text className='text-foreground text-sm'>On t’enverra un lien pour réinitialiser ton mot de passe. Assure-toi que l’adresse est valide.</Text>
          </View>
          <AuthFormInput
            value={email}
            onValueChange={(value) => setEmail(value || '')}
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
          <Button
            size={Platform.select({ default: 'md' })}
            disabled={!isTouched && (!autoTouch || inputErrors.length > 0)}
            onPress={() => email && resetPassword(email)}
            variant="primary"
            className="w-full">
            {pendingAction && <ActivityIndicator color={colors.foreground} />}
            <Text>{resetEmailStatus}</Text>
          </Button>
    </Modal>
  )
}


