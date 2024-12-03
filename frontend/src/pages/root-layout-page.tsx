import { Outlet } from 'react-router-dom';
import { Header } from '../components/header';
import { useAuth0 } from '@auth0/auth0-react';
import { LandingConnect } from '@/components/landing-connect';
import { LoaderContext } from '@/components/logo.tsx';
import { useContext, useEffect } from 'react';

export function RootLayoutPage() {
	const { isAuthenticated, isLoading } = useAuth0();
	const { setIsLoading } = useContext(LoaderContext);

	useEffect(() => {
		setIsLoading(isLoading);
	}, [isLoading]);

	return (
		<div className="w-full h-full">
			{!isLoading &&
				(isAuthenticated ? (
					<>
						<Header />
						<Outlet />
					</>
				) : (
					<LandingConnect />
				))}
		</div>
	);
}
