import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';

type DefineSpotRequest = {
  parkingId: string;
  lotName: string;
};

export function useDefineSpot() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: DefineSpotRequest) => apiRequest<void, DefineSpotRequest>('/@me/spot', 'PUT', body),
    [apiRequest]
  );
}
