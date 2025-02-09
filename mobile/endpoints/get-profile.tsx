import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type UserProfile = {
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
  readonly available: boolean;
  readonly name: string;
  readonly parking: {
    readonly id: string;
    readonly name: string;
    readonly address: string;
  };
  readonly currentlyUsedBy?: {
    readonly id: string;
    readonly displayName: string;
    readonly pictureUrl: string;
  };
};

export type BookingToRate = {
  id: string;
  parkingLotId: string;
};

export function useGetProfile() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<UserProfile>('/@me', 'GET'), [apiRequest]);
}
