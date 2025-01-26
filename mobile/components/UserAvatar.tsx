import { ViewProps } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { Text } from '~/components/nativewindui/Text';

export function UserAvatar({
  displayName,
  pictureUrl,
  ...props
}: {
  displayName: string;
  pictureUrl?: string;
} & ViewProps) {
  const userInitials = displayName
    .split(' ')
    .slice(0, 2)
    .map((letter) => letter[0].toUpperCase())
    .join('');

  return (
    <Avatar alt="Profile" {...props}>
      <AvatarImage src={pictureUrl} />
      <AvatarFallback>
        <Text>{userInitials}</Text>
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
