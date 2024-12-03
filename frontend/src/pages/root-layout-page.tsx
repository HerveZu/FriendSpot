import { Outlet } from 'react-router-dom';
import { Header } from '../components/header';
import { useAuth0 } from '@auth0/auth0-react';
import { LandingConnect } from '@/components/landing-connect';
import { LoaderProvider } from '@/components/logo.tsx';

export function RootLayoutPage() {
	const { isAuthenticated } = useAuth0();

	return (
		<LoaderProvider className="w-full h-full">
			{isAuthenticated ? (
				<>
					<Header />
					<Outlet />
				</>
			) : (
				<LandingConnect />
			)}
		</LoaderProvider>
	);
}
