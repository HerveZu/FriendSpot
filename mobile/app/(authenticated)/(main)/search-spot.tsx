import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { Slider } from '~/components/nativewindui/Slider';
import {
  addHours,
  addMinutes,
  differenceInHours,
  differenceInMilliseconds,
  differenceInSeconds,
  formatDistance,
  formatDuration,
  formatRelative,
  intervalToDuration,
  isAfter,
  isBefore,
  isWithinInterval,
  max,
  min,
} from 'date-fns';
import { Redirect, useRouter } from 'expo-router';
import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { useDebounce } from 'use-debounce';

import { SpotCountDownScreenParams } from '~/app/(authenticated)/spot-count-down';
import { useCurrentUser } from '~/authentication/UserProvider';
import { MessageInfo } from '~/components/MessageInfo';
import { Card, CardContainer, CardTitle } from '~/components/Card';
import { DateRange } from '~/components/DateRange';
import { Deletable, DeletableStatus, DeleteTrigger } from '~/components/Deletable';
import { List } from '~/components/List';
import { Rating } from '~/components/Rating';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { Tag } from '~/components/Tag';
import { KnownIcon, ThemedIcon } from '~/components/ThemedIcon';
import { SheetHeading, SheetTitle, Title } from '~/components/Title';
import { User } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
import { Text } from '~/components/nativewindui/Text';
import { useBookSpot } from '~/endpoints/booking/book-spot';
import { useCancelBooking } from '~/endpoints/booking/cancel-spot-booking';
import { AvailableSpot, useGetAvailableSpots } from '~/endpoints/booking/get-available-spots';
import { BookingResponse, useGetBooking } from '~/endpoints/booking/get-booking';
import { SpotSuggestion, useGetSuggestedSpots } from '~/endpoints/booking/get-suggested-spots';
import { cn } from '~/lib/cn';
import { useActualTime } from '~/lib/useActualTime';
import { useColorScheme } from '~/lib/useColorScheme';
import { useFetch, useHookFetch, useLoading, useRefreshOnSuccess } from '~/lib/useFetch';
import { capitalize, durationToMs, fromUtc } from '~/lib/utils';
import { Modal, ModalTitle } from '~/components/Modal';
import SuccessIllustration from '~/assets/success.svg';
import { BlinkingDot } from '~/components/BlinkingDot';
import { useTranslation } from 'react-i18next';
import { Tab, TabArea, TabPreview, TabsProvider, TabsSelector } from '~/components/TabsSelector';
import { ButtonSelect } from '~/components/ButtonSelect';
import { useRequestSpotBooking } from '~/endpoints/requestBooking/request-spot-booking';
import { LogoCard } from '~/components/Logo';
import { useCancelBookingRequest } from '~/endpoints/requestBooking/cancel-spot-booking-request';
import { RefreshTriggerContext } from '~/authentication/RefreshTriggerProvider';
import { DynamicBottomSheet } from '~/components/DynamicBottomSheet';
import {
  MyBookingRequestResponse,
  useGetMyBookingRequests,
} from '~/endpoints/requestBooking/get-my-parking-requests';
import { PremiumButton } from '~/components/FriendspotPlus';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export default function SearchSpot() {
  const { t } = useTranslation();
  const { userProfile, features } = useCurrentUser();

  const { colors } = useColorScheme();
  const getSuggestedSpots = useGetSuggestedSpots();
  const [bookSheetOpen, setBookSheetOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SpotSuggestion>();
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('suggested');

  const now = useActualTime(15_000);
  const [booking] = useHookFetch(useGetBooking, []);
  const [initialTabChanged, setInitialTabChanged] = useState(false);
  const [bookingRequests] = useHookFetch(useGetMyBookingRequests, []);
  const [suggestedSpots] = useFetch(
    () => !!userProfile.spot && getSuggestedSpots(now, addHours(now, 12)),
    [!!userProfile.spot, now]
  );

  const activeBookings = useMemo(
    () =>
      booking?.bookings
        .filter((booking) => isWithinInterval(now, { start: booking.from, end: booking.to }))
        .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()) ?? [],
    [booking, now]
  );

  const notStartedBookings = useMemo(
    () => booking?.bookings.filter((booking) => new Date(booking.from) > now) ?? [],
    [activeBookings, now]
  );

  useEffect(() => {
    if (!activeBookings.length || initialTabChanged) {
      return;
    }

    setSelectedTab('booking');
    setInitialTabChanged(true);
  }, [activeBookings]);

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
          disabled={!userProfile.spot || features.currentParkingIsLocked}
          size="lg"
          variant="primary"
          onPress={() => {
            setSelectedSuggestion(undefined);
            setBookSheetOpen(true);
          }}>
          <KnownIcon name="search" />
          <Text>{t('booking.reserveSpot')}</Text>
        </Button>
      }>
      <TabsProvider
        defaultTab={'suggested'}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}>
        <ScreenTitle title={t('booking.reserveSpot')} />

        <TabsSelector className={'mt-0'}>
          <Tab
            index={'suggested'}
            preview={<TabPreview icon={<ThemedIcon name={'lightbulb-o'} />} count={null} />}>
            <Text>{t('booking.tabs.suggestedSpots')}</Text>
          </Tab>
          <Tab
            index={'requests'}
            disabled={!bookingRequests?.requests?.length}
            preview={
              <TabPreview
                icon={<ThemedIcon name={'person-search'} component={MaterialIcons} />}
                count={bookingRequests?.requests?.length}
              />
            }>
            <Text>{t('booking.tabs.requests')}</Text>
          </Tab>
          <Tab
            index={'booking'}
            disabled={!booking?.bookings?.length}
            preview={
              <TabPreview
                icon={
                  activeBookings.length ? (
                    <BlinkingDot disabled={!booking?.bookings?.length} />
                  ) : (
                    <ThemedIcon name={'ticket'} />
                  )
                }
                count={booking?.bookings?.length}
              />
            }>
            <Text>{t('booking.tabs.bookings')}</Text>
          </Tab>
        </TabsSelector>

        {infoModalOpen && (
          <Modal open={infoModalOpen} onOpenChange={() => setInfoModalOpen(false)}>
            <ModalTitle className="justify-center text-center" text={t('booking.newSpot.title')} />
            <View className="items-center">
              <SuccessIllustration width={250} height={250} />
            </View>
          </Modal>
        )}

        {features.currentParkingIsLocked && (
          <MessageInfo variant={'warning'} info={t('user.groupLocked')} />
        )}

        <TabArea tabIndex={'booking'}>
          {!booking ? (
            <ActivityIndicator />
          ) : (
            <>
              {activeBookings.length ? (
                <View>
                  <View className="flex-row items-center gap-2">
                    <BlinkingDot className={'-top-[5]'} color={colors.destructive} />
                    <Title>
                      {activeBookings.length > 1
                        ? t('booking.occupyingSpots', { count: activeBookings.length })
                        : t('booking.occupyingSpot')}
                    </Title>
                  </View>
                  <List>
                    {activeBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} countdownOnTap />
                    ))}
                  </List>
                </View>
              ) : null}

              {notStartedBookings.length ? (
                <View>
                  <View className="flex-row items-center gap-2">
                    <Title>
                      {notStartedBookings.length > 1
                        ? t('booking.bookedSpots', { count: notStartedBookings.length })
                        : t('booking.bookedSpot')}
                    </Title>
                  </View>
                  <List>
                    {notStartedBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} countdownOnTap deletable />
                    ))}
                  </List>
                </View>
              ) : null}
            </>
          )}
        </TabArea>

        <TabArea tabIndex={'requests'}>
          <List>
            {bookingRequests?.requests.map((request) => (
              <BookingRequestCard key={request.id} request={request} />
            ))}
          </List>
        </TabArea>

        <TabArea tabIndex={'suggested'} isFallbackArea>
          {notStartedBookings.length > 0 ? (
            <MessageInfo
              info={t('booking.nextReservation', {
                time: formatDistance(now, notStartedBookings[0].from),
              })}
              action={() => {
                setSelectedTab('booking');
              }}
            />
          ) : (
            <MessageInfo info={t('booking.reserveNow')} />
          )}

          <View className="flex-col">
            {!suggestedSpots ? (
              <ActivityIndicator />
            ) : (
              suggestedSpots.suggestions.length > 0 && (
                <>
                  <Title>{t('booking.suggestedSpots')}</Title>
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
        </TabArea>

        <BookingSheet
          selectedSuggestion={selectedSuggestion}
          open={bookSheetOpen}
          onOpen={setBookSheetOpen}
          infoModalOpen={infoModalOpen}
          setInfoModalOpen={setInfoModalOpen}
        />
      </TabsProvider>
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
  const cancelBooking = useRefreshOnSuccess(useCancelBooking());
  const { t } = useTranslation();

  const canDelete = !!props.deletable && props.booking.canCancel;
  const [lockInfo, setLockInfo] = useState(false);

  return (
    <>
      <Deletable
        disabled={!props.deletable}
        canDelete={canDelete}
        className={'rounded-xl'}
        onDelete={() => cancelBooking(props.booking.parkingLot.id, props.booking.id)}>
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
            {isBefore(now, props.booking.from) && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  {props.deletable ? (
                    <DeletableStatus
                      fallback={
                        <ThemedIcon
                          name={'clock'}
                          color={colors.primary}
                          component={FontAwesome6}
                        />
                      }
                    />
                  ) : (
                    <ThemedIcon name={'clock'} color={colors.primary} component={FontAwesome6} />
                  )}
                  <CardTitle>{capitalize(formatRelative(props.booking.from, now))}</CardTitle>
                </View>
                <DeleteTrigger />
              </View>
            )}

            <User
              displayName={props.booking.owner.displayName}
              pictureUrl={props.booking.owner.pictureUrl}
            />
            <View>
              {props.booking.parkingLot.name ? (
                <Tag text={t('common.spot.number', { number: props.booking.parkingLot.name })} />
              ) : (
                <Tag
                  onPress={() => setLockInfo(!lockInfo)}
                  text={t('common.spot.numberLabelBooking')}
                  icon={'lock'}
                />
              )}
            </View>
            {isAfter(now, props.booking.from) && (
              <DateRange
                from={props.booking.from}
                to={props.booking.to}
                duration={props.booking.duration}
              />
            )}
          </Card>
        </Pressable>
      </Deletable>
      <Modal open={lockInfo} onOpenChange={() => setLockInfo(false)}>
        <ModalTitle text={t('booking.spot.locked')} icon={<ThemedIcon size={24} name={'lock'} />} />
        <View className="w-full">
          <Text>{t('booking.spot.lockedDescription')}</Text>
        </View>
      </Modal>
    </>
  );
}

function BookingRequestCard(props: { request: MyBookingRequestResponse }) {
  const { t } = useTranslation();
  const { colors } = useColorScheme();
  const cancelRequest = useRefreshOnSuccess(useCancelBookingRequest());

  return (
    <Deletable
      className={'rounded-xl'}
      canDelete={true}
      onDelete={async () => await cancelRequest(props.request.id)}>
      <Pressable>
        <Card>
          <View className={'flex-row items-center justify-between'}>
            <View className={'flex-row items-center gap-2'}>
              <BlinkingDot color={colors.primary} />
              <CardTitle>{t('booking.requestBooking.card.title')}</CardTitle>
            </View>
            <DeleteTrigger />
          </View>

          {props.request.bonus > 0 && (
            <View className={'flex-row items-center gap-2'}>
              <ThemedIcon color={colors.primary} component={FontAwesome6} name="arrow-trend-up" />

              <Text className={'font-bold text-primary'}>+{props.request.bonus}</Text>
            </View>
          )}

          <DateRange from={props.request.from} to={props.request.to} />
        </Card>
      </Pressable>
    </Deletable>
  );
}

function BookingSheet(props: {
  selectedSuggestion: SpotSuggestion | undefined;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  infoModalOpen?: boolean;
  setInfoModalOpen?: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();

  const MIN_DURATION_HOURS = 0.5;
  const MAX_DURATION_HOURS = 12;
  const STEP_HOURS = 0.25;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = useActualTime(60_000);
  const [requestBonusOption, setRequestBonusOption] = useState<number | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<AvailableSpot>();
  const [from, setFrom] = useState(addMinutes(now, INITIAL_FROM_MARGIN_MINUTES));
  const [to, setTo] = useState(addHours(from, INITIAL_DURATION_HOURS));
  const [requestSpot, setRequestSpot] = useState(false);

  const { userProfile, features } = useCurrentUser();
  const { colors } = useColorScheme();
  const [book, isBooking] = useLoading(useBookSpot(), {
    skiLoadingWhen: (_body, _parkingLotId, simulation?: boolean) => !!simulation,
    beforeMarkingComplete: () => props.onOpen(false),
  });
  const [requestBooking, isRequesting] = useLoading(useRequestSpotBooking(), {
    skiLoadingWhen: (_, simulation?: boolean) => !!simulation,
    beforeMarkingComplete: () => props.onOpen(false),
  });
  const getAvailableSpots = useGetAvailableSpots();
  const { triggerRefresh } = useContext(RefreshTriggerContext);
  const [toDebounce] = useDebounce(to, 200);
  const [fromDebounce] = useDebounce(from, 200);

  const duration = useMemo(() => intervalToDuration({ start: from, end: to }), [from, to]);

  const [availableSpots, , , { initialLoading: isSearchingSpot, resetInitialLoading }] = useFetch(
    () => getAvailableSpots(fromDebounce, toDebounce),
    [fromDebounce, toDebounce]
  );

  const spots: AvailableSpot[] =
    availableSpots?.availableSpots.filter(
      (spot) =>
        !props.selectedSuggestion || spot.parkingLotId === props.selectedSuggestion.parkingLotId
    ) ?? [];

  const [bookingSimulation, setBookingSimulation] = useFetch(
    () =>
      props.open &&
      selectedSpot &&
      book(
        {
          from: fromDebounce,
          to: toDebounce,
        },
        selectedSpot.parkingLotId,
        true
      ),
    [props.open, selectedSpot, fromDebounce, toDebounce]
  );

  const [requestSimulation, setRequestSimulation] = useFetch(
    () =>
      props.open &&
      requestSpot &&
      requestBooking(
        {
          from: fromDebounce,
          to: toDebounce,
          bonus: requestBonusOption ?? undefined,
        },
        true
      ),
    [props.open, requestBonusOption, fromDebounce, toDebounce, requestSpot]
  );

  useEffect(() => {
    if (props.open) {
      return;
    }

    setSelectedSpot(undefined);
    setBookingSimulation(undefined);
    setRequestSimulation(undefined);
    setRequestBonusOption(null);
    setRequestSpot(false);
    resetInitialLoading();
  }, [props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    const safeFrom = addMinutes(now, INITIAL_FROM_MARGIN_MINUTES);
    const safeTo = addHours(from, INITIAL_DURATION_HOURS);

    setFrom(
      props.selectedSuggestion ? max([safeFrom, fromUtc(props.selectedSuggestion.from)]) : safeFrom
    );
    setTo(
      props.selectedSuggestion
        ? fromUtc(
            min([
              props.selectedSuggestion.to,
              addHours(props.selectedSuggestion.from, INITIAL_DURATION_HOURS),
            ])
          )
        : safeTo
    );
  }, [props.open, props.selectedSuggestion]);

  useEffect(() => {
    props.selectedSuggestion && setSelectedSpot(props.selectedSuggestion);
  }, [props.selectedSuggestion]);

  useEffect(() => {
    if (spots.length === 0) {
      setSelectedSpot(undefined);
      setBookingSimulation(undefined);
      return;
    }

    setRequestSimulation(undefined);
    setRequestSpot(false);
  }, [spots]);

  function minTo(from: Date): Date {
    return addHours(from, MIN_DURATION_HOURS);
  }

  const openInfoModal = useMemo(() => {
    return () => {
      setTimeout(() => {
        props.setInfoModalOpen && props.setInfoModalOpen(true);
      }, 500);
    };
  }, [props.setInfoModalOpen]);

  function actuallyBookSpot() {
    selectedSpot &&
      book(
        {
          from,
          to,
        },
        selectedSpot.parkingLotId
      )
        .then(triggerRefresh)
        .then(() => {
          openInfoModal();
        });
  }

  function actuallyRequestBooking() {
    requestBooking({
      from,
      to,
      bonus: requestBonusOption ?? undefined,
    }).then(triggerRefresh);
  }

  const justAfterNow = addMinutes(now, 5);

  function bonusOption(bonus: number) {
    return {
      key: bonus,
      label: (selected: boolean) => (
        <>
          <Text>+{bonus}</Text>
          <LogoCard className={cn('h-4 w-2.5 rounded', selected && 'bg-foreground')} primary />
        </>
      ),
    };
  }

  return (
    <DynamicBottomSheet open={props.open} onOpenChange={props.onOpen}>
      <View className="grow flex-col gap-6">
        <SheetTitle icon={<KnownIcon name="search" size={22} />}>
          {capitalize(formatRelative(from, now))}
        </SheetTitle>

        {isSearchingSpot ? (
          <CardContainer>
            {Array.from({ length: Math.max(1, spots.length) }).map((_, i) => (
              <AvailableSpotSkeleton key={i} />
            ))}
          </CardContainer>
        ) : requestSpot ? (
          <View className={'gap-6'}>
            <SheetHeading icon={<ThemedIcon component={FontAwesome6} name="arrow-trend-up" />}>
              {t('booking.requestBooking.bonus')}
            </SheetHeading>
            <ButtonSelect
              selectedOption={requestBonusOption}
              setSelectedOption={setRequestBonusOption}
              options={[bonusOption(5), bonusOption(10), bonusOption(50)]}
            />
          </View>
        ) : spots.length ? (
          <CardContainer className={'max-h-60'}>
            {spots
              .sort((a, b) => a.owner.rating - b.owner.rating)
              .reverse()
              .map((spot, i) => (
                <AvailableSpotCard
                  key={i}
                  spot={spot}
                  selectedSpot={selectedSpot}
                  onSelect={() => setSelectedSpot(spot)}
                />
              ))}
          </CardContainer>
        ) : (
          <Card>
            <Text>{t('booking.requestBooking.noSpotsAvailable')}</Text>

            <Button variant={'plain'} onPress={() => setRequestSpot(true)}>
              <ThemedIcon name={'arrow-right'} component={FontAwesome6} color={colors.primary} />
              <Text className={'text-primary'}>{t('booking.askToSendRequest')}</Text>
            </Button>
          </Card>
        )}
      </View>
      <View className="flex-col items-center justify-between gap-2">
        <View className="w-full flex-row items-center justify-between">
          <Text className="w-24">{t('booking.reserveFrom')}</Text>
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
          <Text className="w-24">{t('booking.reserveUntil')}</Text>
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
      <View className="flex-col justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <SheetHeading icon={<ThemedIcon component={FontAwesome6} name="clock" />}>
            {formatDuration(duration, {
              format: ['years', 'months', 'weeks', 'days', 'hours', 'minutes'],
            })}
          </SheetHeading>
        </View>

        {Platform.OS === 'ios' && (
          <Slider
            step={STEP_HOURS / MAX_DURATION_HOURS}
            value={differenceInHours(to, from) / MAX_DURATION_HOURS}
            onValueChange={(value) =>
              setTo(addHours(from, Math.max(MIN_DURATION_HOURS, value * MAX_DURATION_HOURS)))
            }
          />
        )}
      </View>

      {requestSpot ? (
        <PremiumButton
          variant="primary"
          size="lg"
          disabled={
            !requestSimulation ||
            requestSimulation?.usedCredits > userProfile.wallet.credits ||
            features.currentParkingIsLocked
          }
          premiumContent={<Text>{t('booking.requestBooking.unlockSendRequest')}</Text>}
          onPress={actuallyRequestBooking}>
          {isRequesting && <ActivityIndicator color={colors.foreground} />}
          <Text>
            {requestSimulation
              ? t('booking.requestBooking.requestForCredits', {
                  count: requestSimulation.usedCredits,
                })
              : t('booking.requestBooking.request')}
          </Text>
        </PremiumButton>
      ) : (
        <PremiumButton
          hasNoAccess={
            differenceInMilliseconds(to, now) >= durationToMs(features.active.maxBookInAdvanceTime)
          }
          premiumContent={<Text>{t('booking.unlockReserveMoreInAdance')}</Text>}
          variant="primary"
          size="lg"
          disabled={
            !bookingSimulation ||
            bookingSimulation?.usedCredits > userProfile.wallet.credits ||
            features.currentParkingIsLocked
          }
          onPress={actuallyBookSpot}>
          {isBooking && <ActivityIndicator color={colors.foreground} />}
          <Text>
            {bookingSimulation
              ? t('booking.reserveForCredits', { count: bookingSimulation.usedCredits })
              : t('booking.reserve')}
          </Text>
        </PremiumButton>
      )}
    </DynamicBottomSheet>
  );
}

function AvailableSpotSkeleton() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 1200 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Card>
        <View className={'h-8'} />
      </Card>
    </Animated.View>
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
      <Card highlight={selected} className={'flex-row items-center justify-between'}>
        <User displayName={props.spot.owner.displayName} pictureUrl={props.spot.owner.pictureUrl} />
        <Rating
          rating={props.spot.owner.rating}
          stars={3}
          className="grow-0"
          color={colors.primary}
        />
      </Card>
    </Pressable>
  );
}

function SuggestedSpotCard(props: { suggestion: SpotSuggestion }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation();
  const now = useActualTime(30_000);

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <ThemedIcon component={FontAwesome6} name="calendar" color={colors.primary} />
          <CardTitle>
            {differenceInSeconds(props.suggestion.from, now) > 30
              ? capitalize(formatRelative(props.suggestion.from, now))
              : t('booking.now')}
          </CardTitle>
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
