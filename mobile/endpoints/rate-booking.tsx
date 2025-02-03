import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type RateBookingRequest = {
  readonly parkingLotId: string;
  readonly bookingId: string;
  readonly userRating: UserRating;
};

export type UserRating = 'Good' | 'Bad' | 'Neutral';

export function useRateBooking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: RateBookingRequest) =>
      apiRequest<RateBookingRequest>('/spots/booking/rate', 'POST', body),
    [apiRequest]
  );
}
