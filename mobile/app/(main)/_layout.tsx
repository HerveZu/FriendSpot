import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';

import { SpotCountDownOnRender } from '~/app/spot-count-down';
import { AuthProvider } from '~/authentication/AuthProvider';
import UserProvider from '~/authentication/UserProvider';
import Header from '~/components/Header';
import { ThemedIcon } from '~/components/ThemedIcon';
import { MeAvatar } from '~/components/UserAvatar';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { opacity } from '~/lib/utils';
import { AskUserToRate } from '~/rating/AskUserToRate';

export default function MainLayout() {
  const { colors } = useColorScheme();

  return (
    <AuthProvider>
      <UserProvider>
        <SpotCountDownOnRender>
          <AskUserToRate>
            <LinearGradient
              className="absolute left-0 right-0 top-0"
              colors={[opacity(colors.primary, 0.6), opacity(colors.card, 0.2), colors.background]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 3 }}>
              <Header className="mt-safe-offset-4 mb-6" />
            </LinearGradient>
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: { paddingTop: 5, backgroundColor: 'transparent' },
                tabBarIconStyle: { height: 32 },
              }}>
              <Tabs.Screen
                name="home"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <ThemedIcon
                      name="car"
                      color={focused ? colors.foreground : colors.grey}
                      component={FontAwesome6}
                      size={24}
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
          </AskUserToRate>
        </SpotCountDownOnRender>
      </UserProvider>
    </AuthProvider>
  );
}
