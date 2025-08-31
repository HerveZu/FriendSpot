import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import TreeIllustration from 'assets/tree.svg';
import { BlinkingDot } from '~/components/BlinkingDot';
import {
  addHours,
  addMinutes,
  format,
  formatDuration,
  formatRelative,
  intervalToDuration,
  isWithinInterval,
  max,
  min,
} from 'date-fns';
import { Redirect } from 'expo-router';
import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useDebounce } from 'use-debounce';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '~/authentication/UserProvider';
import { MessageInfo } from '~/components/MessageInfo';
import { Card } from '~/components/Card';
import { DateRange } from '~/components/DateRange';
import { Deletable, DeleteTrigger } from '~/components/Deletable';
import { List } from '~/components/List';
import { ScreenTitle, ScreenWithHeader } from '~/components/Screen';
import { ThemedIcon } from '~/components/ThemedIcon';
import { SheetTitle, Title } from '~/components/Title';
import { User, UserAvatar, Users } from '~/components/UserAvatar';
import { Button } from '~/components/nativewindui/Button';
import { DatePicker } from '~/components/nativewindui/DatePicker';
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
import { useFetch, useHookFetch, useLoading, useRefreshOnSuccess } from '~/lib/useFetch';
import { capitalize } from '~/lib/utils';
import { useCancelAvailability } from '~/endpoints/booking/cancel-spot-availability';
import { cn } from '~/lib/cn';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import { Tab, TabArea, TabPreview, TabsProvider, TabsSelector } from '~/components/TabsSelector';
import {
  BookingRequestResponse,
  useGetAllBookingRequests,
} from '~/endpoints/requestBooking/get-all-parkings-requests';
import { useAcceptBookingRequest } from '~/endpoints/requestBooking/accept-spot-booking-request';
import { Modal, ModalProps, ModalTitle } from '~/components/Modal';
import { Rating } from '~/components/Rating';
import { RefreshTriggerContext } from '~/authentication/RefreshTriggerProvider';
import { DynamicBottomSheet } from '~/components/DynamicBottomSheet';

export default function MySpot() {
  const { t } = useTranslation();
  const { userProfile, features } = useCurrentUser();

  const getAvailabilities = useGetAvailabilities();
  const [lendSheetOpen, setLendSheetOpen] = useState(false);
  const now = useActualTime(30_000);

  const [availabilities] = useFetch(() => getAvailabilities(now), [now]);
  const [selectedTab, setSelectedTab] = useState<string>('my-spot');

  const [bookingRequests] = useHookFetch(useGetAllBookingRequests, []);

  return !userProfile.spot ? (
    <Redirect href="/user-profile" />
  ) : (
    <ScreenWithHeader
      stickyBottom={
        <Button
          disabled={!userProfile.spot || features.currentParkingIsLocked}
          size="lg"
          variant="primary"
          onPress={() => setLendSheetOpen(true)}>
          <ThemedIcon component={FontAwesome6} name="user-clock" />
          <Text>{t('lending.lendMySpot')}</Text>
        </Button>
      }>
      <ScreenTitle title={t('mySpot.title')} />
      <TabsProvider
        defaultTab={'my-spot'}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}>
        <TabsSelector className={'mt-0'}>
          <Tab
            index={'my-spot'}
            preview={<TabPreview icon={<ThemedIcon name={'lightbulb-o'} />} count={null} />}>
            <Text>{t('lending.tabs.myLendings')}</Text>
          </Tab>
          <Tab
            index={'request'}
            disabled={!bookingRequests?.requests.length}
            preview={
              <TabPreview
                icon={<ThemedIcon name={'person-search'} component={MaterialIcons} />}
                count={bookingRequests?.requests.length}
              />
            }>
            <Text>{t('lending.tabs.neighboursRequests')}</Text>
          </Tab>
        </TabsSelector>

        {features.currentParkingIsLocked && (
          <MessageInfo variant={'warning'} info={t('user.groupLocked')} />
        )}

        <TabArea tabIndex={'my-spot'}>
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
        </TabArea>
        <TabArea tabIndex={'request'}>
          {!bookingRequests ? (
            <ActivityIndicator />
          ) : (
            bookingRequests.requests.length > 0 && (
              <List>
                {bookingRequests?.requests.map((request) => (
                  <OthersBookingRequestCard key={request.id} request={request} />
                ))}
              </List>
            )
          )}
        </TabArea>
      </TabsProvider>
      <LendSpotSheet open={lendSheetOpen} onOpen={setLendSheetOpen} />
    </ScreenWithHeader>
  );
}

