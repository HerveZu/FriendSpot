import { Entypo, FontAwesome6 } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Tabs } from 'expo-router';

import { SpotCountDownOnRender } from '~/app/spot-count-down';
import { AuthProvider } from '~/authentication/AuthProvider';
import { UserProvider } from '~/authentication/UserProvider';
import { ThemedIcon, ThemedIconProps } from '~/components/ThemedIcon';
import { MeAvatar } from '~/components/UserAvatar';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { AskUserToRate } from '~/rating/AskUserToRate';

export default function MainLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        {/*BottomSheetModalProvider needs to have access to currentUser*/}
        <BottomSheetModalProvider>
          <SpotCountDownOnRender>
            <AskUserToRate>
              <Tabs
                initialRouteName="home"
                screenOptions={{
                  headerShown: false,
                  tabBarShowLabel: false,
                  sceneStyle: { backgroundColor: 'transparent' },
                  tabBarStyle: { paddingTop: 5, backgroundColor: 'transparent' },
                }}>
                <Tabs.Screen
                  name="my-spot"
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <TabIcon name="car" component={FontAwesome6} size={22} focused={focused} />
                    ),
                  }}
                />
                <Tabs.Screen
                  name="home"
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <TabIcon name="home" component={Entypo} focused={focused} size={26} />
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
        </BottomSheetModalProvider>
      </UserProvider>
    </AuthProvider>
  );
}

function TabIcon<TGlyph extends string>({
  focused,
  ...props
}: { focused?: boolean } & ThemedIconProps<TGlyph>) {
  const { colors } = useColorScheme();

  return <ThemedIcon color={focused ? colors.foreground : colors.grey} size={24} {...props} />;
}
