import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo, LogoCard } from '@/components/logo.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { Car, Clock, Dot, Flag, LoaderCircle, LogOut, Ticket } from 'lucide-react';
import { Separator } from '@/components/ui/separator.tsx';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { DialogProps } from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input.tsx';

export function Header() {
	const { logout } = useAuth0();
	const { user } = useContext(UserStatusContext);
	const [openFeedback, setOpenFeedback] = useState(false);

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
							<Link to={'/myspot'}>
								<Car />
								<span>Mon spot</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to={'/booking'}>
								<Ticket />
								<span>Réserver une place</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to={'/availabilities'}>
								<Clock />
								<span>Prêter ma place</span>
							</Link>
						</DropdownMenuItem>
						<Separator />
						<DropdownMenuItem onClick={() => setOpenFeedback(true)}>
							<Flag />
							<span>Faire un retour</span>
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
			<FeedbackDialog open={openFeedback} onOpenChange={setOpenFeedback} />
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

function FeedbackDialog(props: DialogProps) {
	const [feedback, setFeedback] = useState<string>();
	const { user } = useAuth0();
	const [preferredEmailAddress, setPreferredEmailAddress] = useState<string>();
	const [isLoading, setIsLoading] = useState(false);
	const feedbackInputRef = useRef<HTMLTextAreaElement>(null);

	const sendFeedback = useCallback(async () => {
		const body = {
			embeds: [
				{
					title: `Feedback de ${user?.nickname}`,
					description: feedback,
					footer: {
						text: `${user?.name} - ${preferredEmailAddress ?? user?.email}`
					}
				}
			]
		};

		setIsLoading(true);

		try {
			await fetch(import.meta.env.VITE__DISCORD__REVIEW_WEBHOOK_URL, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json'
				}
			});
		} finally {
			setIsLoading(false);
		}

		if (props.onOpenChange) {
			props.onOpenChange(false);
		}
	}, [feedback, user, preferredEmailAddress]);

	useEffect(() => {
		if (!props.open) {
			setFeedback(undefined);
			setPreferredEmailAddress(undefined);
		}
	}, [props.open]);

	return (
		<Dialog {...props}>
			<DialogContent
				className={'w-full'}
				onAnimationStart={() => feedbackInputRef.current?.focus()}>
				<DialogHeader>
					<DialogTitle>Que penses-tu de FriendSpot ?</DialogTitle>
					<DialogDescription />
				</DialogHeader>
				<Input
					className={'text-sm'}
					value={preferredEmailAddress ?? user?.email}
					onChange={(e) => setPreferredEmailAddress(e.target.value)}
				/>
				<Textarea
					ref={feedbackInputRef}
					className={'text-sm resize-none'}
					value={feedback}
					onChange={(e) => setFeedback(e.target.value)}
					placeholder={
						'Tu as un retour à nous faire ou une suggestion ? Écris nous ici !'
					}
				/>
				<Button disabled={!feedback} onClick={() => sendFeedback()}>
					{isLoading && <LoaderCircle className={'animate-spin'} />}
					Envoyer
				</Button>
			</DialogContent>
		</Dialog>
	);
}
