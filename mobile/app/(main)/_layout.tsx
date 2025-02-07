import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { usePathname } from 'expo-router';

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
  const currentRoute = usePathname();

  return (
    <AuthProvider>
      <UserProvider>
        <SpotCountDownOnRender>
          <AskUserToRate>
            {currentRoute !== '/user-profile' && (
              <LinearGradient
                className="absolute left-0 right-0 top-0"
                colors={[
                  opacity(colors.primary, 0.8),
                  opacity(colors.card, 0.3),
                  opacity(colors.background, 0),
                ]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.3, y: 3 }}>
                <Header className="mt-safe-offset-2 mb-4" />
              </LinearGradient>
            )}
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
          </AskUserToRate>
        </SpotCountDownOnRender>
      </UserProvider>
    </AuthProvider>
  );
}
