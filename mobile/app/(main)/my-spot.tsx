import { SafeAreaView } from 'react-native';

import ContentView from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';

export default function MySpotScreen() {
  return (
    <SafeAreaView>
      <ContentView>
        <Text>Mon Spot</Text>
      </ContentView>
    </SafeAreaView>
  );
}
