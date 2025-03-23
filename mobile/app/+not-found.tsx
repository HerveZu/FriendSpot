import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Button } from '~/components/nativewindui/Button';

import { Text } from '~/components/nativewindui/Text';
import NotFoundIllustration from '~/assets/not-found.svg';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background p-5">
        <View className="flex-col items-center gap-4">
          <Text variant="largeTitle">Oups !</Text>
          <Text variant="largeTitle">Il n'y a rien par ici</Text>
        </View>
        <NotFoundIllustration width={300} height={300} />
        <Button>
          <Link href="/welcome" className="">
            <Text className="text-xl">Revenir en lieu sûr</Text>
          </Link>
        </Button>
      </View>
    </>
  );
}
