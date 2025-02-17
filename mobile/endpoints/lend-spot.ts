import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type LendSpotRequest = {
  readonly from: Date;
  readonly to: Date;
};

export type LendSpotResponse = {
  readonly earnedCredits: number;
  readonly overlaps: boolean;
};

export function useLendSpot() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: LendSpotRequest, simulation: boolean = false) =>
      apiRequest<LendSpotResponse, LendSpotRequest>(
        `/spots/availabilities?simulation=${simulation}`,
        'POST',
        body
      ),
    [apiRequest]
  );
}
