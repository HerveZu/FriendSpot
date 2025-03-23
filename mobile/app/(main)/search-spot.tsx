import { FontAwesome6 } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import QuestionIllustration from 'assets/question.svg';
import {
  addHours,
  addMinutes,
  differenceInHours,
  differenceInSeconds,
  formatDistance,
  formatDuration,
  formatRelative,
  intervalToDuration,
  isWithinInterval,
  max,
  min,
} from 'date-fns';
import { Redirect, useRouter } from 'expo-router';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import { SpotCountDownScreenParams } from '~/app/spot-count-down';
import { useCurrentUser } from '~/authentication/UserProvider';
import { MessageInfo } from '~/components/MessageInfo';
import { Card } from '~/components/Card';
import { ContentSheetView } from '~/components/ContentView';
import { DateRange } from '~/components/DateRange';
import { Deletable, DeletableStatus, DeleteTrigger } from '~/components/Deletable';
import { List } from '~/components/List';
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
import { useBookSpot } from '~/endpoints/book-spot';
import { useCancelBooking } from '~/endpoints/cancel-spot-booking';
import { AvailableSpot, useGetAvailableSpots } from '~/endpoints/get-available-spots';
import { BookingResponse, useGetBooking } from '~/endpoints/get-booking';
import { SpotSuggestion, useGetSuggestedSpots } from '~/endpoints/get-suggested-spots';
import { cn } from '~/lib/cn';
import { useActualTime } from '~/lib/useActualTime';
import { useColorScheme } from '~/lib/useColorScheme';
import { useFetch, useLoading } from '~/lib/useFetch';
import { capitalize, fromUtc } from '~/lib/utils';
import { COLORS } from '~/theme/colors';
import { Modal, ModalTitle } from '~/components/Modal';
import SuccessIllustration from 'assets/succes.svg';
import BlinkingDot from '~/components/BlinkingDot';
import { pluralize } from '~/lib/locale';

export default function SearchSpotScreen() {
  const { userProfile } = useCurrentUser();

  const { colors } = useColorScheme();
  const getBooking = useGetBooking();
  const getSuggestedSpots = useGetSuggestedSpots();
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [bookingListSheetOpen, setBookingListSheetOpen] = useState(false);
  const [nextReservedSpot, setNextReservedSpot] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SpotSuggestion>();
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);

  const now = useActualTime(5000);
  const [booking] = useFetch(() => getBooking(), []);
  const [suggestedSpots] = useFetch(() => getSuggestedSpots(now, addHours(now, 12)), []);

  const activeBookings =
    booking?.bookings
      .filter((booking) => isWithinInterval(now, { start: booking.from, end: booking.to }))
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()) ?? [];

  const activeBookingsCount = activeBookings.length;

  useEffect(() => {
    (!booking || booking.bookings.length === 0) && setBookingListSheetOpen(false);
  }, [booking]);

  useEffect(() => {
    !bookSheetOpen && setSelectedSuggestion(undefined);
  }, [bookSheetOpen]);

  useEffect(() => {
    setBookSheetOpen(!!selectedSuggestion);
  }, [selectedSuggestion]);

  return !userProfile.spot ? (
    <Redirect href="/user-profile" />
  ) : (
    <ScreenWithHeader
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
          <Text>Réserve un spot</Text>
        </Button>
      }>
      <View className="flex-row justify-between">
        <ScreenTitle title="Réserve un spot">
          <Button
            className={'h-full'}
            variant={'primary'}
            disabled={booking?.bookings.length === 0}
            onPress={() => setBookingListSheetOpen(true)}>
            <ThemedIcon size={18} name="car" color={colors.foreground} />
            <Text>{booking?.bookings.length ?? 0}</Text>
          </Button>
        </ScreenTitle>
      </View>
      {infoModalOpen && (
        <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
          <ModalTitle className=" justify-center text-center" text={`Nouveau spot réservé !`} />
          <View className="items-center">
            <SuccessIllustration width={250} height={250} />
          </View>
          <Button
            variant="primary"
            onPress={() => {
              setInfoModalOpen(false);
              setBookingListSheetOpen(true);
            }}>
            <Text>Voir mes réservations</Text>
          </Button>
        </Modal>
      )}
      {!booking ? (
        <ActivityIndicator />
      ) : activeBookings.length > 0 ? (
        <View className="flex-col gap-4">
          <View className="flex-row items-center gap-2">
            <BlinkingDot className={'-top-[5]'} color={colors.destructive} />
            <Title>{`Tu occupes ce${pluralize(activeBookingsCount)} spot${pluralize(activeBookingsCount)}`}</Title>
          </View>
          {activeBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} countdownOnTap />
          ))}
        </View>
      ) : booking.bookings.length > 0 ? (
        <MessageInfo
          info={`Ta prochaine réservation commence dans ${formatDistance(now, booking.bookings[0].from)}`}
          action={() => {
            setBookingListSheetOpen(true);
            setNextReservedSpot(true);
          }}
        />
      ) : (
        <MessageInfo info="Réserve un spot dès maintenant !" />
      )}
      <View className="flex-col">
        {!suggestedSpots ? (
          <ActivityIndicator />
        ) : (
          suggestedSpots.suggestions.length > 0 && (
            <>
              <Title>Spots Suggérés</Title>
              <List>
                {suggestedSpots.suggestions.map((suggestion, i) => (
                  <Pressable key={i} onPress={() => setSelectedSuggestion(suggestion)}>
                    <SuggestedSpotCard suggestion={suggestion} />
                  </Pressable>
                ))}
              </List>
            </>
          )
        )}
      </View>

      {booking && (
        <ListSheet
          title={`${nextReservedSpot ? 'Prochaine réservation' : 'Réservations'}`}
          setNextReservedSpot={setNextReservedSpot}
          action={
            !nextReservedSpot && (
              <Button
                size="lg"
                variant="primary"
                onPress={() => {
                  setBookingListSheetOpen(false);
                  setBookSheetOpen(true);
                }}>
                <ThemedIcon name="search" size={18} color={COLORS.white} />
                <Text>Réserve un spot</Text>
              </Button>
            )
          }
          open={bookingListSheetOpen}
          onOpen={setBookingListSheetOpen}>
          {nextReservedSpot && booking.bookings.length > 0 ? (
            <BookingCard booking={booking.bookings[0]} deletable={true} />
          ) : (
            booking.bookings
              .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
              .map((booking) => <BookingCard key={booking.id} booking={booking} deletable={true} />)
          )}
        </ListSheet>
      )}
      <BookingSheet
        selectedSuggestion={selectedSuggestion}
        open={bookSheetOpen}
        onOpen={setBookSheetOpen}
        infoModalOpen={infoModalOpen}
        setInfoModalOpen={setInfoModalOpen}
      />
    </ScreenWithHeader>
  );
}

