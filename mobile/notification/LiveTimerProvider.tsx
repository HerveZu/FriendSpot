import { createContext, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { useFetch } from '~/lib/useFetch';
import { BookingResponse, useGetBooking } from '~/endpoints/booking/get-booking';
import * as LiveActivity from 'expo-live-activity';
import { useActualTime } from '~/lib/useActualTime';
import { format, isWithinInterval, milliseconds } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { deepEqual } from '@firebase/util';
import { usePersistentState } from '~/lib/usePersistentState';
import { Platform } from 'react-native';

export const LiveTimerContext = createContext<{
  registerLiveActivityTimer: (booking: BookingResponse) => void;
}>(null!);

export function LiveTimerProvider(props: PropsWithChildren) {
  const [booking] = useFetch(useGetBooking(), []);
  const [liveActivityIdMap, setLiveActivityIdMap] = usePersistentState<{
    [bookingId: string]: { activityId: string; state: LiveActivity.LiveActivityState };
  }>('DisplayTimerWidgetActivityIdsMap', {});
  const now = useActualTime(milliseconds({ seconds: 10 }));
  const { t } = useTranslation();

  const widgetConfig: LiveActivity.LiveActivityConfig = useMemo(
    () => ({
      timerType: 'digital',
    }),
    []
  );

  const liveBookings = useMemo(
    () =>
      booking?.bookings?.filter((booking) =>
        isWithinInterval(now, { start: booking.from, end: booking.to })
      ) ?? [],
    [now, booking]
  );
  const endedActivityIds = useMemo(
    () =>
      Object.entries(liveActivityIdMap)
        .filter(([bookingId]) => !liveBookings.find((booking) => booking.id === bookingId))
        .map(([, activityId]) => activityId),
    [liveActivityIdMap, liveBookings]
  );

  const stateForBooking = useCallback(
    (booking: BookingResponse) =>
      ({
        title: t('widget.liveTimer.title', {
          spotName: booking.parkingLot?.name,
          owner: booking.owner.displayName,
        }),
        subtitle: t('widget.liveTimer.description', {
          endDate: format(new Date(booking.to), 'd MMM, p'),
        }),
        imageName: 'icon',
        dynamicIslandImageName: 'icon',
        date: new Date(booking.to).getTime(),
      }) as LiveActivity.LiveActivityState,
    [t]
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    endedActivityIds.forEach(({ activityId }) =>
      LiveActivity?.stopActivity(activityId, {
        imageName: 'icon',
        dynamicIslandImageName: 'icon',
        title: t('widget.liveTimer.ended'),
      })
    );
  }, [endedActivityIds]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    liveBookings.forEach((booking) => {
      const state = stateForBooking(booking);
      const existingActivity = liveActivityIdMap[booking.id];
      if (existingActivity) {
        if (deepEqual(existingActivity.state, state)) {
          return;
        }
        console.log('Updating activity for booking ', {
          bookingId: booking.id,
          existingActivity: existingActivity,
          newState: state,
          widgetConfig: widgetConfig,
        });

        LiveActivity?.updateActivity(existingActivity.activityId, state);
        setLiveActivityIdMap((map) => ({
          ...map,
          [booking.id]: { activityId: existingActivity.activityId, state },
        }));

        return;
      }

      console.log('Registering activity for booking ', {
        bookingId: booking.id,
        state: state,
        widgetConfig: widgetConfig,
      });
      const createdActivityId = LiveActivity?.startActivity(state, widgetConfig);

      if (!createdActivityId) {
        console.log('Failed to register activity for booking ', {
          bookingId: booking.id,
          state,
        });
        return;
      }

      setLiveActivityIdMap((map) => ({
        ...map,
        [booking.id]: { activityId: createdActivityId, state },
      }));
    });
  }, [liveBookings, liveActivityIdMap, widgetConfig, stateForBooking]);

  const registerLiveActivityTimer = useCallback(
    (booking: BookingResponse) => {
      if (Platform.OS !== 'ios') {
        return;
      }

      const state = stateForBooking(booking);
      console.log('Manual live activity registration activity for booking ', {
        bookingId: booking.id,
        state: state,
        widgetConfig: widgetConfig,
      });
      const possibleActivityId = liveActivityIdMap[booking.id]?.activityId;
      let activityId = LiveActivity?.updateActivity(possibleActivityId, state);

      if (!activityId) {
        activityId = LiveActivity?.startActivity(state, widgetConfig);
      }

      activityId &&
        setLiveActivityIdMap((map) => ({ ...map, [booking.id]: { activityId, state } }));
    },
    [liveActivityIdMap, stateForBooking, widgetConfig, setLiveActivityIdMap]
  );

  return (
    <LiveTimerContext.Provider value={{ registerLiveActivityTimer }}>
      {props.children}
    </LiveTimerContext.Provider>
  );
}
