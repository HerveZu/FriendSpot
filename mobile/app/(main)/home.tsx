import { FontAwesome6 } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import {
  addHours,
  addMinutes,
  differenceInHours,
  endOfDay,
  formatDistance,
  formatDuration,
  formatRelative,
  intervalToDuration,
  isTomorrow,
  isWithinInterval,
  max,
  min,
  startOfDay,
} from 'date-fns';
import { Redirect, useRouter } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, View, ViewProps } from 'react-native';
import { useDebounce } from 'use-debounce';

import { SpotCountDownScreenParams } from '~/app/spot-count-down';
import { useCurrentUser } from '~/authentication/UserProvider';
import { Card, InfoCard } from '~/components/Card';
import { ContentSheetView } from '~/components/ContentView';
import { DateRange } from '~/components/DateRange';
import { Deletable, DeletableStatus } from '~/components/Deletable';
import { ListSheet } from '~/components/ListSheet';
import { Rating } from '~/components/Rating';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { Tag } from '~/components/Tag';
import { ThemedIcon } from '~/components/ThemedIcon';
import { SheetTitle, Title } from '~/components/Title';
import { User } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { BookSpotResponse, useBookSpot } from '~/endpoints/book-spot';
import { useCancelBooking } from '~/endpoints/cancel-spot-booking';
import {
  AvailableSpot,
  AvailableSpotsResponse,
  useGetAvailableSpots,
} from '~/endpoints/get-available-spots';
import { BookingResponse, useGetBooking } from '~/endpoints/get-booking';
import { SpotSuggestion, useGetSuggestedSpots } from '~/endpoints/get-suggested-spots';
import { cn } from '~/lib/cn';
import { useActualTime } from '~/lib/use-actual-time';
import { useColorScheme } from '~/lib/useColorScheme';
import { useFetch } from '~/lib/useFetch';
import { capitalize, fromUtc } from '~/lib/utils';
import { COLORS } from '~/theme/colors';