function BookingCard(props: {
  booking: BookingResponse;
  countdownOnTap?: boolean;
  deletable?: boolean;
}) {
  const router = useRouter();
  const { colors } = useColorScheme();
  const now = useActualTime(30_000);
  const { refreshProfile } = useCurrentUser();
  const cancelBooking = useCancelBooking();

  const canDelete = !!props.deletable && props.booking.canCancel;
  const [lockInfo, setLockInfo] = useState(false);

  return (
    <>
      <Deletable
        disabled={!props.deletable}
        canDelete={canDelete}
        className={'rounded-xl'}
        onDelete={() =>
          cancelBooking({
            bookingId: props.booking.id,
            parkingLotId: props.booking.parkingLot.id,
          }).then(refreshProfile)
        }>
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
              <View className="flex-row items-center gap-2">
                {props.deletable ? (
                  <DeletableStatus
                    fallback={<ThemedIcon name={'ticket'} size={18} color={colors.primary} />}
                  />
                ) : (
                  <ThemedIcon name={'ticket'} size={18} color={colors.primary} />
                )}
                <Text variant="heading" className="font-bold">
                  {capitalize(formatRelative(props.booking.from, now))}
                </Text>
              </View>
              <DeleteTrigger />
            </View>
            <View className="flex-row items-center justify-between gap-4">
              <User
                displayName={props.booking.owner.displayName}
                pictureUrl={props.booking.owner.pictureUrl}
              />
              <View>
                {props.booking.parkingLot.name ? (
                  <Tag text={`Spot n° ${props.booking.parkingLot.name}`} />
                ) : (
                  <Tag onPress={() => setLockInfo(!lockInfo)} text={'Spot n°'} icon={'lock'} />
                )}
              </View>
            </View>
            <DateRange
              from={props.booking.from}
              to={props.booking.to}
              duration={props.booking.duration}
            />
          </Card>
        </Pressable>
      </Deletable>
      <Modal open={lockInfo} onOpenChange={() => setLockInfo(false)}>
        <ModalTitle text={'Comment ça marche ?'} />
        <View className="w-full">
          <Text>Le numéro du spot sera révélé au début de la réservation.</Text>
        </View>
      </Modal>
    </>
  );
}

