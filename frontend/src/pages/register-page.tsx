import { useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useNavigate } from 'react-router-dom';
import { LogoLoader } from '@/components/logo';

export function RegisterPage() {
	const navigate = useNavigate();
	const { apiRequest } = useApiRequest();
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		async function registerUser() {
			setIsLoading(true);
			try {
				await apiRequest<void>('/@me/register', 'POST');
			} catch (error) {
				console.log(error);
			} finally {
				navigate('/');
				setIsLoading(false);
			}
		}
		registerUser();
	}, [apiRequest, navigate]);

	return (
		<>
			{isLoading && (
				<div className="absolute left-[40%] top-[30%]">
					<LogoLoader loop={700} pause={800} />
				</div>
			)}
		</>
	);
}
