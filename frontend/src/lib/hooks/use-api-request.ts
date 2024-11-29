import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

type httpMethod = 'GET' | 'POST' | 'PUT';

export function useApiRequest() {
	const { getAccessTokenSilently } = useAuth0();

	const apiRequest = useCallback(async (url: string, method: httpMethod) => {
		const response = await fetch(url, {
			method: method,
			headers: {
				Authorization: `Bearer ${await getAccessTokenSilently()}`
			}
		});
		return response;
	}, []);
	return { apiRequest };
}
