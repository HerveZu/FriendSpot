import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type AvailableSpotsResponse = {
  readonly availableSpots: AvailableSpot[];
};

export type AvailableSpot = {
  readonly parkingLotId: string;
  readonly owner: {
    readonly displayName: string;
    readonly pictureUrl: string | undefined;
    readonly rating: number;
  };
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
