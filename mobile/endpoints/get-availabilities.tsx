import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type AvailabilitiesResponse = {
  readonly totalDuration: string;
  readonly availabilities: Availability[];
};

type Availability = {
  readonly from: string;
  readonly to: string;
  readonly duration: string;
};

export function useGetAvailabilities() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    () => apiRequest<AvailabilitiesResponse>(`/spots/availabilities`, 'GET'),
    [apiRequest]
  );
}
