import { useEffect } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '@/components/logo';

export function RegisterPage() {
	const navigate = useNavigate();
	const { apiRequest } = useApiRequest();
	const { setIsLoading } = useLoading('register');

	useEffect(() => {
		setIsLoading(true);

		apiRequest<void>('/@me/register', 'POST').finally(() => {
			// still redirect when backend return an error
			navigate('/');
			setIsLoading(false);
		});
	}, [apiRequest, navigate]);

	return undefined;
}
