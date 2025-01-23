import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

export type UserProfile = {
  readonly wallet: {
    readonly credits: number;
    readonly pendingCredits: number;
  };
};

export function useGetProfile() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<UserProfile>('/@me/status', 'GET'), [apiRequest]);
}
