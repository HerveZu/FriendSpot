import React from 'react';
import { View, ViewProps } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export function Card({ className, ...props }: ViewProps) {
  return <View className={cn('flex-col gap-6 rounded-xl bg-card p-4', className)} {...props} />;
}

export function InfoCard(props: { info: string }) {
  return (
    <Card className="flex-row items-center">
      <ThemedIcon name="info" size={22} />
      <Text className="font-semibold">{props.info}</Text>
    </Card>
  );
}
