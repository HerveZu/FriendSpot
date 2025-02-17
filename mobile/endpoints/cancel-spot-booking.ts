import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type CancelSpotBooking = {
  readonly parkingLotId: string;
  readonly bookingId: string;
};

export function useCancelBooking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: CancelSpotBooking) =>
      apiRequest<void, CancelSpotBooking>('/spots/bookings/cancel', 'POST', body),
    [apiRequest]
  );
}
