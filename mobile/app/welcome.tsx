import { Link } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import Logo from '~/assets/logo.svg';
import { Screen } from '~/components/Screen';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

export default function WelcomeScreen() {
  return (
    <Screen className="items-center justify-around">
      <View className="flex flex-col gap-2">
        <Text variant="largeTitle" className="text-center">
          Bienvenue sur
        </Text>
        <Text variant="largeTitle" className="text-center font-bold text-primary">
          FriendSpot
        </Text>
      </View>
      <Logo height={250} />
      <View className="flex-grow-2 w-full items-center gap-6">
        <View className="flex w-full flex-col items-center gap-4 p-4">
          <Link href="/signIn/login" asChild>
            <Button className="w-full" size={'lg'}>
              <Text className={'w-full text-center'}>Se connecter</Text>
            </Button>
          </Link>
          <Link href="/signUp/step-one" asChild>
            <Button className="w-full" variant="secondary" size={'lg'}>
              <Text className={'w-full text-center'}>Créer un compte</Text>
            </Button>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
