import React from 'react';
import { View, ViewProps } from 'react-native';

import { cn } from '~/lib/cn';
import { ScrollView } from 'react-native-gesture-handler';

export function CardContainer({ className, children, ...props }: ViewProps) {
  return (
    <ScrollView className={cn('bg-background/40 rounded-xl', className)} {...props}>
      <View className="m-2 grow flex-col gap-2">{children}</View>
    </ScrollView>
  );
}

export function Card({
  background,
  highlight,
  className,
  ...props
}: { background?: boolean; highlight?: boolean } & ViewProps) {
  const card = (
    <View
      className={cn(
        'bg-primary/10 flex-col gap-6 rounded-xl p-4',
        highlight && 'bg-primary/30',
        className
      )}
      {...props}
    />
  );

  if (!background) {
    return card;
  }

  return <View className={'rounded-xl bg-background'}>{card}</View>;
}
