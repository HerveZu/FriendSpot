import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type BookingRequestsResponse = {
  readonly requests: BookingRequestResponse[];
};

export type BookingRequestResponse = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly bonus: number;
  readonly credits: number;
  readonly requester: Requester;
};

export type Requester = {
  displayName: string;
  pictureUrl?: string;
  rating: number;
};

export function useGetAllBookingRequests() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    () => apiRequest<BookingRequestsResponse>(`/parking/requests`, 'GET'),
    [apiRequest]
  );
}
