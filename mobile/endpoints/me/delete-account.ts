import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export function useDeleteAccount() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest('/@me', 'DELETE'), [apiRequest]);
}
