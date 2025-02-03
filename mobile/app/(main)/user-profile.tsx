import { signOut } from '@firebase/auth';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { firebaseAuth } from '~/authentication/firebase';
import { ContentView } from '~/components/ContentView';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

export default function UserProfileScreen() {
  const { userProfile } = useCurrentUser();

  return (
    <SafeAreaView>
      <ContentView>
        <Text>{JSON.stringify(userProfile, undefined, 4)}</Text>
        <Button onPress={() => signOut(firebaseAuth)}>
          <Text>Logout</Text>
        </Button>
      </ContentView>
    </SafeAreaView>
  );
}
