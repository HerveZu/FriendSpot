import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type BookSpotRequest = {
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
    (body: BookSpotRequest, parkingLotId: string, simulation: boolean = false) =>
      apiRequest<BookSpotResponse, BookSpotRequest>(
        `/spots/${parkingLotId}/booking?simulation=${simulation}`,
        'POST',
        body
      ),
    [apiRequest]
  );
}
