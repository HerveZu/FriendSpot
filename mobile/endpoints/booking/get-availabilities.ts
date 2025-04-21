import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type AvailabilitiesResponse = {
  readonly totalDuration: string;
  readonly availabilities: SpotAvailability[];
};

export type SpotAvailability = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly bookings: AvailabilityBooking[];
  readonly canCancel: boolean;
};

export type AvailabilityBooking = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly bookedBy: AvailabilityBookingUser;
  readonly canCancel: boolean;
};

export type AvailabilityBookingUser = {
  readonly id: string;
  readonly displayName: string;
  readonly pictureUrl: string | null;
};

export function useGetAvailabilities() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (from: Date, to?: Date) =>
      apiRequest<AvailabilitiesResponse>(
        `/spots/availabilities?from=${from.toISOString()}${to ? to?.toISOString() : ''}`,
        'GET'
      ),
    [apiRequest]
  );
}
