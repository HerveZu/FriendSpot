import React from 'react';
import { View, ViewProps } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';
import { LogoCard } from '~/components/Logo';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export default function Header({ className, ...props }: ViewProps) {
  const { userProfile } = useCurrentUser();

  return (
    <View className={cn('flex-row justify-end gap-8 px-8', className)} {...props}>
      <View className="flex-row items-center gap-8">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-semibold">{userProfile.wallet.credits}</Text>
          <LogoCard primary className="h-6 w-4 rounded" />
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-semibold">{userProfile.wallet.pendingCredits}</Text>
          <LogoCard className="h-6 w-4 rounded" />
        </View>
      </View>
    </View>
  );
}
