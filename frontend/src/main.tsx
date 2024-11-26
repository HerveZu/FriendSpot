import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayoutPage } from './pages/root-layout-page.tsx';
import { MySpotPage } from './pages/my-spot-page.tsx';
import { LandingPage } from './pages/landing-page.tsx';
import { Auth0Provider } from '@auth0/auth0-react';
import { RegisterPage } from './pages/register-page.tsx';
import './index.css';

const AUTH0_DOMAIN = import.meta.env.VITE__AUTH0__DOMAIN;
const CALLBACK_PATH = import.meta.env.VITE__AUTH0__CALLBACK_PATH;
const AUTH0_CLIENT_ID = import.meta.env.VITE__AUTH0__CLIENT_ID;

const router = createBrowserRouter(
	[
		{
			path: '/',
			element: <RootLayoutPage />,
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
					path: '/_auth',
					element: <RegisterPage />
				}
			]
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

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Auth0Provider
			domain={AUTH0_DOMAIN}
			clientId={AUTH0_CLIENT_ID}
			authorizationParams={{
				redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
				audience: 'https://friendspot.me'
			}}>
			<RouterProvider
				router={router}
				future={{
					v7_startTransition: true
				}}
			/>
		</Auth0Provider>
	</StrictMode>
);
