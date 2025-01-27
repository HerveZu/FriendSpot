import {useCallback} from 'react';

import {useApiRequest} from '~/endpoints/use-api-request';

export type UserProfile = {
  readonly displayName: string;
  readonly pictureUrl?: string;
  readonly rating: number;
  readonly spot?: {
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
    };
  };
  readonly wallet: {
    readonly credits: number;
    readonly pendingCredits: number;
  };
};

export function useGetProfile() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<UserProfile>('/@me', 'GET'), [apiRequest]);
}
