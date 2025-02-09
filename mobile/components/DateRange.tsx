import { differenceInMinutes, format, formatDistance, isWithinInterval } from 'date-fns';
import { toMinutes } from 'duration-fns';
import React from 'react';
import { View } from 'react-native';

import { ThemedIcon } from '~/components/ThemedIcon';
import { ProgressIndicator } from '~/components/nativewindui/ProgressIndicator';
import { Text } from '~/components/nativewindui/Text';
import { parseDuration } from '~/lib/utils';

export function DateRange(props: { from: Date | string; to: Date | string; duration: string }) {
  const inProgress = isWithinInterval(new Date(), {
    start: props.from,
    end: props.to,
  });

  const elapsedMinutes = inProgress && differenceInMinutes(new Date(), props.from);
  const duration = parseDuration(props.duration);

  return elapsedMinutes ? (
    <View className="flex-col gap-2">
      <Text>Il reste {formatDistance(props.to, new Date())}</Text>
      <ProgressIndicator
        className="h-4"
        value={Math.round((100 * elapsedMinutes) / toMinutes(duration))}
      />
    </View>
  ) : (
    <View className="flex-row items-center gap-2">
      <ThemedIcon name="calendar" />
      <Text variant="subhead">{format(props.from, 'dd MMMM HH:mm')}</Text>
      <ThemedIcon name="arrow-right" />
      <Text variant="subhead">{format(props.to, 'dd MMMM HH:mm')}</Text>
    </View>
  );
}