function AcceptRequestModal({
  request,
  ...props
}: ModalProps & { request: BookingRequestResponse }) {
  const [acceptRequest, isAccepting] = useLoading(useRefreshOnSuccess(useAcceptBookingRequest()), {
    beforeMarkingComplete: () => props.onOpenChange(false),
  });
  const { t } = useTranslation();
  const { colors } = useColorScheme();
  const { features } = useCurrentUser();

  return (
    <Modal {...props}>
      <ModalTitle text="Accepter la demande" />
      <View className="mt-2 w-full flex-col justify-between gap-6">
        <Text>
          {t('lending.acceptRequest.description', {
            requester: request.requester.displayName,
            from: format(request.from, 'PPp'),
            to: format(request.to, 'PPp'),
          })}
        </Text>
        <Button
          disabled={isAccepting || features.currentParkingIsLocked}
          onPress={() => acceptRequest(request.id)}>
          {isAccepting && <ActivityIndicator color={colors.foreground} />}
          <Text>{t('lending.acceptRequest.accept', { count: request.credits })}</Text>
        </Button>
      </View>
    </Modal>
  );
}

function OthersBookingRequestCard(props: { request: BookingRequestResponse }) {
  const { t } = useTranslation();
  const { colors } = useColorScheme();
  const [openModal, setModalOpen] = useState<boolean>(false);

  return (
    <>
      <Pressable onPress={() => setModalOpen(true)}>
        <Card>
          <View className={'flex-row items-center justify-between'}>
            <View className={'flex-row items-center gap-2'}>
              <Text variant={'heading'}>{t('booking.requestBooking.card.title')}</Text>
            </View>
            <UserAvatar {...props.request.requester} />
          </View>

          <View className={'flex-row justify-between'}>
            <Rating color={colors.primary} rating={props.request.requester.rating} stars={3} />
            {props.request.bonus > 0 && (
              <View className={'flex-row items-center gap-2'}>
                <ThemedIcon color={colors.primary} component={FontAwesome6} name="arrow-trend-up" />
                <Text className={'font-bold text-primary'}>+{props.request.bonus}</Text>
              </View>
            )}
          </View>

          <DateRange from={props.request.from} to={props.request.to} />
        </Card>
      </Pressable>
      <AcceptRequestModal open={openModal} onOpenChange={setModalOpen} request={props.request} />
    </>
  );
}

function MySpotAvailabilityCard(props: { spotId: string; availability: SpotAvailability }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation();
  const now = useActualTime(30_000);
  const cancelAvailability = useRefreshOnSuccess(useCancelAvailability());

  const uniqueBookingUsers = [
    ...props.availability.bookings
      .reduce((users, booking) => {
        users.set(booking.bookedBy.id, booking.bookedBy);
        return users;
      }, new Map<string, AvailabilityBookingUser>())
      .values(),
  ];

  return (
    <Deletable
      className={'rounded-xl'}
      canDelete={props.availability.canCancel}
      onDelete={() => cancelAvailability(props.availability.id)}>
      <Card>
        <View className="flex-row justify-between gap-4">
          <View className={'flex-row items-center gap-2'}>
            <ThemedIcon name={'user-clock'} color={colors.primary} component={FontAwesome6} />
            <Text variant="heading" className="font-bold">
              {capitalize(formatRelative(props.availability.from, now))}
            </Text>
          </View>
          {uniqueBookingUsers.length ? <Users users={uniqueBookingUsers} /> : <DeleteTrigger />}
        </View>
        {props.availability.bookings.length === 0 && (
          <View className="mt-2 flex-row items-center gap-2">
            <BlinkingDot color={colors.primary} />
            <Text className="text-xs">{t('lending.waitingForBooking')}</Text>
          </View>
        )}
        <DateRange
          from={props.availability.from}
          to={props.availability.to}
          duration={props.availability.duration}
        />
        {props.availability.bookings.length > 0 && (
          <ScrollView>
            <View className="flex-col gap-1">
              {props.availability.bookings.map((booking) => (
                <AvailabilityBookingCard key={booking.id} spotId={props.spotId} booking={booking} />
              ))}
            </View>
          </ScrollView>
        )}
      </Card>
    </Deletable>
  );
}

