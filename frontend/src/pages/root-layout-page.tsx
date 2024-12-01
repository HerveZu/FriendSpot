import { Outlet } from 'react-router-dom';
import { Header } from '../components/header';
import { LoaderProvider } from '@/components/logo.tsx';

export function RootLayoutPage() {
	return (
		<main className={'flex flex-col h-screen w-screen'}>
			<Header />
			<LoaderProvider className={'flex-1'}>
				<Outlet />
			</LoaderProvider>
		</main>
	);
}
