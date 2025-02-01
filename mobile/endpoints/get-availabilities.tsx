import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type AvailabilitiesResponse = {
  readonly totalDuration: string;
  readonly availabilities: SpotAvailability[];
};

export type SpotAvailability = {
  readonly from: string;
  readonly to: string;
  readonly duration: string;
};

export function useGetAvailabilities() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (from: Date, to?: Date) =>
      apiRequest<AvailabilitiesResponse>(
        `/spots/availabilities?from=${from.toISOString()}${to ? to?.toISOString() : ''}`,
        'GET'
      ),
    [apiRequest]
  );
}
