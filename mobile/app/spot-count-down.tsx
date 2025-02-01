import { differenceInSeconds, intervalToDuration, secondsToMilliseconds } from 'date-fns';
import { toSeconds } from 'duration-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus, SafeAreaView, View } from 'react-native';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';

import { ContentView } from '~/components/ContentView';
import { Loader } from '~/components/Loader';
import { ThemedIcon } from '~/components/ThemedIcon';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { BookingResponse, useGetBooking } from '~/endpoints/get-booking';
import { useColorScheme } from '~/lib/useColorScheme';
import { parseDuration, rgbToHex } from '~/lib/utils';

export type SpotCountDownScreenParams = { activeBookingsJson: string };

export default function SpotCountDownScreen() {
  const router = useRouter();
  const { activeBookingsJson } = useLocalSearchParams<SpotCountDownScreenParams>();
  const activeBookings = JSON.parse(activeBookingsJson) as BookingResponse[];

  return (
    <SafeAreaView className=" h-screen w-screen flex-col gap-8 bg-background">
      <ContentView>
        <View className="relative w-full">
          <Button
            variant="plain"
            className="absolute right-0 top-0"
            onPress={() => router.dismiss()}>
            <ThemedIcon name="close" size={24} />
          </Button>
        </View>
        <View className="w-full grow flex-col items-center justify-around">
          {activeBookings.map((activeBooking, i) => (
            <SpotCountDown key={i} activeBooking={activeBooking} />
          ))}
        </View>
      </ContentView>
    </SafeAreaView>
  );
}

const RENDER_ON_SATES: AppStateStatus[] = ['background'];

export function SpotCountDownOnRender(props: PropsWithChildren) {
  // default to 'true' to prevent rendering one frame before loading
  const [loading, setLoading] = useState(true);
  const getBooking = useGetBooking();
  const router = useRouter();

  function displayCountdown() {
    setLoading(true);
    getBooking()
      .then((bookings) => {
        const activeBookings = bookings.bookings.filter((booking) => !!booking.spotName);
        activeBookings.length > 0 &&
          router.navigate({
            pathname: '/spot-count-down',
            params: {
              activeBookingsJson: JSON.stringify(activeBookings),
            } as SpotCountDownScreenParams,
          });
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (!RENDER_ON_SATES.includes(appState)) {
        return;
      }

      displayCountdown();
    });

    displayCountdown();

    return () => {
      subscription.remove();
    };
  }, []);

  return loading ? <Loader /> : props.children;
}

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
      trailColor={colors.card}
      size={350}
      isPlaying
      initialRemainingTime={initialRemainingSeconds}
      duration={durationSeconds}
      colors={[rgbToHex(colors.destructive), rgbToHex(colors.primary)]}
      colorsTime={[0.95 * durationSeconds, 0.05 * durationSeconds]}>
      {({ remainingTime, color }) => {
        const remaining = intervalToDuration({
          start: 0,
          end: new Date(secondsToMilliseconds(remainingTime)),
        });

        return (
          <View className="-mb-16 flex-col items-center gap-8">
            <View className="flex-row gap-4">
              {remaining.days && (
                <Text
                  variant="largeTitle"
                  className="font-bold"
                  style={{
                    color,
                  }}>
                  {remaining.days > 0 && remaining.days}J
                </Text>
              )}
              <Text
                variant="largeTitle"
                className="font-bold"
                style={{
                  color,
                }}>
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
