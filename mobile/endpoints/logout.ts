import {useCallback} from 'react';

import {useApiRequest} from './use-api-request';

type ExpoTokenRequest = {
  readonly deviceId: string;
};

export function useLogout() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: ExpoTokenRequest) => apiRequest('/@me/logout', 'POST', body),
    [apiRequest]
  );
}
