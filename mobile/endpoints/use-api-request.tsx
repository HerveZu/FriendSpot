import { useCallback } from 'react';
import { useAuth0 } from 'react-native-auth0';
type httpMethod = 'GET' | 'POST' | 'PUT';

export function useApiRequest() {
  const { getCredentials } = useAuth0();
  const apiRequest = useCallback(
    async <TResponse, TBody = unknown>(path: string, method: httpMethod, body?: TBody) => {
      const credentials = await getCredentials();
      const response = await fetch('https://friendspot-backend-7546e1d52299.herokuapp.com' + path, {
        method,
        headers: {
          Authorization: `Bearer ${credentials?.accessToken}`,
          ...(body && { 'Content-Type': 'application/json' }),
        },
        body: body ? JSON.stringify(body) : null,
      });
      if (!response.ok) {
        const errorMessage = `Api request at '${path}' failed with status ${response.status} (${await response.text()})`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      return (await response.json()) as TResponse;
    },
    []
  );
  return { apiRequest };
}
