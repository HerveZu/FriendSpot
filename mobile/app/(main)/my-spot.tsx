import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import TreeIllustration from 'assets/tree.svg';
import { BlinkingDot } from '~/components/BlinkingDot';
import {
  addHours,
  addMinutes,
  differenceInSeconds,
  formatDuration,
  formatRelative,
  intervalToDuration,
  isWithinInterval,
  max,
  min,
  secondsToMilliseconds,
} from 'date-fns';
import { Redirect } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useDebounce } from 'use-debounce';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '~/authentication/UserProvider';
import { MessageInfo } from '~/components/MessageInfo';
import { Card } from '~/components/Card';
import { ContentSheetView } from '~/components/ContentView';
import { DateRange, DateRangeOnly } from '~/components/DateRange';
import { Deletable, DeleteTrigger } from '~/components/Deletable';
import { List } from '~/components/List';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { ThemedIcon } from '~/components/ThemedIcon';
import { SheetTitle, Title } from '~/components/Title';
import { User, Users } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { useCancelBooking } from '~/endpoints/booking/cancel-spot-booking';
import {
  AvailabilityBooking,
  AvailabilityBookingUser,
  SpotAvailability,
  useGetAvailabilities,
} from '~/endpoints/booking/get-availabilities';
import { LendSpotResponse, useLendSpot } from '~/endpoints/booking/lend-spot';
import { useActualTime } from '~/lib/useActualTime';
import { useColorScheme } from '~/lib/useColorScheme';
import { useFetch, useLoading } from '~/lib/useFetch';
import { capitalize, parseDuration, rgbToHex } from '~/lib/utils';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { toSeconds } from 'duration-fns';
import { useCancelAvailability } from '~/endpoints/booking/cancel-spot-availability';
import { cn } from '~/lib/cn';
import { ScrollView } from 'react-native-gesture-handler';

export default function MySpotScreen() {
  const { t } = useTranslation();
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
          <Text>{t('lending.lendMySpot')}</Text>
        </Button>
      }>
      <ScreenTitle title={t('mySpot.title')} />
      {!availabilities ? (
        <ActivityIndicator />
      ) : availabilities.availabilities.length > 0 ? (
        <View>
          <Title>{t('lending.spotIsAvailable')}</Title>
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
        <View className="flex-col items-center justify-center gap-10">
          <MessageInfo info={t('lending.notLendingYet')} />
          <TreeIllustration width={280} height={280} />
        </View>
      )}
      <LendSpotSheet open={lendSheetOpen} onOpen={setLendSheetOpen} />
    </ScreenWithHeader>
  );
}

function MySpotAvailabilityCard(props: { spotId: string; availability: SpotAvailability }) {
  const { colors } = useColorScheme();
  const { refreshProfile } = useCurrentUser();
  const { t } = useTranslation();
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
        <View className="flex-col justify-between gap-2">
          <View className="flex-row items-start justify-between gap-4">
            <DateRange
              from={props.availability.from}
              to={props.availability.to}
              duration={props.availability.duration}
            />
            <View className="flex-row items-center gap-2">
              <Users users={uniqueBookingUsers} />
              <DeleteTrigger />
            </View>
          </View>
          {props.availability.bookings.length === 0 && (
            <View className="mt-2 flex-row items-center gap-2">
              <BlinkingDot color={colors.primary} />
              <Text className="text-xs">{t('lending.waitingForBooking')}</Text>
            </View>
          )}
        </View>
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

    const isCurrently = useMemo(() => {
      return isWithinInterval(now, {
        start: new Date(props.booking.from),
        end: new Date(props.booking.to),
      });
    }, [props.booking.from, props.booking.to, now]);

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
          <View className={cn('flex-row justify-between', !isCurrently && 'opacity-60')}>
            <View className={'flex-col gap-4'}>
              <User
                displayName={props.booking.bookedBy.displayName}
                pictureUrl={props.booking.bookedBy.pictureUrl}
              />
              {isCurrently && (
                <View>
                  <View className="flex-row items-center gap-2">
                    <BlinkingDot color={colors.destructive} />
                    <Text className="text-xs">{t('lending.currentlyUsingSpot')}</Text>
                  </View>
                </View>
              )}
              <DateRangeOnly from={props.booking.from} to={props.booking.to} />
            </View>
            {isCurrently && <Countdown />}
          </View>
        </Card>
      </Deletable>
    );
  }
}

function LendSpotSheet(props: { open: boolean; onOpen: Dispatch<SetStateAction<boolean>> }) {
  const { t } = useTranslation();
  const ref = useSheetRef();
  const [lend, actionPending] = useLoading(useLendSpot(), {
    skiLoadingWhen: (_, simulation?: boolean) => !!simulation,
    beforeMarkingComplete: () => props.onOpen(false),
  });

  const MIN_DURATION_HOURS = 0.5;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = useActualTime(60_000);
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
    }).then(refreshProfile);
  }

  const justAfterNow = addMinutes(now, 5);

  return (
    <Sheet
      ref={ref}
      onDismiss={() => props.onOpen(false)}
      enableDynamicSizing={false}
      snapPoints={[
        simulation?.overlaps
          ? Platform.select({ android: 550, default: 500 })
          : Platform.select({ android: 400, default: 350 }),
      ]}>
      <BottomSheetView>
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
              <Text variant="title3" className="text-center text-primary">
                {t('lending.spotAlreadyShared')}
              </Text>
            </View>
          )}

          <View className={'flex-col gap-8'}>
            <View className="flex-col items-center justify-between gap-2">
              <View className="w-full flex-row items-center justify-between">
                <Text className="w-24">{t('lending.lendFrom')}</Text>
                <DatePicker
                  minimumDate={justAfterNow}
                  value={from}
                  mode="datetime"
                  materialTimeClassName={'w-24'}
                  materialDateClassName={'w-32'}
                  onChange={(ev) => {
                    const from = max([justAfterNow, new Date(ev.nativeEvent.timestamp)]);
                    setFrom(from);
                    setTo(max([minTo(from), to]));
                  }}
                />
              </View>
              <View className="w-full flex-row items-center justify-between">
                <Text className="w-24">{t('lending.lendUntil')}</Text>
                <DatePicker
                  minimumDate={minTo(from)}
                  value={to}
                  mode="datetime"
                  materialTimeClassName={'w-24'}
                  materialDateClassName={'w-32'}
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
                  ? t('lending.lendAndEarnCredits', {
                      credits: Math.round(simulation?.earnedCredits),
                    })
                  : t('lending.lendMySpot')}
              </Text>
            </Button>
          </View>
        </ContentSheetView>
      </BottomSheetView>
    </Sheet>
  );
}
