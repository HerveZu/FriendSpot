import { FontAwesome5, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  addHours,
  addMinutes,
  differenceInHours,
  differenceInSeconds,
  formatDuration,
  formatRelative,
  intervalToDuration,
  max,
  min,
} from 'date-fns';
import { Redirect } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import { useCurrentUser } from '~/authentication/UserProvider';
import { Card, InfoCard } from '~/components/Card';
import { ContentSheetView } from '~/components/ContentView';
import { DateRange } from '~/components/DateRange';
import { Deletable, DeletableStatus } from '~/components/Deletable';
import { List } from '~/components/List';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { ThemedIcon } from '~/components/ThemedIcon';
import { SheetTitle } from '~/components/Title';
import { User } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { useCancelBooking } from '~/endpoints/cancel-spot-booking';
import {
  AvailabilityBooking,
  SpotAvailability,
  useGetAvailabilities,
} from '~/endpoints/get-availabilities';
import { LendSpotResponse, useLendSpot } from '~/endpoints/lend-spot';
import { BOOKING_FROZEN_FOR_HOURS } from '~/lib/const';
import { useActualTime } from '~/lib/useActualTime';
import { useColorScheme } from '~/lib/useColorScheme';
import { useFetch } from '~/lib/useFetch';
import { capitalize } from '~/lib/utils';

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
        <View className="w-full grow flex-col justify-center gap-4">
          {availabilities.availabilities.map((availability) => (
            <MySpotAvailabilityCard
              key={availability.id}
              spotId={userProfile.spot!.id}
              availability={availability}
            />
          ))}
        </View>
      ) : (
        <InfoCard info="Tu ne prêtes pas encore ta place" />
      )}
      <LendSpotSheet open={lendSheetOpen} onOpen={setLendSheetOpen} />
    </ScreenWithHeader>
  );
}

function MySpotAvailabilityCard(props: { spotId: string; availability: SpotAvailability }) {
  const { colors } = useColorScheme();
  const now = useActualTime(30_000);

  return (
    <Card>
      <View className="flex-row items-center gap-2">
        <ThemedIcon name="user-friends" color={colors.primary} size={18} component={FontAwesome5} />
        <Text variant="heading" className="break-words font-bold">
          Je propose mon spot
          {' ' +
            (differenceInSeconds(props.availability.from, now) > 0
              ? formatRelative(props.availability.from, now)
              : 'maintenant')}
        </Text>
      </View>
      <DateRange
        from={props.availability.from}
        to={props.availability.to}
        duration={props.availability.duration}
      />
      {props.availability.bookings.length > 0 && (
        <ScrollView>
          <View className="flex-col gap-2">
            {props.availability.bookings.map((booking) => (
              <BookingCard key={booking.id} spotId={props.spotId} booking={booking} />
            ))}
          </View>
        </ScrollView>
      )}
    </Card>
  );

  function BookingCard(props: { spotId: string; booking: AvailabilityBooking }) {
    const { refreshProfile } = useCurrentUser();
    const now = useActualTime(30_000);
    const cancelBooking = useCancelBooking();

    return (
      <Deletable
        className="rounded-xl"
        canDelete={differenceInHours(props.booking.to, now) >= BOOKING_FROZEN_FOR_HOURS}
        onDelete={() =>
          cancelBooking({
            bookingId: props.booking.id,
            parkingLotId: props.spotId,
          }).then(refreshProfile)
        }>
        <Card className="bg-background">
          <View className="flex-row justify-between">
            <User
              displayName={props.booking.bookedBy.displayName}
              pictureUrl={props.booking.bookedBy.pictureUrl}
            />
            <DeletableStatus />
          </View>
          <DateRange
            from={props.booking.from}
            to={props.booking.to}
            duration={props.booking.duration}
          />
        </Card>
      </Deletable>
    );
  }
}

function LendSpotSheet(props: { open: boolean; onOpen: Dispatch<SetStateAction<boolean>> }) {
  const ref = useSheetRef();
  const lend = useLendSpot();

  const MIN_DURATION_HOURS = 0.5;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = new Date();
  const { refreshProfile } = useCurrentUser();
  const { colors } = useColorScheme();
  const [from, setFrom] = useState(addMinutes(now, INITIAL_FROM_MARGIN_MINUTES));
  const [to, setTo] = useState(addHours(from, INITIAL_DURATION_HOURS));
  const [actionPending, setActionPending] = useState(false);
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
    setActionPending(true);

    lend({
      from,
      to,
    })
      .then(refreshProfile)
      .then(() => props.onOpen(false))
      .finally(() => setActionPending(false));
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
              <View className="mx-auto flex-row items-center gap-4">
                <ThemedIcon name="info" size={26} color={colors.primary} />
                <Text variant="title3" className="text-primary">
                  Tu prêtes déjà ta place
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
                  ? `Prêter et gagner jusqu'à ${simulation?.earnedCredits} crédits`
                  : 'Prêter mon spot'}
              </Text>
            </Button>
          </ContentSheetView>
        </SafeAreaView>
      </BottomSheetView>
    </Sheet>
  );
}
