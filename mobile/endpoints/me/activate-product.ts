import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type ActivateProductRequest = {
  readonly transactionId: string;
  readonly provider: 'appstore' | 'playstore';
};

export function useActivateProduct() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: ActivateProductRequest) => apiRequest('/@me/products/activate', 'POST', body),
    [apiRequest]
  );
}
