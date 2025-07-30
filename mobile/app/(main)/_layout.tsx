import { FontAwesome6 } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Tabs } from 'expo-router';
import { AuthProvider } from '~/authentication/AuthProvider';
import { useCurrentUser, UserProvider } from '~/authentication/UserProvider';
import { ThemedIcon, ThemedIconProps } from '~/components/ThemedIcon';
import { MeAvatar } from '~/components/UserAvatar';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { Pressable, PressableProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { View } from 'react-native';
import { EnsureUserHasSpot } from '~/spots/EnsureUserHasSpot';

export default function MainLayout() {
  const user = useCurrentUser();

  console.log(user?.userProfile);
  return (
    <AuthProvider>
      <UserProvider>
        <EnsureUserHasSpot>
          {/*BottomSheetModalProvider children need to have access to the currentUser*/}
          <BottomSheetModalProvider>
            {/*<AskUserToRate>*/}
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                sceneStyle: { backgroundColor: 'transparent' },
                tabBarStyle: {
                  paddingTop: 5,
                  backgroundColor: 'transparent',
                },
              }}>
              <Tabs.Screen
                name="my-spot"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <TabIcon
                      name="house"
                      component={FontAwesome6}
                      size={22}
                      focused={focused}
                      info="Prêter"
                    />
                  ),
                  tabBarButton: NoRipple,
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
                      info="Réserver"
                    />
                  ),
                  tabBarButton: NoRipple,
                }}
              />
              <Tabs.Screen
                name="user-profile"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <>
                      <MeAvatar
                        className={cn('aspect-square h-7', focused && 'border-2 border-primary')}
                        info="profile"
                      />
                    </>
                  ),
                  tabBarButton: NoRipple,
                }}
              />
            </Tabs>
          </BottomSheetModalProvider>
        </EnsureUserHasSpot>
      </UserProvider>
    </AuthProvider>
  );
}

function TabIcon<TGlyph extends string>({
  focused,
  info,
  ...props
}: { focused?: boolean; info?: string } & ThemedIconProps<TGlyph>) {
  const { colors } = useColorScheme();
  const { userProfile } = useCurrentUser();

  return (
    <View className="flex-1 items-center">
      <ThemedIcon
        color={!userProfile.spot ? colors.grey6 : focused ? colors.primary : colors.grey}
        size={24}
        {...props}
      />
      <Text className="mt-2 w-full text-center text-xs">{info}</Text>
    </View>
  );
}

function NoRipple(props: PressableProps) {
  return <Pressable android_ripple={null} {...props} />;
}
