import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';

export type ParkingResponse = {
  id: string;
  address: string;
  name: string;
  spotsCount: number;
};

export function useSearchParking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (search: string) => apiRequest<ParkingResponse[]>(`/parking?search=${search}`, 'GET'),
    [apiRequest]
  );
}
