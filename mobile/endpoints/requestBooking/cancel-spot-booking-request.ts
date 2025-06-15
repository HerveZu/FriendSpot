import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export function useCancelBookingRequest() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (requestId: string) => {
      return apiRequest(`/parking/requests/${requestId}/cancel`, 'DELETE');
    },
    [apiRequest]
  );
}
