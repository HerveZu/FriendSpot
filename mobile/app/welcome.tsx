import { Icon } from '@roninoss/icons';
import { useRouter } from 'expo-router';
import { Platform, View } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';

export default function WelcomeScreen() {
  const { colors } = useColorScheme();
  const { authorize } = useAuth0();
  const router = useRouter();

  async function login() {
    await authorize({
      audience: 'https://friendspot.me',
    }).then(() => router.navigate('/'));
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="mx-auto w-full max-w-sm flex-1 justify-between gap-4 px-8 py-4">
        <View className="ios:pt-8 pt-12">
          <Text variant="largeTitle" className="ios:text-left ios:font-black text-center font-bold">
            Bienvenue sur
          </Text>
          <Text
            variant="largeTitle"
            className="ios:text-left ios:font-black text-center font-bold text-primary">
            FriendSpot
          </Text>
        </View>
        <View className="gap-8">
          {FEATURES.map((feature) => (
            <View key={feature.title} className="flex-row gap-4">
              <View className="pt-px">
                <Icon
                  name={feature.icon}
                  size={38}
                  color={colors.primary}
                  ios={{ renderingMode: 'hierarchical' }}
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold">{feature.title}</Text>
                <Text variant="footnote">{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
        <View className="gap-4">
          <Button onPress={login} size={Platform.select({ ios: 'lg', default: 'md' })}>
            <Text>Me connecter</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  {
    title: 'List Your Parking Spot',
    description:
      'Easily list your available parking spot and set your own pricing and availability.',
    icon: 'map',
  },
  {
    title: 'Search Nearby Spots',
    description: 'Find available parking spots near your location in real-time.',
    icon: 'magnify',
  },
] as const;
