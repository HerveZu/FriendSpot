import { useCallback } from 'react';

import { useApiRequest } from './use-api-request';

export function useDeleteAccount() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest('/@me', 'DELETE'), [apiRequest]);
}
