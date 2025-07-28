import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type RegisterUserRequest = {
  readonly displayName: string;
  readonly pictureUrl: string | null;
  readonly device: {
    readonly id: string;
    readonly expoPushToken: string | null;
    readonly uniquenessNotGuaranteed?: boolean;
    readonly locale: string;
    readonly timezone: string;
  };
};

export function useRegisterUser() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: {
      device: {
        expoPushToken: string | null;
        id: string;
        locale: string;
        timezone: string | null;
        uniquenessNotGuaranteed: boolean;
      };
      displayName: string;
      pictureUrl: string | null;
    }) => apiRequest('/@me/register', 'POST', body),
    [apiRequest]
  );
}
