import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native';

import UserProvider from '~/authentication/user-provider';
import Header from '~/components/Header';
import { ThemedIcon } from '~/components/ThemedIcon';
import UserProfile from '~/components/UserProfile';
import { cn } from '~/lib/cn';

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
            tabBarIcon: ({ focused }) => (
              <ThemedIcon name={focused ? 'home' : 'home-outline'} component={Ionicons} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-spot"
          options={{
            tabBarIcon: ({ focused }) => (
              <UserProfile
                className={cn('aspect-square h-full', focused && 'border-2 border-primary')}
              />
            ),
          }}
        />
      </Tabs>
    </UserProvider>
  );
}
