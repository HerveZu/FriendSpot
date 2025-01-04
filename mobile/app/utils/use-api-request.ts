import { useCallback } from 'react';
import { env } from '@/app/utils/env';
import { useAuth0 } from 'react-native-auth0';

type httpMethod = 'GET' | 'POST' | 'PUT';

export function useApiRequest() {
	const { getCredentials } = useAuth0();

	const apiRequest = useCallback(
		async <TResponse, TBody = unknown>(url: string, method: httpMethod, body?: TBody) => {
			const credentials = await getCredentials();
			const response = await fetch(env.api_url + url, {
				method: method,
				headers: {
					Authorization: `Bearer ${credentials?.accessToken}`,
					...(body && { 'Content-Type': 'application/json' })
				},
				body: body ? JSON.stringify(body) : null
			});

			if (!response.ok) {
				const errorMessage = `Api request at '${url}' failed with status ${response.status} (${await response.text()})`;
				console.error(errorMessage);
				throw new Error(errorMessage);
			}
			return (await response.json()) as TResponse;
		},
		[]
	);
	return { apiRequest };
}
