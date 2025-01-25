import { BottomSheetView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import {
  addHours,
  addMinutes,
  differenceInHours,
  formatDuration,
  formatRelative,
  intervalToDuration,
} from 'date-fns';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, View } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useDebounce } from 'use-debounce';

import { useCurrentUser } from '~/authentication/user-provider';
import ContentView from '~/components/ContentView';
import { Rating } from '~/components/Rating';
import { TFA } from '~/components/TFA';
import { Avatar, AvatarFallback } from '~/components/nativewindui/Avatar';
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
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { capitalize } from '~/lib/utils';

export default function HomeScreen() {
  const { user } = useAuth0();
  const [bookSheetOpen, setBookSheetOpen] = useState(false);

  return (
    <>
      <SafeAreaView>
        <ContentView className="flex-col justify-between pb-8">
          <Text>Salut {user?.name}</Text>
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onPress={() => setBookSheetOpen(true)}>
            <TFA name="search" size={18} />
            <Text>Rechercher un spot</Text>
          </Button>
        </ContentView>
      </SafeAreaView>
      <BookingSheet open={bookSheetOpen} onOpen={setBookSheetOpen} />
    </>
  );
}

function BookingSheet(props: { open: boolean; onOpen: Dispatch<SetStateAction<boolean>> }) {
  const ref = useSheetRef();

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
  const { refreshProfile } = useCurrentUser();
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
    if (props.open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [ref.current, props.open]);

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

  function bookSpot(from: Date, to: Date, parkingLotId: string) {
    book({
      from,
      to,
      parkingLotId,
    })
      .then(refreshProfile)
      .then(() => props.onOpen(false));
  }

  const spots: AvailableSpot[] = availableSpots?.availableSpots.slice(0, 3) ?? [];

  return (
    <Sheet
      ref={ref}
      enableDynamicSizing={false}
      onDismiss={() => props.onOpen(false)}
      snapPoints={[650]}>
      <BottomSheetView>
        <SafeAreaView>
          <ContentView>
            <View className="h-full flex-col gap-8 pb-8 pt-2">
              <View className="grow flex-col gap-6">
                <View className="flex-row items-center gap-4">
                  <TFA name="calendar" size={24} />
                  <Text variant="title1" className="font-bold">
                    {capitalize(formatRelative(from, now))}
                  </Text>
                </View>

                {spots.length === 0 ? (
                  <View className="my-auto flex-col items-center gap-8">
                    <TFA name="question" size={36} color="red" />
                    <Text variant="title3" className="text-center text-destructive">
                      Aucun spot trouvé durant la période sélectionée
                    </Text>
                  </View>
                ) : (
                  <View className="grow flex-col gap-2">
                    {spots.map((spot, i) => (
                      <AvailableSpotCard
                        key={i}
                        spot={spot}
                        selectedSpot={selectedSpot}
                        onSelect={() => setSelectedSpot(spot)}
                      />
                    ))}
                  </View>
                )}
              </View>
              <View className="flex-col items-center justify-between gap-2">
                <View className="w-full flex-row items-center justify-between">
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
                <View className="w-full flex-row items-center justify-between">
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
                size="lg"
                disabled={!selectedSpot}
                onPress={() => selectedSpot && bookSpot(from, to, selectedSpot.parkingLotId)}>
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
}

function AvailableSpotCard(props: {
  spot: AvailableSpot;
  selectedSpot: AvailableSpot | undefined;
  onSelect: () => void;
}) {
  const { colors } = useColorScheme();
  const selected = props.selectedSpot?.parkingLotId === props.spot.parkingLotId;

  return (
    <Pressable onPress={props.onSelect}>
      <View
        className={cn(
          'flex-row items-center justify-between rounded-lg bg-background p-4',
          selected && '-m-[1px] border border-primary'
        )}>
        <View className="flex-row items-center gap-2">
          <Avatar alt="user thumbnail">
            <AvatarFallback>
              <Text>TT</Text>
            </AvatarFallback>
          </Avatar>
          <Text className="font-semibold">Jimmy Le Francais</Text>
        </View>
        <Rating rating={Math.random() * 3} stars={3} className="grow-0" color={colors.primary} />
      </View>
    </Pressable>
  );
}
