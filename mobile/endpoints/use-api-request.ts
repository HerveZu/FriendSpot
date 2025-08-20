import { getIdToken } from 'firebase/auth';
import { useCallback, useEffect, useMemo } from 'react';

import { useAuth } from '~/authentication/AuthProvider';
import { apiConfig } from '~/endpoints/api-config';

type httpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export function useApiRequest() {
  const { firebaseUser } = useAuth();
  const abortController = useMemo(() => new AbortController(), []);

  useEffect(() => {
    return () => abortController.abort();
  }, [abortController]);

  const apiRequest = useCallback(
    async <TResponse, TBody = unknown>(path: string, method: httpMethod, body?: TBody) => {
      const response = await fetch(apiConfig.backendUrl + path, {
        signal: abortController.signal,
        method,
        headers: {
          Authorization: `Bearer ${await getIdToken(firebaseUser)}`,
          ...(body && { 'Content-Type': 'application/json' }),
        },
        body: body ? JSON.stringify(body) : null,
      });
      if (!response.ok) {
        const errorMessage = `Api request at '${path}' failed with status ${response.status} (${await response.text()})`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null as TResponse;
      }

      return (await response.json()) as TResponse;
    },
    []
  );

  return { apiRequest };
}
