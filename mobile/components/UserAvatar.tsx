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
  const namesInitials = displayName.split(' ').map((name) => name[0]);
  const userInitials = [
    namesInitials[0],
    namesInitials.length > 1 ? namesInitials[namesInitials.length - 1] : undefined,
  ];

  return (
    <Avatar alt="Profile" {...props}>
      <AvatarImage src={pictureUrl} />
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
