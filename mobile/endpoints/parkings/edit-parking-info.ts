import { useApiRequest } from '~/endpoints/use-api-request';
import { useCallback } from 'react';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';

type EditParkingInfoRequest = {
  readonly name: string;
  readonly address: string;
};

export function useEditParkingInfo() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (parkingId: string, body: EditParkingInfoRequest) =>
      apiRequest<ParkingResponse, EditParkingInfoRequest>(`/parking/${parkingId}`, 'PUT', body),
    [apiRequest]
  );
}
