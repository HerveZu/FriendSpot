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
import { useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';

export function Header() {
	const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
	const { apiRequest } = useApiRequest();

	const baseUrl = import.meta.env.VITE__AUTH0__BASE__URL;

	const [userCredit, setUserCredit] = useState({});
	const currentCredit = userCredit?.wallet?.credits;
	const pendingCredit = userCredit?.wallet?.pendingCredits;

	useEffect(() => {
		async function fetchUserCredit() {
			const response = await apiRequest(`${baseUrl}/@me/status`, 'GET');
			const data = await response.json();
			setUserCredit(data);
		}
		fetchUserCredit();
	}, []);

	return (
		<div className="flex justify-between items-center px-4 py-2 min-h-[80px] z-10 ">
			<Link to={'/'}>
				<Car width={28} height={28} color="#60A5FA" />
			</Link>
			<div className="flex items-center gap-3">
				{currentCredit && (
					<div>
						<p className="text-">{`${currentCredit} crédit${currentCredit > 1 ? 's' : ''}`}</p>
						<p className="text-sm">{`${pendingCredit} crédit${pendingCredit > 1 ? 's' : ''} en cours`}</p>
					</div>
				)}
				<Separator orientation="vertical" className="w-[2px] h-[25px]" />
				{isAuthenticated ? (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant={'default'}>{user.name}</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="flex flex-col gap-2 ">
								<DropdownMenuItem asChild>
									<Link to={'/myspot'}>Mon spot</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Button variant={'destructive'} onClick={() => logout()}>
										Se déconnecter
									</Button>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				) : (
					<Button
						onClick={() => loginWithRedirect()}
						variant={'outline'}
						className="text-blue-400">
						Se connecter
					</Button>
				)}
			</div>
		</div>
	);
}
