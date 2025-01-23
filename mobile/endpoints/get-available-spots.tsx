import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type AvailableSpotsResponse = {
  readonly availableSpots: AvailableSpot[];
};

export type AvailableSpot = {
  readonly parkingLotId: string;
  readonly from: Date;
  readonly until: Date;
};

export function useGetAvailableSpots() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (from: Date, to: Date) =>
      apiRequest<AvailableSpotsResponse>(
        `/spots?from=${from.toISOString()}&to=${to.toISOString()}`,
        'GET'
      ),
    [apiRequest]
  );
}
