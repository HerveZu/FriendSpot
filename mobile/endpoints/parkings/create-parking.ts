import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';

type CreateParkingRequest = {
  readonly name: string;
  readonly address: string;
  readonly code: string;
};

export function useCreateParking() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: CreateParkingRequest) =>
      apiRequest<ParkingResponse, CreateParkingRequest>('/parking', 'POST', body),
    [apiRequest]
  );
}
