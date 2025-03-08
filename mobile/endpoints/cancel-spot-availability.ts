import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type CancelSpotAvailability = {
  readonly availabilityId: string;
};

export function useCancelAvailability() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: CancelSpotAvailability) =>
      apiRequest<void, CancelSpotAvailability>('/spots/availabilities/cancel', 'POST', body),
    [apiRequest]
  );
}
