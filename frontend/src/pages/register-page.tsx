import { useContext, useEffect } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useNavigate } from 'react-router-dom';
import { LoaderContext } from '@/components/logo';

export function RegisterPage() {
	const navigate = useNavigate();
	const { apiRequest } = useApiRequest();
	const { setIsLoading } = useContext(LoaderContext);

	useEffect(() => {
		async function registerUser() {
			setIsLoading(true);

			try {
				await apiRequest('http://localhost:5001/@me/register', 'POST');
			} catch (error) {
				console.log(error);
			} finally {
				navigate('/');
				setIsLoading(false);
			}
		}
		registerUser();
	}, [apiRequest, navigate]);

	return <span>Registering...</span>
}
