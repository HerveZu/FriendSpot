import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type RequestSpotBookingRequest = {
  readonly from: Date;
  readonly to: Date;
  readonly bonus?: number;
};

export type RequestSpotBookingResponse = {
  readonly requestId: null | string;
  readonly usedCredits: number;
};

export function useRequestSpotBooking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: RequestSpotBookingRequest, simulation: boolean = false) => {
      return apiRequest<RequestSpotBookingResponse, RequestSpotBookingRequest>(
        `/parking/requests?simulation=${simulation}`,
        'POST',
        body
      );
    },
    [apiRequest]
  );
}
