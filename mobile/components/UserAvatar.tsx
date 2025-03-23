import { Animated, View, ViewProps } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import React, { useEffect, useRef, useState } from 'react';

type DisplayUser = {
  displayName: string;
  pictureUrl?: string | null;
};

const MAX_USERS = 3;

export function Users(props: { users: DisplayUser[] }) {
  return (
    <View className={'flex-row'}>
      {props.users.slice(0, MAX_USERS).map((user, i) => (
        <UserAvatar
          className={'-ml-4 h-8 w-8'}
          style={{
            zIndex: 50 + i,
          }}
          key={i}
          displayName={user.displayName}
          pictureUrl={user.pictureUrl}
        />
      ))}
      {props.users.length > MAX_USERS && (
        <View className={'ml-1 h-8 w-8 rounded-full border border-border bg-background'}>
          <Text className={'m-auto text-sm'}>+{props.users.length - MAX_USERS}</Text>
        </View>
      )}
    </View>
  );
}

type UserAvatarProps = DisplayUser & ViewProps;

export function UserAvatar({ displayName, pictureUrl, ...props }: UserAvatarProps) {
  const namesInitials = displayName.split(' ').map((name) => name[0]?.toUpperCase());
  const userInitials = [
    namesInitials[0],
    namesInitials.length > 1 ? namesInitials[namesInitials.length - 1] : undefined,
  ];

  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim.current, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim.current, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View className={'relative'}>
      {loading && (
        <Animated.View
          style={{ opacity: pulseAnim.current }}
          className={'bg-card/80 absolute bottom-0 left-0 right-0 top-0 rounded-full'}
        />
      )}
      <Avatar alt={displayName} {...props}>
        <AvatarImage
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          source={{ uri: pictureUrl ?? undefined }}
        />
        <AvatarFallback>
          <Text>{userInitials.join('')}</Text>
        </AvatarFallback>
      </Avatar>
    </View>
  );
}

export function MeAvatar(props: ViewProps) {
  const { userProfile } = useCurrentUser();

  return (
    <UserAvatar
      displayName={userProfile.displayName}
      pictureUrl={userProfile.pictureUrl}
      {...props}
    />
  );
}

export function User({ className, ...props }: UserAvatarProps) {
  return (
    <View className="flex-row items-center gap-4">
      <UserAvatar className={cn('h-9 w-9', className)} {...props} />
      <Text className="font-medium ">{props.displayName}</Text>
    </View>
  );
}
