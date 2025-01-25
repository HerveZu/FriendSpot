import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native';

import UserProvider from '~/authentication/user-provider';
import Header from '~/components/Header';
import { TFA } from '~/components/TFA';
import UserProfile from '~/components/UserProfile';

export default function MainLayout() {
  return (
    <UserProvider>
      <SafeAreaView>
        <Header />
      </SafeAreaView>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { paddingTop: 5 },
          tabBarIconStyle: { height: 32 },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: () => <TFA name="home" size={32} />,
          }}
        />
        <Tabs.Screen
          name="my-spot"
          options={{ tabBarIcon: () => <UserProfile className="aspect-square h-full" /> }}
        />
      </Tabs>
    </UserProvider>
  );
}
