import { SafeAreaView } from 'react-native';
import { useAuth0 } from 'react-native-auth0';

import ContentView from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';

export default function HomeScreen() {
  const { user } = useAuth0();

  return (
    <SafeAreaView>
      <ContentView>
        <Text>Salut {user?.name}</Text>
      </ContentView>
    </SafeAreaView>
  );
}
