import React from 'react';
import { SafeAreaView } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import ContentView from '~/components/ContentView';
import { Text } from '~/components/nativewindui/Text';

export default function UserProfileScreen() {
  const { userProfile } = useCurrentUser();

  return (
    <SafeAreaView>
      <ContentView>
        <Text>{JSON.stringify(userProfile, undefined, 4)}</Text>
      </ContentView>
    </SafeAreaView>
  );
}
