import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  addHours,
  addMinutes,
  differenceInSeconds,
  formatDuration,
  formatRelative,
  intervalToDuration,
  max,
  min,
  secondsToMilliseconds,
} from 'date-fns';
import { Redirect } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import { useCurrentUser } from '~/authentication/UserProvider';
import { MessageInfo } from '~/components/MessageInfo'
import { Card } from '~/components/Card';
import { ContentSheetView } from '~/components/ContentView';
import { DateRange, DateRangeOnly } from '~/components/DateRange';
import { Deletable, DeletableStatus, DeleteTrigger } from '~/components/Deletable';
import { List } from '~/components/List';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { ThemedIcon } from '~/components/ThemedIcon';
import { SheetTitle, Title } from '~/components/Title';
import { User, Users } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { useCancelBooking } from '~/endpoints/cancel-spot-booking';
import {
  AvailabilityBooking,
  AvailabilityBookingUser,
  SpotAvailability,
  useGetAvailabilities,
} from '~/endpoints/get-availabilities';
import { LendSpotResponse, useLendSpot } from '~/endpoints/lend-spot';
import { useActualTime } from '~/lib/useActualTime';
import { useColorScheme } from '~/lib/useColorScheme';
import { useFetch, useLoading } from '~/lib/useFetch';
import { capitalize, parseDuration, rgbToHex } from '~/lib/utils';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { toSeconds } from 'duration-fns';
import { useCancelAvailability } from '~/endpoints/cancel-spot-availability';

export default function MySpotScreen() {
  const { userProfile } = useCurrentUser();

  const getAvailabilities = useGetAvailabilities();
  const [lendSheetOpen, setLendSheetOpen] = useState(false);
  const now = useActualTime(30_000);

  const [availabilities] = useFetch(() => getAvailabilities(now), [now]);

  return !userProfile.spot ? (
    <Redirect href="/user-profile" />
  ) : (
    <ScreenWithHeader
      stickyBottom={
        <Button
          disabled={!userProfile.spot}
          size="lg"
          variant="primary"
          onPress={() => setLendSheetOpen(true)}>
          <ThemedIcon component={MaterialIcons} name="more-time" size={22} />
          <Text>Prêter mon spot</Text>
        </Button>
      }>
      <ScreenTitle title="Mon spot" />
      {!availabilities ? (
        <ActivityIndicator />
      ) : availabilities.availabilities.length > 0 ? (
        <View>
          <Title>Spot prêté</Title>
          <View className={'flex-col gap-4'}>
            {availabilities.availabilities.map((availability) => (
              <MySpotAvailabilityCard
                key={availability.id}
                spotId={userProfile.spot!.id}
                availability={availability}
              />
            ))}
          </View>
        </View>
      ) : (
        <MessageInfo info="Tu ne prêtes pas encore ta place" />
      )}
      <LendSpotSheet open={lendSheetOpen} onOpen={setLendSheetOpen} />
    </ScreenWithHeader>
  );
}

function MySpotAvailabilityCard(props: { spotId: string; availability: SpotAvailability }) {
  const { colors } = useColorScheme();
  const { refreshProfile } = useCurrentUser();
  const now = useActualTime(30_000);
  const cancelAvailability = useCancelAvailability();

  async function cancel() {
    await cancelAvailability({ availabilityId: props.availability.id }).then(refreshProfile);
  }

  const uniqueBookingUsers = [
    ...props.availability.bookings
      .reduce((users, booking) => {
        users.set(booking.bookedBy.id, booking.bookedBy);
        return users;
      }, new Map<string, AvailabilityBookingUser>())
      .values(),
  ];

  return (
    <Deletable className={'rounded-xl'} canDelete={props.availability.canCancel} onDelete={cancel}>
      <Card>
        <View className="flex-row justify-between">
          <View className={'flex-row items-center gap-2'}>
            <DeletableStatus
              fallback={
                <ThemedIcon
                  name="user-friends"
                  color={colors.primary}
                  size={18}
                  component={FontAwesome5}
                />
              }
            />
            <Text variant="heading" className="break-words font-bold">
              {' ' +
                (differenceInSeconds(props.availability.from, now) > 0
                  ? formatRelative(props.availability.from, now)
                  : 'Actuellement')}
            </Text>
          </View>
          <View className={'flex-row gap-2'}>
            <Users users={uniqueBookingUsers} />
            <DeleteTrigger />
          </View>
        </View>
        <DateRange
          from={props.availability.from}
          to={props.availability.to}
          duration={props.availability.duration}
        />
        {props.availability.bookings.length > 0 && (
          <ScrollView>
            <View className="flex-col gap-1">
              {props.availability.bookings.map((booking) => (
                <BookingCard key={booking.id} spotId={props.spotId} booking={booking} />
              ))}
            </View>
          </ScrollView>
        )}
      </Card>
    </Deletable>
  );

  function BookingCard(props: { spotId: string; booking: AvailabilityBooking }) {
    const { refreshProfile } = useCurrentUser();
    const now = useActualTime(30_000);
    const cancelBooking = useCancelBooking();

    function Countdown() {
      const { colors } = useColorScheme();
      const initialRemainingSeconds = useMemo(
        () => differenceInSeconds(props.booking.to, new Date()),
        []
      );
      const durationSeconds = useMemo(() => toSeconds(parseDuration(props.booking.duration)), []);
      const isActive = useMemo(
        () => new Date(props.booking.from).getTime() <= now.getTime(),
        [props.booking.from, now]
      );
      return (
        <View style={{ opacity: isActive ? 1 : 0.4 }} className={'flex-col justify-center'}>
          <CountdownCircleTimer
            strokeWidth={2}
            trailColor={colors.card}
            size={55}
            isPlaying={isActive}
            initialRemainingTime={isActive ? initialRemainingSeconds : durationSeconds}
            duration={durationSeconds}
            colors={[rgbToHex(colors.primary), rgbToHex(colors.destructive)]}
            colorsTime={[0.25 * durationSeconds, 0.75 * durationSeconds]}>
            {({ remainingTime, color }) => {
              const remaining = intervalToDuration({
                start: 0,
                end: new Date(secondsToMilliseconds(remainingTime)),
              });

              return (
                <Text
                  className={'text-xs font-bold'}
                  style={{
                    color,
                  }}>
                  {remaining.hours?.toString().padStart(2, '0') ?? '00'}h
                  {remaining.minutes?.toString().padStart(2, '0') ?? '00'}
                </Text>
              );
            }}
          </CountdownCircleTimer>
        </View>
      );
    }

    return (
      <Deletable
        className="rounded-xl"
        canDelete={props.booking.canCancel}
        onDelete={() =>
          cancelBooking({
            bookingId: props.booking.id,
            parkingLotId: props.spotId,
          }).then(refreshProfile)
        }>
        <Card className="bg-background">
          <View className="flex-row justify-between">
            <View className={'flex-col gap-3'}>
              <User
                displayName={props.booking.bookedBy.displayName}
                pictureUrl={props.booking.bookedBy.pictureUrl}
              />
              <DateRangeOnly from={props.booking.from} to={props.booking.to} short />
            </View>
            <Countdown />
          </View>
        </Card>
      </Deletable>
    );
  }
}

