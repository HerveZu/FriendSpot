import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';
import { ParkingResponse } from '~/endpoints/parkings/parking-response';

export type UserProfile = {
  readonly id: string;
  readonly displayName: string;
  readonly pictureUrl: string | null;
  readonly rating: number;
  readonly bookingToRate?: BookingToRate;
  readonly spot: UserSpot | null;
  readonly wallet: {
    readonly credits: number;
    readonly pendingCredits: number;
  };
};

export type UserSpot = {
  readonly id: string;
  readonly name: string;
  readonly parking: ParkingResponse;
};

export type BookingToRate = {
  id: string;
  parkingLotId: string;
};

export function useGetProfile() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<UserProfile>('/@me', 'GET'), [apiRequest]);
}
