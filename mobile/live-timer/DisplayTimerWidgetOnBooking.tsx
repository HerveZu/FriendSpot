import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useFetch } from '~/lib/useFetch';
import { useGetBooking } from '~/endpoints/booking/get-booking';
import * as LiveActivity from 'expo-live-activity';
import { useActualTime } from '~/lib/useActualTime';
import { isWithinInterval, milliseconds } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { deepEqual } from '@firebase/util';

export function DisplayTimerWidgetOnBooking(props: PropsWithChildren) {
  const [booking] = useFetch(useGetBooking(), []);
  const [liveActivityIdMap, setLiveActivityIdMap] = useState<{
    [bookingId: string]: { activityId: string; state: LiveActivity.LiveActivityState };
  }>({});
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

  useEffect(() => {
    endedActivityIds.forEach(({ activityId }) =>
      LiveActivity?.stopActivity(activityId, {
        imageName: 'icon',
        dynamicIslandImageName: 'icon',
        title: t('widget.liveTimer.ended'),
      })
    );
  }, [endedActivityIds]);

  useEffect(() => {
    liveBookings.forEach((booking) => {
      const state: LiveActivity.LiveActivityState = {
        title: t('widget.liveTimer.title', { spotName: booking.parkingLot?.name }),
        imageName: 'icon',
        dynamicIslandImageName: 'icon',
        date: new Date(booking.to).getTime(),
      };

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
      createdActivityId &&
        setLiveActivityIdMap((map) => ({
          ...map,
          [booking.id]: { activityId: createdActivityId, state },
        }));
    });
  }, [liveBookings, liveActivityIdMap, widgetConfig]);

  return props.children;
}