export default function Home() {
  const { userProfile } = useCurrentUser();

  const { colors } = useColorScheme();
  const getBooking = useGetBooking();
  const getSuggestedSpots = useGetSuggestedSpots();
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [bookingListSheetOpen, setBookingListSheetOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SpotSuggestion>();

  const now = useActualTime(5000);
  const [booking] = useFetch(() => getBooking(), []);
  const [suggestedSpots] = useFetch(() => getSuggestedSpots(now, endOfDay(now)), []);

  const activeBookings =
    booking?.bookings.filter((booking) =>
      isWithinInterval(now, { start: booking.from, end: booking.to })
    ) ?? [];

  return !userProfile.spot ? (
    <Redirect href="/user-profile" />
  ) : (
    <ScreenWithHeader
      className="flex-col gap-16"
      stickyBottom={
        <Button
          disabled={!userProfile.spot}
          size="lg"
          variant="primary"
          onPress={() => {
            setSelectedSuggestion(undefined);
            setBookSheetOpen(true);
          }}>
          <ThemedIcon name="search" size={18} color={COLORS.white} />
          <Text>Trouver un spot</Text>
        </Button>
      }>
      <View className="flex-row justify-between">
        <ScreenTitle title="Accueil" />
        <Button
          variant="tonal"
          disabled={booking?.bookings.length === 0}
          onPress={() => setBookingListSheetOpen(true)}>
          <ThemedIcon size={24} name="ticket" color={colors.primary} />
          <Title>{booking?.bookings.length ?? 0}</Title>
        </Button>
      </View>
      {!booking ? (
        <ActivityIndicator />
      ) : activeBookings.length > 0 ? (
        <View className="flex-col gap-2">
          {activeBookings.map((booking, id) => (
            <BookingCard key={id} booking={booking} countdownOnTap />
          ))}
        </View>
      ) : booking.bookings.length > 0 ? (
        <InfoCard
          info={`La prochaine réservation commence dans ${formatDistance(now, booking.bookings[0].from)}`}
        />
      ) : (
        <InfoCard info="Réserve ton premier spot maintenant !" />
      )}
      <View className="flex-col gap-6">
        <Title>Recommandé</Title>
        {!suggestedSpots ? (
          <ActivityIndicator />
        ) : (
          <View className="flex-col gap-2">
            {suggestedSpots.suggestions.map((suggestion, i) => (
              <Pressable key={i} onPress={() => setSelectedSuggestion(suggestion)}>
                <SuggestedSpotCard suggestion={suggestion} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {booking && (
        <ListSheet
          title="Mes réservations"
          action={
            <Button size="lg" variant="primary" onPress={() => setBookSheetOpen(true)}>
              <ThemedIcon name="search" size={18} color={COLORS.white} />
              <Text>Trouver un spot</Text>
            </Button>
          }
          open={bookingListSheetOpen}
          onOpen={setBookingListSheetOpen}>
          {booking.bookings.map((booking, i) => (
            <BookingCard key={i} booking={booking} />
          ))}
        </ListSheet>
      )}
      <BookingSheet
        selectedSuggestion={selectedSuggestion}
        setSelectedSuggestion={setSelectedSuggestion}
        open={bookSheetOpen}
        onOpen={setBookSheetOpen}
      />
    </ScreenWithHeader>
  );
}

function DateStatus({
  from,
  to,
  className,
  ...props
}: { from: Date | string; to: Date | string } & ViewProps) {
  const text = isWithinInterval(new Date(), {
    start: startOfDay(from),
    end: endOfDay(to),
  })
    ? "Aujourd'hui"
    : isTomorrow(from)
      ? 'Demain'
      : undefined;

  return text && <Tag className={className} text={text} {...props} />;
}

function BookingCard(props: { booking: BookingResponse; countdownOnTap?: boolean }) {
  const router = useRouter();
  const now = useActualTime(30_000);
  const { refreshProfile } = useCurrentUser();
  const cancelBooking = useCancelBooking();

  const canDelete = differenceInHours(props.booking.to, now) >= 6;

  function cancel() {
    cancelBooking({
      bookingId: props.booking.id,
      parkingLotId: props.booking.parkingLot.id,
    }).then(refreshProfile);
  }

  return (
    <Deletable canDelete={canDelete} className="rounded-xl" onDelete={cancel}>
      <Pressable
        onPress={() =>
          props.countdownOnTap &&
          props.booking.parkingLot.name &&
          router.navigate({
            pathname: '/spot-count-down',
            params: {
              activeBookingsJson: JSON.stringify([props.booking]),
            } as SpotCountDownScreenParams,
          })
        }>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <DeletableStatus />
              <Text variant="heading" className="font-bold">
                {capitalize(formatRelative(props.booking.from, new Date()))}
              </Text>
            </View>
            {props.booking.parkingLot.name ? (
              <Tag text={`n° ${props.booking.parkingLot.name}`} />
            ) : (
              <DateStatus from={props.booking.from} to={props.booking.to} />
            )}
          </View>
          <User
            displayName={props.booking.owner.displayName}
            pictureUrl={props.booking.owner.pictureUrl}
          />
          <DateRange
            from={props.booking.from}
            to={props.booking.to}
            duration={props.booking.duration}
          />
        </Card>
      </Pressable>
    </Deletable>
  );
}

function BookingSheet(props: {
  selectedSuggestion: SpotSuggestion | undefined;
  setSelectedSuggestion: Dispatch<SetStateAction<SpotSuggestion | undefined>>;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const ref = useSheetRef();

  const MIN_DURATION_HOURS = 0.5;
  const MAX_DURATION_HOURS = 12;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = new Date();
  const [selectedSpot, setSelectedSpot] = useState<AvailableSpot>();
  const [bookingSimulation, setBookingSimulation] = useState<BookSpotResponse>();
  const [from, setFrom] = useState(addMinutes(now, INITIAL_FROM_MARGIN_MINUTES));
  const [to, setTo] = useState(addHours(from, INITIAL_DURATION_HOURS));
  const [availableSpots, setAvailableSpots] = useState<AvailableSpotsResponse>();
  const [actionPending, setActionPending] = useState(false);

  const { userProfile } = useCurrentUser();
  const { colors } = useColorScheme();
  const book = useBookSpot();
  const getAvailableSpots = useGetAvailableSpots();
  const { refreshProfile } = useCurrentUser();
  const [toDebounce] = useDebounce(to, 200);
  const [fromDebounce] = useDebounce(from, 200);

  const duration = useMemo(() => intervalToDuration({ start: from, end: to }), [from, to]);

  useEffect(() => {
    if (!props.selectedSuggestion) {
      return;
    }

    props.onOpen(true);
  }, [props.selectedSuggestion]);

  useEffect(() => {
    const safeFrom = addMinutes(now, INITIAL_FROM_MARGIN_MINUTES);
    const safeTo = addHours(from, INITIAL_DURATION_HOURS);

    setFrom(
      props.selectedSuggestion ? max([safeFrom, fromUtc(props.selectedSuggestion.from)]) : safeFrom
    );
    setTo(props.selectedSuggestion ? max([safeTo, fromUtc(props.selectedSuggestion.to)]) : safeTo);

    if (!props.open) {
      props.setSelectedSuggestion(undefined);
    }
  }, [props.open]);

  useEffect(() => {
    getAvailableSpots(fromDebounce, toDebounce).then((availableSpots) => {
      setAvailableSpots(availableSpots);
    });
  }, [fromDebounce, toDebounce]);

  useEffect(() => {
    if (props.open) {
      ref.current?.present();
    } else {
      setSelectedSpot(undefined);
      ref.current?.dismiss();
    }
  }, [ref.current, props.open]);

  useEffect(() => {
    selectedSpot &&
      book(
        {
          from: fromDebounce,
          to: toDebounce,
          parkingLotId: selectedSpot.parkingLotId,
        },
        true
      ).then(setBookingSimulation);
  }, [selectedSpot, fromDebounce, toDebounce]);

  function minTo(from: Date): Date {
    return addHours(from, MIN_DURATION_HOURS);
  }

  function bookSpot(from: Date, to: Date, parkingLotId: string) {
    setActionPending(true);

    book({
      from,
      to,
      parkingLotId,
    })
      .then(refreshProfile)
      .then(() => props.onOpen(false))
      .finally(() => setActionPending(false));
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
                <SheetTitle>{capitalize(formatRelative(from, now))}</SheetTitle>
              </View>

              {spots.length === 0 ? (
                <View className="my-auto flex-col items-center gap-8">
                  <ThemedIcon name="question" size={36} color={colors.destructive} />
                  <Text variant="title3" className="text-center text-destructive">
                    Aucun spot trouvé durant la période sélectionée
                  </Text>
                </View>
              ) : (
                <View className="grow flex-col gap-2">
                  {spots
                    .sort((spot) => spot.owner.rating)
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
                    const from = max([justAfterNow, new Date(ev.nativeEvent.timestamp)]);
                    setFrom(from);
                    setTo(max([minTo(from), to]));
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
                    const to = max([minTo(from), new Date(ev.nativeEvent.timestamp)]);
                    setTo(to);
                    setFrom(min([from, to]));
                  }}
                />
              </View>
            </View>
            <View className="flex-col justify-between">
              <View className="flex-row items-center gap-2">
                <ThemedIcon component={FontAwesome6} name="clock" size={18} />
                <Text variant="heading">
                  {formatDuration(duration, { format: ['days', 'hours', 'minutes'] })}
                </Text>
              </View>
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
              disabled={
                !selectedSpot ||
                (bookingSimulation && bookingSimulation?.usedCredits > userProfile.wallet.credits)
              }
              onPress={() => selectedSpot && bookSpot(from, to, selectedSpot.parkingLotId)}>
              {actionPending && <ActivityIndicator color={COLORS.white} />}
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
          <User
            displayName={props.spot.owner.displayName}
            pictureUrl={props.spot.owner.pictureUrl}
          />
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
}

function SuggestedSpotCard(props: { suggestion: SpotSuggestion }) {
  const { colors } = useColorScheme();

  return (
    <Card>
      <View className="flex-row items-center gap-2">
        <ThemedIcon name="star" color={colors.primary} size={18} />
        <Text variant="heading" className="font-bold">
          {capitalize(formatRelative(props.suggestion.from, new Date()))}
        </Text>
      </View>

      <Text>
        {`Pendant ${formatDuration(
          intervalToDuration({ start: props.suggestion.from, end: props.suggestion.to }),
          { format: ['days', 'hours', 'minutes'] }
        )}`}
      </Text>
      <View className="flex-row items-center justify-between">
        <User
          displayName={props.suggestion.owner.displayName}
          pictureUrl={props.suggestion.owner.pictureUrl}
        />
        <Rating
          rating={props.suggestion.owner.rating}
          stars={3}
          className="grow-0"
          color={colors.primary}
        />
      </View>
    </Card>
  );
}
