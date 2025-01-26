import { Link } from 'expo-router';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContentView from '~/components/ContentView';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

export default function WelcomeScreen() {
  return (
    <SafeAreaView>
      <ContentView className="items-center justify-evenly">
        <View className="flex flex-col gap-2">
          <Text variant="largeTitle" className="text-center">
            Bienvenue sur
          </Text>
          <Text variant="largeTitle" className="text-center font-bold text-primary">
            FriendSpot
          </Text>
        </View>
        <View className="flex-grow-2 w-full items-center gap-6">
          <View className="flex w-full flex-col items-center gap-4 p-4">
            <Link href="/signIn/login" asChild>
              <Button className="w-full" size={Platform.select({ ios: 'lg', default: 'md' })}>
                <Text>Se connecter</Text>
              </Button>
            </Link>
            <Link href="/signUp/step-one" asChild>
              <Button
                className="w-full"
                variant="secondary"
                size={Platform.select({ ios: 'lg', default: 'md' })}>
                <Text>Créer un compte</Text>
              </Button>
            </Link>
          </View>
        </View>
      </ContentView>
    </SafeAreaView>
  );
}