function BookingSheet(props: {
  selectedSuggestion: SpotSuggestion | undefined;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  infoModalOpen?: boolean;
  setInfoModalOpen?: Dispatch<SetStateAction<boolean>>;
}) {
  const ref = useSheetRef();

  const MIN_DURATION_HOURS = 0.5;
  const MAX_DURATION_HOURS = 12;
  const STEP_HOURS = 0.25;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = new Date();
  const [selectedSpot, setSelectedSpot] = useState<AvailableSpot>();
  const [from, setFrom] = useState(addMinutes(now, INITIAL_FROM_MARGIN_MINUTES));
  const [to, setTo] = useState(addHours(from, INITIAL_DURATION_HOURS));

  const { userProfile } = useCurrentUser();
  const { colors } = useColorScheme();
  const [book, actionPending] = useLoading(
    useBookSpot(),
    (_, simulation?: boolean) => !!simulation
  );
  const getAvailableSpots = useGetAvailableSpots();
  const { refreshProfile } = useCurrentUser();
  const [toDebounce] = useDebounce(to, 200);
  const [fromDebounce] = useDebounce(from, 200);

  const [bookingSimulation, setBookingSimulation] = useFetch(
    () =>
      selectedSpot &&
      book(
        {
          from: fromDebounce,
          to: toDebounce,
          parkingLotId: selectedSpot.parkingLotId,
        },
        true
      ),
    [selectedSpot, fromDebounce, toDebounce]
  );

  const duration = useMemo(() => intervalToDuration({ start: from, end: to }), [from, to]);

  const [availableSpots] = useFetch(
    () => getAvailableSpots(fromDebounce, toDebounce),
    [fromDebounce, toDebounce]
  );

  useEffect(() => {
    if (props.open) {
      ref.current?.present();
    } else {
      setSelectedSpot(undefined);
      setBookingSimulation(undefined);
      ref.current?.dismiss();
    }
  }, [ref.current, props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    const safeFrom = addMinutes(now, INITIAL_FROM_MARGIN_MINUTES);
    const safeTo = addHours(from, INITIAL_DURATION_HOURS);

    setFrom(
      props.selectedSuggestion ? max([safeFrom, fromUtc(props.selectedSuggestion.from)]) : safeFrom
    );
    setTo(props.selectedSuggestion ? fromUtc(props.selectedSuggestion.to) : safeTo);
  }, [props.open, props.selectedSuggestion]);

  useEffect(() => {
    if (!props.selectedSuggestion) return;

    setSelectedSpot(props.selectedSuggestion);
  }, [props.selectedSuggestion]);

  function minTo(from: Date): Date {
    return addHours(from, MIN_DURATION_HOURS);
  }

  const triggerModal = useMemo(() => {
    return () => {
      setTimeout(() => {
        props.setInfoModalOpen && props.setInfoModalOpen(true);
      }, 500);
    };
  }, [props.setInfoModalOpen]);

  function bookSpot(from: Date, to: Date, parkingLotId: string) {
    book({
      from,
      to,
      parkingLotId,
    })
      .then(refreshProfile)
      .then(() => props.onOpen(false))
      .then(() => {
        triggerModal();
      });
  }

  const spots: AvailableSpot[] =
    availableSpots?.availableSpots.filter(
      (spot) =>
        !props.selectedSuggestion || spot.parkingLotId === props.selectedSuggestion.parkingLotId
    ) ?? [];
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
                <View className="my-auto flex-col items-center gap-4">
                  <QuestionIllustration width={150} height={150} />
                  <Text variant="body" className="text-center text-primary">
                    Aucun spot n’est disponible {'\n'} sur cette période.
                  </Text>
                </View>
              ) : (
                <View className="grow flex-col gap-2">
                  {spots
                    .sort((spot) => spot.owner.rating)
                    .reverse()
                    .slice(0, 3)
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
                step={STEP_HOURS / MAX_DURATION_HOURS}
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
                !bookingSimulation || bookingSimulation?.usedCredits > userProfile.wallet.credits
              }
              onPress={() => selectedSpot && bookSpot(from, to, selectedSpot.parkingLotId)}>
              {actionPending && <ActivityIndicator color={colors.foreground} />}
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
  const now = useActualTime(30_000);

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <ThemedIcon component={FontAwesome6} name="calendar" color={colors.primary} size={18} />
          <Text variant="heading" className="font-bold">
            {differenceInSeconds(props.suggestion.from, now) > 0
              ? capitalize(formatRelative(props.suggestion.from, now))
              : 'Maintenant'}
          </Text>
        </View>
        <Rating
          rating={props.suggestion.owner.rating}
          stars={3}
          className="grow-0"
          color={colors.primary}
        />
      </View>
      <User
        displayName={props.suggestion.owner.displayName}
        pictureUrl={props.suggestion.owner.pictureUrl}
      />
    </Card>
  );
}
