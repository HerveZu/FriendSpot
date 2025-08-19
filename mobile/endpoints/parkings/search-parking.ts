import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';

export function useSearchParking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    async (search: string) => {
      const allParking = await apiRequest<ParkingResponse[]>(`/parking?search=${search}`, 'GET');
      return allParking.map((parking) => ({
        ...parking,
        maxSpots: 10,
        isFull: parking.spotsCount >= 10,
      }));
    },
    [apiRequest]
  );
}
