import { useEffect } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useNavigate } from 'react-router-dom';

export function RegisterPage() {
	const navigate = useNavigate();
	const { apiRequest } = useApiRequest();

	useEffect(() => {
		async function registerUser() {
			await apiRequest('http://localhost:5001/@me/register', 'POST');
			navigate('/');
		}
		registerUser();
	}, [apiRequest]);

	return <></>;
}
