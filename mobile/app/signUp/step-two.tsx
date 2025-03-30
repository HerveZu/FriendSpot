import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, User } from 'firebase/auth';
import React, { useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import stepTwoIllustration from '~/assets/security.svg';
import { Modal, ModalTitle } from '~/components/Modal';
import { sendEmailVerification} from "firebase/auth";
import { AuthForm, AuthFormInput, AuthFormTitle } from '~/authentication/AuthForm';
import { firebaseAuth } from '~/authentication/firebase';
import { notEmpty } from '~/lib/utils';
import { Button } from '~/components/nativewindui/Button';


function strongPassword(password?: string) {
  return !!password && password.length >= 6;
}

export default function StepTwoScreen() {
  const [password, setPassword] = useState<string>();
  const [passwordConfirm, setPasswordConfirm] = useState<string>();
  const [error, setError] = useState<string>();
  const { displayName, email } = useLocalSearchParams<{ displayName: string; email: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  async function sendEmail(result: { user: User }) {
    setIsModalVisible(true);
    if (result.user) {
      sendEmailVerification(result.user)
    } else {
      console.error("No authenticated user found.");
    }
  }
  
  async function createAccount() {
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password!);
      await updateProfile(result.user, { displayName });
      if(error) {
        return
      } else {
        sendEmail(result);
      }
    } catch (e) {
      console.error(e);
      setError('Cette adresse e-mail est déjà utilisée.');
    }
  }

  if (!email || !displayName) {
    return <Redirect href="/signUp/step-one" />;
  }

  function redirect() {
    setIsModalVisible(false)
    router.push('/signIn/login')
  }

  return (
    <SafeAreaView>
      {isModalVisible && (
          <Modal
            open={isModalVisible}
            onOpenChange={setIsModalVisible}
          >
          <ModalTitle text={"Vérification de votre email"} />
            <View className='gap-4'>
              <Text className='text-foreground text-base'>{`Un e-mail a été envoyé à ${email} pour validation.`}</Text>
              <Button size={'lg'} onPress={() => redirect()}>
                <Text className='text-foreground'>
                  C'est fait !
                </Text>
              </Button>
            </View>
          </Modal>
        )}
      <AuthForm
        Illustration={stepTwoIllustration}
        error={error}
        title={<AuthFormTitle title="Créer un compte" />}
        onSubmit={createAccount}
        submitText="S'inscrire">
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
