import { Outlet } from 'react-router-dom';
import { Header } from '../components/header';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';

export function RootLayoutPage() {
	return (
		<>
			<Header />
			<Outlet />
			<Separator orientation="horizontal" className='mt-14'/>
			<Footer/>
		</>
	);
}
