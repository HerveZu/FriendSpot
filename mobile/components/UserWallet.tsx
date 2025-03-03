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
      <Credits pending={false} credits={userProfile.wallet.credits} />
      <Credits pending={true} credits={userProfile.wallet.pendingCredits} />
    </View>
  );
}

export function Credits({
  pending,
  credits,
  className,
  ...props
}: { pending: boolean; credits: number } & ViewProps) {
  return (
    <View className={cn('w-12 flex-row items-center gap-2', className)} {...props}>
      <LogoCard primary={!pending} className="h-5 w-3 rounded" />
      <Text className="text-lg font-semibold">{Math.round(credits)}</Text>
    </View>
  );
}
