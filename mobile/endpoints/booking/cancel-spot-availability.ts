import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export function useCancelAvailability() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (availabilityId: string) =>
      apiRequest(`/spots/availabilities/${availabilityId}/cancel`, 'DELETE'),
    [apiRequest]
  );
}
