import { useCallback } from 'react';

import { useApiRequest } from './use-api-request';

type ExpoTokenRequest = {
  readonly expoToken: string | null;
};

export function useLogout() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: ExpoTokenRequest) => apiRequest('/@me/logout', 'POST', body),
    [apiRequest]
  );
}
