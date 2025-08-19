import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';

export function useSearchParking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (search: string) => apiRequest<ParkingResponse[]>(`/parking?search=${search}`, 'GET'),
    [apiRequest]
  );
}
