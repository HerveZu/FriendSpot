import { differenceInMinutes, format, formatDistance, isWithinInterval } from 'date-fns';
import { toMinutes } from 'duration-fns';
import React from 'react';
import { View } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { ProgressIndicator } from '~/components/nativewindui/ProgressIndicator';
import { Text } from '~/components/nativewindui/Text';
import { useActualTime } from '~/lib/useActualTime';
import { fromUtc, parseDuration } from '~/lib/utils';

export function DateRange(props: {
  from: Date | string;
  to: Date | string;
  duration: string;
  label?: string;
}) {
  const now = useActualTime(5000);

  const inProgress = isWithinInterval(now, {
    start: fromUtc(props.from),
    end: fromUtc(props.to),
  });

  const elapsedMinutes = inProgress ? differenceInMinutes(now, props.from) : null;
  const duration = parseDuration(props.duration);

  return elapsedMinutes !== null ? (
    <View className="flex-col gap-2">
      <Text className={'text-md'}>
        {props.label ?? 'Il reste'} {formatDistance(props.to, now)}
      </Text>
      <ProgressIndicator
        className="h-4"
        value={Math.round((100 * elapsedMinutes) / toMinutes(duration))}
      />
    </View>
  ) : (
    <DateRangeOnly from={props.from} to={props.to} />
  );
}

export function DateRangeOnly(props: { from: Date | string; to: Date | string; short?: boolean }) {
  const dateFormat = props.short ? 'dd.MM HH:mm' : 'dd MMMM HH:mm';

  return (
    <View className="flex-row items-center gap-2">
      {!props.short && <ThemedIcon name="calendar" />}
      <Text className={'text-xs'}>{format(props.from, dateFormat)}</Text>
      <ThemedIcon name="arrow-right" />
      <Text className={'text-xs'}>{format(props.to, dateFormat)}</Text>
    </View>
  );
}
