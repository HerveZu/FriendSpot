import { FontAwesome6 } from '@expo/vector-icons';
import { differenceInMinutes, format, intervalToDuration, isWithinInterval } from 'date-fns';
import { toMinutes } from 'duration-fns';
import React from 'react';
import { View, ViewProps } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { ProgressIndicator } from '~/components/nativewindui/ProgressIndicator';
import { Text } from '~/components/nativewindui/Text';
import { useActualTime } from '~/lib/useActualTime';
import { fromUtc, parseDuration } from '~/lib/utils';
import { cn } from '~/lib/cn';

export function DateRange({
  from,
  to,
  duration,
  label,
  className,
  ...props
}: {
  from: Date | string;
  to: Date | string;
  duration?: string;
  label?: string;
} & ViewProps) {
  const now = useActualTime(5000);

  const inProgress = isWithinInterval(now, {
    start: fromUtc(from),
    end: fromUtc(to),
  });

  const elapsedMinutes = inProgress ? differenceInMinutes(now, from) : null;
  const realDuration = duration
    ? parseDuration(duration)
    : intervalToDuration({ start: from, end: to });

  return elapsedMinutes !== null ? (
    <View className={cn('flex-col gap-4', className)} {...props}>
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold">{format(from, 'dd MMMM HH:mm')}</Text>
          <ThemedIcon name="arrow-right" />
          <Text className="text-sm font-semibold">{format(to, 'dd MMMM HH:mm')}</Text>
        </View>
      </View>
      <ProgressIndicator
        className="h-4"
        value={Math.round((100 * elapsedMinutes) / toMinutes(realDuration))}
      />
    </View>
  ) : (
    <DateRangeOnly from={from} to={to} />
  );
}

export function DateRangeOnly(props: { from: Date | string; to: Date | string; short?: boolean }) {
  const dateFormat = props.short ? 'dd.MM HH:mm' : 'dd MMMM HH:mm';

  return (
    <View className="flex-row items-center gap-2">
      {!props.short && <ThemedIcon component={FontAwesome6} name="clock" size={12} />}
      <Text className={'text-xs'}>{format(props.from, dateFormat)}</Text>
      <ThemedIcon name="arrow-right" size={12} />
      <Text className={'text-xs'}>{format(props.to, dateFormat)}</Text>
    </View>
  );
}
