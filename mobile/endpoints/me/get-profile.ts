import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

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
  readonly currentlyAvailable: boolean;
  readonly name: string;
  readonly nextAvailability: null | Date;
  readonly nextUse: null | Date;
  readonly lastUse: null | Date;
  readonly parking: {
    readonly id: string;
    readonly name: string;
    readonly address: string;
    readonly code: string;
  };
  readonly currentlyUsedBy?: {
    readonly id: string;
    readonly displayName: string;
    readonly pictureUrl: string;
    readonly usingSince: Date;
    readonly usingUntil: Date;
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
