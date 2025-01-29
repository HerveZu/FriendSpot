import { differenceInSeconds, intervalToDuration, secondsToMilliseconds } from 'date-fns';
import { toSeconds } from 'duration-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView, View } from 'react-native';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';

import { ThemedIcon } from '~/components/ThemedIcon';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { BookingResponse } from '~/endpoints/get-booking';
import { useColorScheme } from '~/lib/useColorScheme';
import { parseDuration, rgbToHex } from '~/lib/utils';

export type SpotCountDownScreenParams = { activeBookingsJson: string };

export default function SpotCountDownScreen() {
  const router = useRouter();
  const { activeBookingsJson } = useLocalSearchParams<SpotCountDownScreenParams>();
  const activeBookings = JSON.parse(activeBookingsJson) as BookingResponse[];

  return (
    <SafeAreaView className=" h-screen w-screen flex-col gap-8 bg-background">
      <View className="relative w-full">
        <Button variant="plain" className="absolute right-0 m-4" onPress={() => router.dismiss()}>
          <ThemedIcon name="close" size={24} />
        </Button>
      </View>
      <View className="w-full grow flex-col items-center justify-around">
        {activeBookings.map((activeBooking, i) => (
          <SpotCountDown key={i} activeBooking={activeBooking} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const DRAMATIC_COUNT_DOWN_AFTER_ELAPSED = 0.75;

function SpotCountDown(props: { activeBooking: BookingResponse }) {
  const { colors } = useColorScheme();
  const initialRemainingSeconds = useMemo(
    () => differenceInSeconds(props.activeBooking.to, new Date()),
    []
  );
  const durationSeconds = useMemo(() => toSeconds(parseDuration(props.activeBooking.duration)), []);

  return (
    <CountdownCircleTimer
      strokeWidth={25}
      trailColor={colors.background}
      size={350}
      isPlaying
      initialRemainingTime={initialRemainingSeconds}
      duration={durationSeconds}
      colors={[rgbToHex(colors.primary), rgbToHex(colors.destructive)]}
      colorsTime={[
        DRAMATIC_COUNT_DOWN_AFTER_ELAPSED * durationSeconds,
        (1 - DRAMATIC_COUNT_DOWN_AFTER_ELAPSED) * durationSeconds,
      ]}>
      {({ remainingTime }) => {
        const remaining = intervalToDuration({
          start: 0,
          end: new Date(secondsToMilliseconds(remainingTime)),
        });

        return (
          <View className="-mb-16 flex-col items-center gap-8">
            <View className="flex-row gap-4">
              {remaining.days && (
                <Text variant="largeTitle">{remaining.days > 0 && remaining.days}J</Text>
              )}
              <Text variant="largeTitle">
                {remaining.hours?.toString().padStart(2, '0') ?? '00'}:
                {remaining.minutes?.toString().padStart(2, '0') ?? '00'}:
                {remaining.seconds?.toString().padStart(2, '0') ?? '00'}
              </Text>
            </View>
            <Text variant="title1">n° {props.activeBooking.spotName}</Text>
          </View>
        );
      }}
    </CountdownCircleTimer>
  );
}
