import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type BookingRequestsResponse = {
  readonly requests: MyBookingRequestResponse[];
};

export type MyBookingRequestResponse = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly bonus: number;
};

export function useGetMyBookingRequests() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    () => apiRequest<BookingRequestsResponse>(`/parking/requests/@me`, 'GET'),
    [apiRequest]
  );
}