function LendSpotSheet(props: { open: boolean; onOpen: Dispatch<SetStateAction<boolean>> }) {
  const ref = useSheetRef();
  const [lend, actionPending] = useLoading(
    useLendSpot(),
    (_, simulation?: boolean) => !!simulation
  );

  const MIN_DURATION_HOURS = 0.5;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = new Date();
  const { refreshProfile } = useCurrentUser();
  const { colors } = useColorScheme();
  const [from, setFrom] = useState(addMinutes(now, INITIAL_FROM_MARGIN_MINUTES));
  const [to, setTo] = useState(addHours(from, INITIAL_DURATION_HOURS));
  const [simulation, setSimulation] = useState<LendSpotResponse>();

  const [toDebounce] = useDebounce(to, 200);
  const [fromDebounce] = useDebounce(from, 200);

  const duration = useMemo(() => intervalToDuration({ start: from, end: to }), [from, to]);

  useEffect(() => {
    setFrom(addMinutes(now, INITIAL_FROM_MARGIN_MINUTES));
    setTo(addHours(from, INITIAL_DURATION_HOURS));
  }, [props.open]);

  useEffect(() => {
    lend(
      {
        from: fromDebounce,
        to: toDebounce,
      },
      true
    ).then(setSimulation);
  }, [fromDebounce, toDebounce]);

  useEffect(() => {
    if (props.open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [ref.current, props.open]);

  function minTo(from: Date): Date {
    return addHours(from, MIN_DURATION_HOURS);
  }

  function lendSpot(from: Date, to: Date) {
    lend({
      from,
      to,
    })
      .then(refreshProfile)
      .then(() => props.onOpen(false));
  }

  const justAfterNow = addMinutes(now, 5);

  return (
    <Sheet
      ref={ref}
      onDismiss={() => props.onOpen(false)}
      enableDynamicSizing={false}
      snapPoints={[450]}>
      <BottomSheetView>
        <SafeAreaView>
          <ContentSheetView className="h-full flex-col justify-between">
            <List>
              <View className="flex-row items-center gap-4">
                <ThemedIcon name="calendar" size={22} />
                <SheetTitle>{capitalize(formatRelative(from, now))}</SheetTitle>
              </View>
              <View className="flex-row items-center gap-4">
                <ThemedIcon component={FontAwesome6} name="clock" size={18} />
                <Text variant="title3">
                  {formatDuration(duration, { format: ['days', 'hours', 'minutes'] })}
                </Text>
              </View>
            </List>
            {simulation?.overlaps && (
              <View className="mx-auto w-full flex-row items-center justify-center gap-8 p-4">
                <ThemedIcon name="info" size={26} color={colors.primary} />
                <Text variant="title3" className="text-primary">
                  Tu prêtes déjà ta place. La disponibilité sera étendue.
                </Text>
              </View>
            )}
            <View className="flex-col items-center justify-between gap-2">
              <View className="w-full flex-row items-center justify-between">
                <Text className="w-24">Prêter du</Text>
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
            <Button
              variant="primary"
              size="lg"
              disabled={simulation && simulation.earnedCredits <= 0}
              onPress={() => lendSpot(from, to)}>
              {actionPending && <ActivityIndicator color={colors.foreground} />}
              <Text>
                {simulation && simulation.earnedCredits > 0
                  ? `Prêter et gagner jusqu'à ${Math.round(simulation?.earnedCredits)} crédits`
                  : 'Prêter mon spot'}
              </Text>
            </Button>
          </ContentSheetView>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
}
