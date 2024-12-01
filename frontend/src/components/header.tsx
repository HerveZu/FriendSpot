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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserStatus {
	availableSpots: number;
	bookings: [];
	spot: {
		availabilities: [] | undefined;
		totalSpotAvailability: string;
	};
	wallet: {
		credits: number | undefined;
		pendingCredits: number | undefined;
	};
}

export function Header() {
	const { logout, user } = useAuth0();

	const { apiRequest } = useApiRequest();

	const [userCredit, setUserCredit] = useState<UserStatus>();

	const currentCredit = userCredit?.wallet?.credits;
	const pendingCredit = userCredit ? userCredit?.wallet?.pendingCredits : undefined;

	useEffect(() => {
		async function fetchUserCredit() {
			const response = await apiRequest<UserStatus>(`/@me/status`, 'GET');
			setUserCredit(response);
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
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						{user?.picture ? (
							<Avatar>
								<AvatarImage src="https://github.com/shadcn.png" />
							</Avatar>
						) : (
							<AvatarFallback>{'JC'}</AvatarFallback>
						)}
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
			</div>
		</div>
	);
}
