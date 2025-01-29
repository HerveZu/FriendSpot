import { FontAwesome6 } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import {
  addHours,
  addMinutes,
  differenceInHours,
  differenceInMinutes,
  format,
  formatDistance,
  formatDuration,
  formatRelative,
  intervalToDuration,
  isToday,
  isTomorrow,
} from 'date-fns';
import { toMinutes } from 'duration-fns';
import { useRouter } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import { SpotCountDownScreenParams } from '~/app/spot-count-down';
import { useCurrentUser } from '~/authentication/UserProvider';
import { ContentSheetView, ContentView } from '~/components/ContentView';
import { Rating } from '~/components/Rating';
import { ThemedIcon } from '~/components/ThemedIcon';
import { UserAvatar } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { ProgressIndicator } from '~/components/nativewindui/ProgressIndicator';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { BookSpotResponse, useBook } from '~/endpoints/book';
import { AvailabilitiesResponse, useGetAvailabilities } from '~/endpoints/get-availabilities';
import {
  AvailableSpot,
  AvailableSpotsResponse,
  useGetAvailableSpots,
} from '~/endpoints/get-available-spots';
import { BookingResponse, BookingsResponse, useGetBooking } from '~/endpoints/get-booking';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { capitalize, parseDuration } from '~/lib/utils';
import { COLORS } from '~/theme/colors';

export default function HomeScreen() {
  const { userProfile } = useCurrentUser();
  const { colors } = useColorScheme();
  const getBooking = useGetBooking();
  const getAvailabilities = useGetAvailabilities();
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [bookingListSheetOpen, setBookingListSheetOpen] = useState(false);
  const [booking, setBooking] = useState<BookingsResponse>();
  const [availabilities, setAvailabilities] = useState<AvailabilitiesResponse>();

  useEffect(() => {
    !bookSheetOpen && getBooking().then(setBooking);
  }, [bookSheetOpen]);

  useEffect(() => {
    getAvailabilities().then(setAvailabilities);
  }, []);

  return (
    <>
      <SafeAreaView>
        <ContentView className="flex-col gap-20 pb-8">
          <View className="h-1/2 flex-col gap-6">
            <Text variant="title1">Mes réservations</Text>
            {booking && (
              <View className="flex-col gap-4">
                {booking.bookings.slice(0, 2).map((booking, id) => (
                  <BookingCard key={id} booking={booking} countdownOnTap />
                ))}

                {booking.bookings.length > 0 && (
                  <Button variant="tonal" onPress={() => setBookingListSheetOpen(true)}>
                    <Text>Voir plus</Text>
                  </Button>
                )}
              </View>
            )}
          </View>
          <View className="grow">
            <View className="flex-row justify-between">
              <Text variant="title1">Mon spot</Text>
              <Button
                disabled={!userProfile.spot}
                size="lg"
                variant="secondary"
                className=""
                onPress={() => setBookSheetOpen(true)}>
                <ThemedIcon name="calendar" size={18} color={colors.primary} />
              </Button>
            </View>
          </View>
          <Button
            disabled={!userProfile.spot}
            size="lg"
            variant="primary"
            onPress={() => setBookSheetOpen(true)}>
            <ThemedIcon component={FontAwesome6} name="car" size={18} color={COLORS.white} />
            <Text>Trouver un spot</Text>
          </Button>
        </ContentView>
      </SafeAreaView>
      {booking && (
        <BookingListSheet
          bookings={booking}
          open={bookingListSheetOpen}
          onOpen={setBookingListSheetOpen}
          onBookPress={() => setBookSheetOpen(true)}
        />
      )}
      {userProfile.spot && <BookingSheet open={bookSheetOpen} onOpen={setBookSheetOpen} />}
    </>
  );
}

