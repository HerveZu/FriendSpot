import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type BookingsResponse = {
  readonly bookings: BookingResponse[];
};

export type BookingResponse = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly owner: BookingOwner;
  readonly canCancel: boolean;
  readonly parkingLot: {
    readonly id: string;
    readonly name?: string;
  };
};

type BookingOwner = {
  readonly userId: string;
  readonly displayName: string;
  readonly pictureUrl: string;
};

export function useGetBooking() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<BookingsResponse>(`/spots/booking`, 'GET'), [apiRequest]);
}
