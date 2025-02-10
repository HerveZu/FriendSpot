import {differenceInMinutes, format, formatDistance, isWithinInterval} from 'date-fns';
import {toMinutes} from 'duration-fns';
import React from 'react';
import {View} from 'react-native';

import {ThemedIcon} from '~/components/ThemedIcon';
import {ProgressIndicator} from '~/components/nativewindui/ProgressIndicator';
import {Text} from '~/components/nativewindui/Text';
import {useActualTime} from '~/lib/use-actual-time';
import {fromUtc, parseDuration} from '~/lib/utils';

export function DateRange(props: { from: Date | string; to: Date | string; duration: string }) {
  const now = useActualTime(5000);

    const inProgress = isWithinInterval(now, {
        start: fromUtc(props.from),
        end: fromUtc(props.to),
    });

    const elapsedMinutes = inProgress && differenceInMinutes(now, props.from);
  const duration = parseDuration(props.duration);

  return elapsedMinutes ? (
    <View className="flex-col gap-2">
      <Text>Il reste {formatDistance(props.to, now)}</Text>
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
