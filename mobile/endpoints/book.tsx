import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type BookSpotRequest = {
  readonly parkingLotId: string;
  readonly from: Date;
  readonly to: Date;
};

export type BookSpotResponse = {
  readonly bookingId: null;
  readonly usedCredits: number;
};

export function useBook() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: BookSpotRequest, simulation: boolean = false) =>
      apiRequest<BookSpotResponse, BookSpotRequest>(
        `/spots/booking?simulation=${simulation}`,
        'POST',
        body
      ),
    [apiRequest]
  );
}
