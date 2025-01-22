import { ViewProps } from 'react-native';
import { useAuth0 } from 'react-native-auth0';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { Text } from '~/components/nativewindui/Text';

export default function UserProfile(props: ViewProps) {
  const { user } = useAuth0();

  const userInitials = user?.name
    ?.split(' ')
    .map((letter) => letter[0].toUpperCase())
    .join('');

  return (
    <Avatar alt="Profile" {...props}>
      <AvatarImage src={user?.picture} />
      <AvatarFallback>
        <Text>{userInitials}</Text>
      </AvatarFallback>
    </Avatar>
  );
}
