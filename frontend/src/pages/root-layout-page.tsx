import { Outlet } from 'react-router-dom';
import { Header } from '../components/header';

export function RootLayoutPage() {
	return (
		<>
			<Header />
			<Outlet />
		</>
	);
}
