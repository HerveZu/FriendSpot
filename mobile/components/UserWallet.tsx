import { View, ViewProps } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { LogoCard } from '~/components/Logo';
import React from 'react';
import { useCurrentUser } from '~/authentication/UserProvider';
import { cn } from '~/lib/cn';

export function UserWallet({ className, ...props }: ViewProps) {
  const { userProfile } = useCurrentUser();

  return (
    <View className={cn('flex-row items-center gap-8', className)} {...props}>
      <View className="flex-row items-center gap-2">
        <Text className="text-lg font-semibold">{Math.round(userProfile.wallet.credits)}</Text>
        <LogoCard primary className="h-5 w-3 rounded" />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-lg font-semibold">
          {Math.round(userProfile.wallet.pendingCredits)}
        </Text>
        <LogoCard className="h-5 w-3 rounded" />
      </View>
    </View>
  );
}
