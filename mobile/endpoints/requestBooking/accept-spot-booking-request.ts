import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export function useAcceptBookingRequest() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (requestId: string) => {
      return apiRequest(`/parking/requests/${requestId}/accept`, 'POST', {});
    },
    [apiRequest]
  );
}
