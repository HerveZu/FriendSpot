import { FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useCurrentUser } from '~/authentication/UserProvider';
import { ThemedIcon, ThemedIconProps } from '~/components/ThemedIcon';
import { MeAvatar } from '~/components/UserAvatar';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { Pressable, PressableProps, View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { useTranslation } from 'react-i18next';
import { PropsWithChildren } from 'react';

export default function MainLayout() {
  const { t } = useTranslation();

  return (
    <>
      {/*<AskUserToRate>*/}
      <Tabs
        initialRouteName="my-spot"
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
                info={t('tabs.mySpot')}
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
                info={t('tabs.search')}
              />
            ),
            tabBarButton: NoRipple,
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name="crown"
                component={FontAwesome6}
                size={24}
                focused={focused}
                info={t('tabs.upgrade')}
              />
            ),
            tabBarButton: NoRipple,
          }}
        />
        <Tabs.Screen
          name="user-profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <Tab info={t('tabs.profile')}>
                <MeAvatar
                  className={cn('aspect-square h-7', focused && 'border-2 border-primary')}
                />
              </Tab>
            ),
            tabBarButton: NoRipple,
          }}
        />
      </Tabs>
    </>
  );
}

function TabIcon<TGlyph extends string>({
  focused,
  info,
  ...props
}: { focused?: boolean } & TabProps & ThemedIconProps<TGlyph>) {
  const { colors } = useColorScheme();
  const { userProfile } = useCurrentUser();
  const disabled = !userProfile.spot;

  return (
    <Tab info={info}>
      <ThemedIcon
        color={disabled ? colors.grey6 : focused ? colors.primary : colors.grey}
        size={24}
        {...props}
      />
    </Tab>
  );
}

type TabProps = PropsWithChildren<{ info?: string }>;

function Tab({ children, info }: TabProps) {
  const { userProfile } = useCurrentUser();
  const disabled = !userProfile.spot;

  return (
    <View className="flex-1 items-center">
      <View className={'h-8 max-h-8 overflow-y-hidden'}>{children}</View>
      <Text className={cn('w-full text-center text-xs', disabled && 'text-gray-600')}>{info}</Text>
    </View>
  );
}

function NoRipple(props: PressableProps) {
  return <Pressable android_ripple={null} {...props} />;
}
