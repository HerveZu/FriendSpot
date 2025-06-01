import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type RateBookingRequest = {
  readonly userRating: UserRating;
};

export type UserRating = 'Good' | 'Bad' | 'Neutral';

export function useRateBooking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: RateBookingRequest, parkingLotId: string, bookingId: string) =>
      apiRequest<RateBookingRequest>(
        `/spots/${parkingLotId}/booking/${bookingId}/rate`,
        'POST',
        body
      ),
    [apiRequest]
  );
}
