import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthenticationGuard, UserProvider } from '@/components/authentication-guard.tsx';
import { MySpotPage } from '@/pages/my-spot-page.tsx';
import { LandingPage } from '@/pages/landing-page.tsx';
import { Auth0Provider } from '@auth0/auth0-react';
import { RegisterPage } from '@/pages/register-page.tsx';
import { LoaderProvider } from '@/components/logo.tsx';
import { Header } from '@/components/header.tsx';
import { AvailabilitiesPage } from '@/pages/availabilities-page.tsx';
import { setDefaultOptions } from 'date-fns';
import { fr } from 'date-fns/locale';

const router = createBrowserRouter(
	[
		{
			path: '/',
			element: (
				<AuthenticationGuard>
					<UserProvider>
						<Header />
						{/*min-h-0 makes the 100% to only take the available space*/}
						<div className={'h-full min-h-0'}>
							<Outlet />
						</div>
					</UserProvider>
				</AuthenticationGuard>
			),
			children: [
				{
					path: '/',
					element: <LandingPage />
				},
				{
					path: '/myspot',
					element: <MySpotPage />
				},
				{
					path: '/availabilities',
					element: <AvailabilitiesPage />
				}
			]
		},
		{
			path: import.meta.env.VITE__AUTH0__CALLBACK__PATH,
			element: <RegisterPage />
		}
	],
	{
		future: {
			v7_partialHydration: true,
			v7_fetcherPersist: true,
			v7_relativeSplatPath: true,
			v7_normalizeFormMethod: true,
			v7_skipActionErrorRevalidation: true
		}
	}
);

setDefaultOptions({ locale: fr });

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<div className={'flex flex-col gap-12 w-dvw h-dvh p-6'}>
			<Auth0Provider
				domain={import.meta.env.VITE__AUTH0__DOMAIN}
				clientId={import.meta.env.VITE__AUTH0__CLIENT__ID}
				authorizationParams={{
					redirect_uri: `${window.location.origin}${import.meta.env.VITE__AUTH0__CALLBACK__PATH}`,
					audience: 'https://friendspot.me'
				}}
				useRefreshTokens={true}
				cacheLocation={'localstorage'}>
				<LoaderProvider>
					<RouterProvider
						router={router}
						future={{
							v7_startTransition: true
						}}
					/>
				</LoaderProvider>
			</Auth0Provider>
		</div>
	</StrictMode>
);