function BookingCard(props: { booking: BookingResponse; countdownOnTap?: boolean }) {
  const router = useRouter();

  const elapsedMinutes =
    props.booking.spotName && differenceInMinutes(new Date(), props.booking.from);
  const duration = parseDuration(props.booking.duration);

  return (
    <Pressable
      onPress={() =>
        props.countdownOnTap &&
        props.booking.spotName &&
        router.navigate({
          pathname: '/spot-count-down',
          params: {
            activeBookingsJson: JSON.stringify([props.booking]),
          } as SpotCountDownScreenParams,
        })
      }>
      <View className="flex-col gap-4 rounded-xl bg-card p-4">
        <View className="flex-row justify-between">
          <View className="relative flex-row items-center gap-4">
            <UserAvatar
              displayName={props.booking.owner.displayName}
              pictureUrl={props.booking.owner.pictureUrl}
            />
            <Text variant="heading">{props.booking.owner.displayName}</Text>
          </View>
          {props.booking.spotName ? (
            <View className="absolute right-0 top-0 w-fit rounded-xl bg-primary px-2">
              <Text>Place n° {props.booking.spotName}</Text>
            </View>
          ) : (
            <>
              {isToday(props.booking.from) && (
                <View className="absolute right-0 top-0 w-fit rounded-xl bg-primary px-2">
                  <Text>Aujourd'hui</Text>
                </View>
              )}
              {isTomorrow(props.booking.from) && (
                <View className="absolute right-0 top-0 w-fit rounded-xl bg-primary px-2">
                  <Text>Demain</Text>
                </View>
              )}
            </>
          )}
        </View>
        {elapsedMinutes ? (
          <View className="flex-col gap-2">
            <Text>Il reste {formatDistance(props.booking.to, new Date())}</Text>
            <ProgressIndicator
              className="h-4"
              value={(100 * elapsedMinutes) / toMinutes(duration)}
            />
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <Text variant="subhead">{format(props.booking.from, 'dd MMMM HH:mm')}</Text>
            <ThemedIcon name="arrow-right" />
            <Text variant="subhead">{format(props.booking.to, 'dd MMMM HH:mm')}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function BookingListSheet(props: {
  bookings: BookingsResponse;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  onBookPress: () => void;
}) {
  const ref = useSheetRef();

  useEffect(() => {
    if (props.open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [ref.current, props.open]);

  return (
    <Sheet ref={ref} onDismiss={() => props.onOpen(false)}>
      <BottomSheetView>
        <SafeAreaView>
          <ContentSheetView className="flex-col justify-between gap-4">
            <Text variant="title1">Toutes mes réservations</Text>
            <ScrollView>
              <View className="flex-col gap-4">
                {props.bookings.bookings.map((booking, i) => (
                  <BookingCard booking={booking} key={i} />
                ))}
              </View>
            </ScrollView>
            <Button
              size="lg"
              variant="primary"
              onPress={() => {
                props.onOpen(false);
                props.onBookPress();
              }}>
              <ThemedIcon component={FontAwesome6} name="car" size={18} color={COLORS.white} />
              <Text>Trouver un spot</Text>
            </Button>
          </ContentSheetView>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
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
  const justAfterNow = addMinutes(now, 5);

  return (
    <Sheet
      ref={ref}
      enableDynamicSizing={false}
      onDismiss={() => props.onOpen(false)}
      snapPoints={[650]}>
      <BottomSheetView>
        <SafeAreaView>
          <ContentSheetView className="h-full flex-col gap-8">
            <View className="grow flex-col gap-6">
              <View className="flex-row items-center gap-4">
                <ThemedIcon name="calendar" size={22} />
                <Text variant="title1" className="font-bold">
                  {capitalize(formatRelative(from, now))}
                </Text>
              </View>

              {spots.length === 0 ? (
                <View className="my-auto flex-col items-center gap-8">
                  <ThemedIcon name="question" size={36} color="red" />
                  <Text variant="title3" className="text-center text-destructive">
                    Aucun spot trouvé durant la période sélectionée
                  </Text>
                </View>
              ) : (
                <View className="grow flex-col gap-2">
                  {spots
                    .sort((spot) => spot.owner.rating)
                    .reverse()
                    .map((spot, i) => (
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
                  minimumDate={justAfterNow}
                  value={from}
                  mode="datetime"
                  onChange={(ev) => {
                    const from = maxDate(justAfterNow, new Date(ev.nativeEvent.timestamp));
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
          </ContentSheetView>
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
          <UserAvatar
            displayName={props.spot.owner.displayName}
            pictureUrl={props.spot.owner.pictureUrl}
          />
          <Text className="font-semibold">{props.spot.owner.displayName}</Text>
        </View>
        <Rating
          rating={props.spot.owner.rating}
          stars={3}
          className="grow-0"
          color={colors.primary}
        />
      </View>
    </Pressable>
  );
}
