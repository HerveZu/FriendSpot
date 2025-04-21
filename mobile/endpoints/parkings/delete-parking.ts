import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';

export function useDeleteParking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (parkingId: string) => apiRequest(`/parking/${parkingId}`, 'DELETE'),
    [apiRequest]
  );
}
