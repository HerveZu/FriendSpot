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

export default function MainLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        {/*BottomSheetModalProvider children need to have access to the currentUser*/}
        <BottomSheetModalProvider>
          {/*<AskUserToRate>*/}
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
                  />
                ),
                tabBarButton: NoRipple,
              }}
            />
            <Tabs.Screen
              name="user-profile"
              options={{
                tabBarIcon: ({ focused }) => (
                  <MeAvatar
                    className={cn('aspect-square h-7', focused && 'h-8 border-2 border-primary')}
                  />
                ),
                tabBarButton: NoRipple,
              }}
            />
          </Tabs>
          {/*</AskUserToRate>*/}
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

function NoRipple(props: PressableProps) {
  return <Pressable android_ripple={null} {...props} />;
}