function AvailabilityBookingCard(props: { spotId: string; booking: AvailabilityBooking }) {
  const now = useActualTime(30_000);
  const { t } = useTranslation();
  const cancelBooking = useRefreshOnSuccess(useCancelBooking());

  const isCurrently = useMemo(() => {
    return isWithinInterval(now, {
      start: new Date(props.booking.from),
      end: new Date(props.booking.to),
    });
  }, [props.booking.from, props.booking.to, now]);

  return (
    <Deletable
      className="rounded-xl"
      canDelete={props.booking.canCancel}
      onDelete={() => cancelBooking(props.spotId, props.booking.id)}>
      <Card className="bg-background">
        <View className={cn('flex-row justify-between', !isCurrently && 'opacity-60')}>
          <View className={'flex-1 flex-col gap-4'}>
            <User
              displayName={props.booking.bookedBy.displayName}
              pictureUrl={props.booking.bookedBy.pictureUrl}
            />
            {isCurrently && (
              <View>
                <View className="flex-row items-center gap-2">
                  <BlinkingDot />
                  <Text className="text-xs">{t('lending.currentlyUsingSpot')}</Text>
                </View>
              </View>
            )}
            <DateRange from={props.booking.from} to={props.booking.to} extend />
          </View>
        </View>
      </Card>
    </Deletable>
  );
}

function LendSpotSheet(props: { open: boolean; onOpen: Dispatch<SetStateAction<boolean>> }) {
  const { t } = useTranslation();
  const [lend, actionPending] = useLoading(useLendSpot(), {
    skiLoadingWhen: (_, simulation?: boolean) => !!simulation,
    beforeMarkingComplete: () => props.onOpen(false),
  });

  const MIN_DURATION_HOURS = 0.5;
  const INITIAL_FROM_MARGIN_MINUTES = 15;
  const INITIAL_DURATION_HOURS = 2;

  const now = useActualTime(60_000);
  const { triggerRefresh } = useContext(RefreshTriggerContext);
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

  function minTo(from: Date): Date {
    return addHours(from, MIN_DURATION_HOURS);
  }

  function lendSpot(from: Date, to: Date) {
    lend({
      from,
      to,
    }).then(triggerRefresh);
  }

  const justAfterNow = addMinutes(now, 5);

  return (
    <DynamicBottomSheet open={props.open} onOpenChange={props.onOpen}>
      <List>
        <SheetTitle icon={<ThemedIcon name="user-clock" component={FontAwesome6} size={22} />}>
          {capitalize(formatRelative(from, now))}
        </SheetTitle>
        <View className="flex-row items-center gap-4">
          <ThemedIcon component={FontAwesome6} name="clock" />
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
          size="lg"
          disabled={simulation && simulation.earnedCredits <= 0}
          onPress={() => lendSpot(from, to)}>
          {actionPending && <ActivityIndicator color={colors.foreground} />}
          <Text>
            {simulation && simulation.earnedCredits > 0
              ? t('lending.lendAndEarnCredits', {
                  count: Math.round(simulation?.earnedCredits),
                })
              : t('lending.lendMySpot')}
          </Text>
        </Button>
      </View>
    </DynamicBottomSheet>
  );
}
