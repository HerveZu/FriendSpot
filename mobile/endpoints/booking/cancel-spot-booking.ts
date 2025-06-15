import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export function useCancelBooking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (parkingLotId: string, bookingId: string) =>
      apiRequest(`/spots/${parkingLotId}/booking/${bookingId}/cancel`, 'DELETE'),
    [apiRequest]
  );
}
