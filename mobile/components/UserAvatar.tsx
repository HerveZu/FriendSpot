import { useEffect } from 'react';
import { ViewProps, View } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { Text } from '~/components/nativewindui/Text';
import { ThemedIcon } from '~/components/ThemedIcon';
import { useColorScheme } from '~/lib/useColorScheme';

export function UserAvatar({
  displayName,
  pictureUrl,
  newSelectedImage,
  iconPencil = false,
  ...props
}: {
  displayName: string;
  newSelectedImage?: string;
  pictureUrl?: string;
  iconPencil?: boolean;
} & ViewProps) {
  const { colors } = useColorScheme();
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
      {iconPencil && (
        <View className="absolute right-5 top-4" accessibilityLabel="Edit Avatar">
          <ThemedIcon name={'pencil'} size={18} color={colors.foreground} />
        </View>
      )}
    </Avatar>
  );
}

export function MeAvatar({
  iconPencil,
  newSelectedImage,
  ...props
}: { iconPencil?: boolean; newSelectedImage?: string } & ViewProps) {
  const { userProfile, refreshProfile } = useCurrentUser();

  useEffect(() => {
    refreshProfile();
  }, [newSelectedImage]);

  return (
    <UserAvatar
      displayName={userProfile.displayName}
      pictureUrl={userProfile.pictureUrl}
      iconPencil={iconPencil}
      newSelectedImage={newSelectedImage}
      {...props}
    />
  );
}
