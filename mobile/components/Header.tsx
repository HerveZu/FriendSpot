import { View } from 'react-native';

import { useCurrentUser } from '~/authentication/user-provider';
import { ThemeToggle } from '~/components/ThemeToggle';
import { Text } from '~/components/nativewindui/Text';

export default function Header() {
  const { userProfile } = useCurrentUser();

  return (
    <View className="flex-row justify-end gap-8 px-8">
      <View className="flex-row items-center gap-4">
        <Text>{userProfile.wallet.credits}</Text>
        <Text>{userProfile.wallet.pendingCredits}</Text>
      </View>
      <ThemeToggle />
    </View>
  );
}
