import React from 'react';
import {View, ViewProps} from 'react-native';

import {ThemedIcon} from '~/components/ThemedIcon';
import {Text} from '~/components/nativewindui/Text';
import {cn} from '~/lib/cn';
import {useColorScheme} from '~/lib/useColorScheme';

export function Card({ className, ...props }: ViewProps) {
    return <View className={cn('bg-card/50 flex-col gap-6 rounded-xl p-4', className)} {...props} />;
}

export function InfoCard(props: { info: string }) {
  const { colors } = useColorScheme();
  return (
    <Card className="flex-row items-center">
      <ThemedIcon name="info" size={22} color={colors.primary} />
      <Text className="shrink font-semibold">{props.info}</Text>
    </Card>
  );
}
