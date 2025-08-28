import { FontAwesome6 } from '@expo/vector-icons';
import { differenceInMilliseconds, format, intervalToDuration, isWithinInterval } from 'date-fns';
import { toMilliseconds } from 'duration-fns';
import React from 'react';
import { View, ViewProps } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { ProgressIndicator } from '~/components/nativewindui/ProgressIndicator';
import { Text } from '~/components/nativewindui/Text';
import { useActualTime } from '~/lib/useActualTime';
import { formatTime, fromUtc, parseDuration } from '~/lib/utils';
import { cn } from '~/lib/cn';
import { useTranslation } from 'react-i18next';

export function DateRange({
  from,
  to,
  extend,
  duration,
  className,
  ...props
}: {
  from: Date | string;
  to: Date | string;
  duration?: string;
  extend?: boolean;
} & ViewProps) {
  const { t } = useTranslation();
  const now = useActualTime(5000);

  const inProgress = isWithinInterval(now, {
    start: fromUtc(from),
    end: fromUtc(to),
  });

  const remainingMs = inProgress ? differenceInMilliseconds(to, now) : null;
  const realDuration = duration
    ? parseDuration(duration)
    : intervalToDuration({ start: from, end: to });

  const label =
    remainingMs &&
    formatTime(t, remainingMs, [
      {
        unit: 'days',
        hideIfZero: true,
        separator: ' ',
      },
      {
        unit: 'hours',
      },
      {
        unit: 'minutes',
        hideSuffix: true,
      },
    ]);

  return remainingMs !== null ? (
    <View className={cn('flex-col gap-4', extend && 'flex-1', className)} {...props}>
      <DateRangeOnly from={from} to={to} />

      <View className={'relative gap-1'}>
        <ProgressIndicator
          className="h-4"
          value={Math.round((100 * remainingMs) / toMilliseconds(realDuration))}
        />
        {label && <Text className="absolute left-1 text-xs font-semibold">{label}</Text>}
      </View>
    </View>
  ) : (
    <DateRangeOnly from={from} to={to} />
  );
}

export function DateRangeOnly(props: { from: Date | string; to: Date | string; short?: boolean }) {
  const dateFormat = props.short ? 'dd.MM HH:mm' : 'dd MMM HH:mm';

  return (
    <View className="flex-row items-center gap-2">
      {!props.short && <ThemedIcon component={FontAwesome6} name="clock" size={12} />}
      <Text className={'text-sm'}>{format(props.from, dateFormat)}</Text>
      <ThemedIcon name="arrow-right" size={12} component={FontAwesome6} />
      <Text className={'text-sm'}>{format(props.to, dateFormat)}</Text>
    </View>
  );
}
