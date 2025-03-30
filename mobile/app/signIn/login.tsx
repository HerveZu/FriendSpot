import React, { useState } from 'react';
import { SafeAreaView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
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
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [error, setError] = useState<string>();
  const [isOpen, setIsOpen] = useState(false)

  const auth = getAuth();
  const router = useRouter();

  async function sendEmail() {
    setIsOpen(false);
    if (!firebaseAuth.currentUser) {
      return;
    }
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
    } catch (error) {
      setError('Une erreur est survenue lors de l\'envoi de l\'email de vérification.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {isOpen && (
        <Modal open={isOpen} onOpenChange={setIsOpen}>
            <ModalTitle text='Oups !'/>
            <View className='gap-2'>
                <Text className='text-foreground text-base'>
                    Tu as oublié de valider ton email.  
                </Text>
                  <View className='flex-row items-center gap-2'>
                  <Text className='text-foreground text-center '>Aucun email de reçu ?</Text>
                    <Pressable onPress={(() => sendEmail())}>
                      <Text className='text-primary'>Clique ici.</Text>
                    </Pressable>
                  </View>
            </View>
        </Modal>
      )}
      <AuthForm
        Illustration={LoginIllustration}
        title={<AuthFormTitle title="Se connecter" />}
        error={error}
        onSubmit={async () => {
              try {
                const { user } = await signInWithEmailAndPassword(auth, email!, password!);
                if (!user.emailVerified) {
                  setTimeout(() => {
                    setIsOpen(true);
                  }, 300);
                  return;
                } else {
                  router.push('/my-spot');
                }
              } catch {
                setError('Email ou mot de passe incorrect');
              }
        }}
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
