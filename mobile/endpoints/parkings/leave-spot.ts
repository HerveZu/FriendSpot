import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';

export function useLeaveSpot() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest('/@me/spot', 'DELETE'), [apiRequest]);
}
