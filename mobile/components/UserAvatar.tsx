import { ViewProps } from 'react-native';
import { useCurrentUser } from '~/authentication/UserProvider';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { Text } from '~/components/nativewindui/Text';

export function UserAvatar({
  displayName,
  pictureUrl,
  newSelectedImage,
  ...props
}: {
  displayName: string;
  newSelectedImage?: string;
  pictureUrl?: string;
} & ViewProps) {
  const namesInitials = displayName.split(' ').map((name) => name[0]?.toUpperCase());
  const userInitials = [
    namesInitials[0],
    namesInitials.length > 1 ? namesInitials[namesInitials.length - 1] : undefined,
  ];

  return (
    <Avatar alt="Profile" {...props}>
      <AvatarImage
        source={
          newSelectedImage
            ? { uri: newSelectedImage }
            : pictureUrl
              ? { uri: pictureUrl }
              : undefined
        }
      />
      <AvatarFallback className="relative">
        <Text>{userInitials.join('')}</Text>
      </AvatarFallback>
    </Avatar>
  );
}

export function MeAvatar({
  newSelectedImage,
  ...props
}: { newSelectedImage?: string } & ViewProps) {
  const { userProfile } = useCurrentUser();

  return (
    <UserAvatar
      displayName={userProfile.displayName}
      pictureUrl={userProfile.pictureUrl}
      newSelectedImage={newSelectedImage}
      {...props}
    />
  );
}
