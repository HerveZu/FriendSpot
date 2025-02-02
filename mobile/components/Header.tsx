import { View } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { LogoCard } from '~/components/Logo';
import { ThemeToggle } from '~/components/ThemeToggle';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';

export default function Header() {
  const { userProfile } = useCurrentUser();
  const { colors } = useColorScheme();

  return (
    // <LinearGradient colors={[colors.primary, colors.background]}>
    <View className="mt-4 flex-row justify-end gap-8 px-8">
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-semibold">{userProfile.wallet.credits}</Text>
          <LogoCard primary className="h-6 w-4 rounded" />
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-semibold">{userProfile.wallet.pendingCredits}</Text>
          <LogoCard className="h-6 w-4 rounded" />
        </View>
      </View>
      <ThemeToggle />
    </View>
    // </LinearGradient>
  );
}
