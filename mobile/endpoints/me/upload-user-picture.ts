import { useCallback } from 'react';
import { useApiRequest } from '~/endpoints/use-api-request';

type UserPictureResponse = {
  readonly writeUrl: string;
  readonly readonlyUrl: string;
};

export function useUploadUserPicture() {
  const { apiRequest } = useApiRequest();

  return useCallback(() => apiRequest<UserPictureResponse>(`/@me/picture`, 'PUT'), [apiRequest]);
}
