import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type BookSpotRequest = {
  readonly parkingLotId: string;
  readonly from: Date;
  readonly to: Date;
};

export type BookSpotResponse = {
  readonly bookingId: string | null;
  readonly usedCredits: number;
};

export function useBookSpot() {
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
