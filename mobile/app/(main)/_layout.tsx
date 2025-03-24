import { FontAwesome6 } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Tabs } from 'expo-router';
import { AuthProvider } from '~/authentication/AuthProvider';
import { useCurrentUser, UserProvider } from '~/authentication/UserProvider';
import { ThemedIcon, ThemedIconProps } from '~/components/ThemedIcon';
import { MeAvatar } from '~/components/UserAvatar';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { AskUserToRate } from '~/rating/AskUserToRate';

export default function MainLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        {/*BottomSheetModalProvider children need to have access to currentUser*/}
        <BottomSheetModalProvider>
          <AskUserToRate>
            <Tabs
              initialRouteName="my-spot"
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
                    <TabIcon name="house" component={FontAwesome6} size={22} focused={focused} />
                  ),
                }}
              />
              <Tabs.Screen
                name="search-spot"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <TabIcon
                      name="magnifying-glass"
                      component={FontAwesome6}
                      size={24}
                      focused={focused}
                    />
                  ),
                }}
              />
              <Tabs.Screen
                name="user-profile"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <MeAvatar
                      className={cn(
                        'aspect-square h-full',
                        focused && 'h-9 border-2 border-primary'
                      )}
                    />
                  ),
                }}
              />
            </Tabs>
          </AskUserToRate>
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
  const { userProfile } = useCurrentUser();

  return (
    <ThemedIcon
      color={!userProfile.spot ? colors.grey6 : focused ? colors.foreground : colors.grey}
      size={24}
      {...props}
    />
  );
}
