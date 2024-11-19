import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './pages/root-layout.tsx';
import { MySpot } from './components/my-spot.tsx';
import './index.css';

const router = createBrowserRouter(
	[
		{
			path: '/',
			element: <RootLayout />,
			children: [
				{
					path: '/myspot',
					element: <MySpot />
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
