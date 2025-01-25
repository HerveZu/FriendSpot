import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type UserProfile = {
  readonly displayName: string;
  readonly pictureUrl: string | undefined;
  readonly hasSpot: boolean;
  readonly wallet: {
    readonly credits: number;
    readonly pendingCredits: number;
  };
};

export function useGetProfile() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<UserProfile>('/@me', 'GET'), [apiRequest]);
}
