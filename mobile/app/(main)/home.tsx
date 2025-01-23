import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import {
  addHours,
  addMinutes,
  differenceInHours,
  formatDuration,
  formatRelative,
  intervalToDuration,
} from 'date-fns';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, View } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useDebounce } from 'use-debounce';

import ContentView from '~/components/ContentView';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { BookSpotResponse, useBook } from '~/endpoints/book';
import {
  AvailableSpot,
  AvailableSpotsResponse,
  useGetAvailableSpots,
} from '~/endpoints/get-available-spots';

export default function HomeScreen() {
  const { user } = useAuth0();
  const bottomSheetModalRef = useSheetRef();

  return (
    <>
      <SafeAreaView>
        <ContentView className="flex-col justify-between pb-8">
          <Text>Salut {user?.name}</Text>
          <Button
            variant="primary"
            className="w-full"
            onPress={() => bottomSheetModalRef.current?.present()}>
            <FontAwesome name="search" size={32} className="color-accent" />
            <Text>Rechercher un spot</Text>
          </Button>
        </ContentView>
      </SafeAreaView>
      <BookingSheet ref={bottomSheetModalRef} />
    </>
  );
}

const BookingSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const MIN_DURATION_HOURS = 0.5;
  const MAX_DURATION_HOURS = 12;

  const now = new Date();
  const [selectedSpot, setSelectedSpot] = useState<AvailableSpot>();
  const [bookingSimulation, setBookingSimulation] = useState<BookSpotResponse>();
  const [from, setFrom] = useState(addMinutes(now, 15));
  const [to, setTo] = useState(addHours(from, 2));
  const [availableSpots, setAvailableSpots] = useState<AvailableSpotsResponse>();

  const book = useBook();
  const getAvailableSpots = useGetAvailableSpots();
  const [toDebounce] = useDebounce(to, 200);
  const [fromDebounce] = useDebounce(from, 200);

  const duration = useMemo(
    () => intervalToDuration({ start: from, end: to }),
    [fromDebounce, toDebounce]
  );

  useEffect(() => {
    getAvailableSpots(fromDebounce, toDebounce).then((availableSpots) => {
      setAvailableSpots(availableSpots);
    });
  }, [fromDebounce, toDebounce]);

  useEffect(() => {
    if (!selectedSpot) {
      return;
    }
    book(
      { from: fromDebounce, to: toDebounce, parkingLotId: selectedSpot.parkingLotId },
      true
    ).then(setBookingSimulation);
  }, [selectedSpot, fromDebounce, toDebounce]);

  function minDate(a: Date, b: Date): Date {
    return new Date(Math.min(a.getTime(), b.getTime()));
  }

  function maxDate(a: Date, b: Date): Date {
    return new Date(Math.max(a.getTime(), b.getTime()));
  }

  function minTo(from: Date): Date {
    return addHours(from, MIN_DURATION_HOURS);
  }

  return (
    <Sheet ref={ref} enableDynamicSizing>
      <BottomSheetView>
        <SafeAreaView>
          <ContentView>
            <View className="flex-col gap-8">
              <View className="flex-col gap-2">
                {availableSpots?.availableSpots.map((spot, i) => {
                  const selected = selectedSpot?.parkingLotId === spot.parkingLotId;
                  return (
                    <Pressable key={i} onPress={() => setSelectedSpot(spot)}>
                      <View className="flex-row justify-between rounded-lg bg-background p-4">
                        <View>
                          <Text variant="title1">{formatRelative(from, now)}</Text>
                          <Text variant="subhead">
                            {formatDuration(
                              intervalToDuration({
                                start: spot.from,
                                end: spot.until,
                              }),
                              { format: ['days', 'hours', 'minutes'] }
                            )}
                          </Text>
                        </View>
                        {selected && <FontAwesome name="check" size={32} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-col items-center justify-between gap-2">
                <View className="flex-row items-center gap-6 self-center">
                  <Text className="w-24">Réserver du</Text>
                  <DatePicker
                    minimumDate={now}
                    value={from}
                    mode="datetime"
                    onChange={(ev) => {
                      const from = maxDate(now, new Date(ev.nativeEvent.timestamp));
                      setFrom(from);
                      setTo(maxDate(minTo(from), to));
                    }}
                  />
                </View>
                <View className="flex-row items-center gap-6">
                  <Text className="w-24">Jusqu'au</Text>
                  <DatePicker
                    minimumDate={minTo(from)}
                    value={to}
                    mode="datetime"
                    onChange={(ev) => {
                      const to = maxDate(minTo(from), new Date(ev.nativeEvent.timestamp));
                      setTo(to);
                      setFrom(minDate(from, to));
                    }}
                  />
                </View>
              </View>
              <View className="flex justify-between">
                <Text variant="heading">
                  {formatDuration(duration, { format: ['days', 'hours', 'minutes'] })}
                </Text>
                <Slider
                  value={differenceInHours(to, from) / MAX_DURATION_HOURS}
                  onValueChange={(value) =>
                    setTo(addHours(from, Math.max(MIN_DURATION_HOURS, value * MAX_DURATION_HOURS)))
                  }
                />
              </View>
              <Button
                variant="primary"
                disabled={!selectedSpot}
                onPress={() =>
                  selectedSpot &&
                  book({
                    from,
                    to,
                    parkingLotId: selectedSpot.parkingLotId,
                  })
                }>
                <Text>
                  {bookingSimulation
                    ? `Réserver pour ${bookingSimulation.usedCredits} crédits`
                    : 'Réserver'}
                </Text>
              </Button>
            </View>
          </ContentView>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
});
