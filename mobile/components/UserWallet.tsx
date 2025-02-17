import { View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';

export function UserWallet() {
  const { userProfile } = useCurrentUser();

  return (
    <View className="flex-row items-center gap-8">
      <View className="flex-row items-center gap-2">
        <Text className="text-lg font-semibold">{userProfile.wallet.credits}</Text>
        <LogoCard primary className="h-5 w-3 rounded" />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-lg font-semibold">{userProfile.wallet.pendingCredits}</Text>
        <LogoCard className="h-5 w-3 rounded" />
      </View>
    </View>
  );
}
