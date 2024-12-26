import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

type httpMethod = 'GET' | 'POST' | 'PUT';

export function useApiRequest() {
	const { getAccessTokenSilently } = useAuth0();
	const baseUrl = import.meta.env.VITE__API__BASE__URL;

	const apiRequest = useCallback(
		async <TResponse, TBody = unknown>(url: string, method: httpMethod, body?: TBody) => {
			const response = await fetch(baseUrl + url, {
				method: method,
				headers: {
					Authorization: `Bearer ${await getAccessTokenSilently()}`,
					...(body && { 'Content-Type': 'application/json' })
				},
				body: body ? JSON.stringify(body) : null
			});
			if (!response.ok) {
				throw new Error(`Api request at '${url}' failed : ${await response.text()}`);
			}
			return (await response.json()) as TResponse;
		},
		[]
	);
	return { apiRequest };
}
