import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native';

import { SpotCountDownOnRender } from '~/app/spot-count-down';
import { AuthProvider } from '~/authentication/AuthProvider';
import UserProvider from '~/authentication/UserProvider';
import Header from '~/components/Header';
import { ThemedIcon } from '~/components/ThemedIcon';
import { MeAvatar } from '~/components/UserAvatar';
import { cn } from '~/lib/cn';

export default function MainLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <SpotCountDownOnRender>
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
                  <ThemedIcon
                    name={focused ? 'home' : 'home-outline'}
                    component={Ionicons}
                    size={28}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="user-profile"
              options={{
                tabBarIcon: ({ focused }) => (
                  <MeAvatar
                    className={cn('aspect-square h-full', focused && 'border-2 border-primary')}
                  />
                ),
              }}
            />
          </Tabs>
        </SpotCountDownOnRender>
      </UserProvider>
    </AuthProvider>
  );
}
