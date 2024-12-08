import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth0 } from '@auth0/auth0-react';
import { useContext } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo, LogoCard } from '@/components/logo.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { Dot, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator.tsx';

export function Header() {
	const { logout } = useAuth0();
	const { user } = useContext(UserStatusContext);

	return (
		<div className="flex justify-between items-center">
			<Link to={'/'}>
				<Logo className={'h-8'} />
			</Link>
			<div className="flex items-center gap-8">
				<div className={'flex gap-2 items-center'}>
					<span className={'flex gap-2 items-center text-lg'}>
						{user.wallet.credits}
						<LogoCard primary={true} className={'h-6'} />
					</span>
					<Dot />
					<span className={'flex gap-2 items-center text-lg opacity-55'}>
						{user.wallet.pendingCredits}
						<LogoCard primary={false} className={'h-6'} />
					</span>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<UserAvatar className={'h-8 w-8'} />
					</DropdownMenuTrigger>
					<DropdownMenuContent className="flex flex-col gap-2">
						<DropdownMenuItem asChild>
							<Link to={'/myspot'}>Mon spot</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to={'/availabilities'}>Prêter ma place</Link>
						</DropdownMenuItem>
						<Separator />
						<DropdownMenuItem asChild>
							<Button variant={'destructive'} onClick={() => logout()}>
								<LogOut />
								Se déconnecter
							</Button>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

function UserAvatar(props: { className?: string }) {
	const { user } = useAuth0();
	const initials = user?.name?.split(' ').map((name) => name[0].toUpperCase());

	return (
		<Avatar className={props.className}>
			<AvatarImage src={user?.picture} />
			<AvatarFallback className={'text-primary'}>{initials}</AvatarFallback>
		</Avatar>
	);
}
