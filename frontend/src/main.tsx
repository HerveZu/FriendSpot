import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayoutPage } from './pages/root-layout-page.tsx';
import { MySpotPage } from './pages/my-spot-page.tsx';
import './index.css';

const router = createBrowserRouter(
	[
		{
			path: '/',
			element: <RootLayoutPage />,
			children: [
				{

				},
				{
					path: '/myspot',
					element: <MySpotPage />
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
		<RouterProvider
			router={router}
			future={{
				v7_startTransition: true
			}}
		/>
	</StrictMode>
);
