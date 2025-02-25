import { View, ViewProps } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

type UserAvatarProps = {
  displayName: string;
  pictureUrl?: string | null;
} & ViewProps;

export function UserAvatar({ displayName, pictureUrl, ...props }: UserAvatarProps) {
  const namesInitials = displayName.split(' ').map((name) => name[0]?.toUpperCase());
  const userInitials = [
    namesInitials[0],
    namesInitials.length > 1 ? namesInitials[namesInitials.length - 1] : undefined,
  ];

  return (
    <Avatar alt="Profile" {...props}>
      <AvatarImage source={{ uri: pictureUrl ?? undefined }} />
      <AvatarFallback>
        <Text>{userInitials.join('')}</Text>
      </AvatarFallback>
    </Avatar>
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
      <Text className="font-medium">{props.displayName}</Text>
    </View>
  );
}
