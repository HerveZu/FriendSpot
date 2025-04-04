import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, } from 'expo-router';
import { getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import { isEmail } from 'validator';
import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { notEmpty } from '~/lib/utils';
import LoginIllustration from '~/assets/login.svg';
import { firebaseAuth } from '~/authentication/firebase';
import { Modal } from '~/components/Modal';
import { ModalTitle } from '~/components/Modal';
import { sendEmailVerification} from "firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>(
    useLocalSearchParams<{ email: string }>().email || ''
  );
  const [password, setPassword] = useState<string>(
    useLocalSearchParams<{ password: string }>().password || ''
  );
  const [error, setError] = useState<string>();
  const [isOpen, setIsOpen] = useState(false)
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
    setIsOpen(false);
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return;
    }
    try {
      await sendEmailVerification(currentUser);
    } catch (error) {
      setError('Une erreur est survenue lors de l\'envoi de l\'email de vérification.');
    }
  }
  
  async function handleSubmit() {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email!, password!);
      if (!user.emailVerified) {
        setTimeout(() => {
          setIsOpen(true);
          setError('');
        }, 300);
        return;
      } else {
        router.push('/my-spot');
        setError('');
        setIsOpen(false);
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
      {isOpen && (
        <Modal open={isOpen} onOpenChange={setIsOpen}>
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
      )}
      <AuthForm
        Illustration={LoginIllustration}
        title={<AuthFormTitle title="Se connecter" />}
        error={error}
        onSubmit={() => handleSubmit()}
        submitText="Se connecter"
        preFilled={isPreFilled}
        displayForgotPassword={true}>
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
      </AuthForm>
    </SafeAreaView>
  );
}
