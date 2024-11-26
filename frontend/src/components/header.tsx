import { Button } from './ui/button';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuth0 } from '@auth0/auth0-react';

export function Header() {
	const { loginWithRedirect } = useAuth0();

	async function signup() {
		const loginResponse = await loginWithRedirect();
		console.log(loginResponse);
	}

	return (
		<div className="flex justify-between items-center px-4 py-2">
			<Link to={'/'}>
				<Car width={28} height={28} color="#60A5FA" />
			</Link>
			<div className="flex items-center gap-3">
				<p>32 crédits</p>
				<Separator orientation="vertical" className="w-[2px] h-[25px]" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							onClick={() => signup()}
							variant={'outline'}
							className="text-blue-400">
							Se connecter
						</Button>
					</DropdownMenuTrigger>
					{/* <DropdownMenuTrigger asChild>
						<Button variant={'outline'} className="text-blue-400">
							Jimmy
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<Link to={'/myspot'}>
							<DropdownMenuItem>Mon Spot</DropdownMenuItem>
						</Link>
						<DropdownMenuItem>Se déconnecter</DropdownMenuItem>
					</DropdownMenuContent> */}
				</DropdownMenu>
			</div>
		</div>
	);
}
