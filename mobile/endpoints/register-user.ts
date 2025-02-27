import { useCallback } from 'react';

import { useApiRequest } from '~/endpoints/use-api-request';

type RegisterUserRequest = {
  readonly displayName: string;
  readonly pictureUrl: string | null;
  readonly expoToken: string | null;
};

export function useRegisterUser() {
  const { apiRequest } = useApiRequest();

  return useCallback(
    (body: RegisterUserRequest) => apiRequest('/@me/register', 'POST', body),
    [apiRequest]
  );
}
