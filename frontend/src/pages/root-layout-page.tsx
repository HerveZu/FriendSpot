import { Outlet } from 'react-router-dom';
import { Header } from '../components/header';
import { useAuth0 } from '@auth0/auth0-react';
import { LandingConnect } from '@/components/landing-connect';

export function RootLayoutPage() {
	const { isAuthenticated } = useAuth0();

	return (
		<div className="w-full h-full">
			{isAuthenticated ? (
				<>
					<Header />
					<Outlet />
				</>
			) : (
				<LandingConnect />
			)}
		</div>
	);
}
