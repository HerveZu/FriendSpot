import { LogoCard, LogoCardProps } from '@/components/logo.tsx';
import { useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils.ts';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '@/components/action-button.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { useAuth0 } from '@auth0/auth0-react';
import { Title } from '@/components/title.tsx';

const routeForAction: { [action: string]: string } = {
	lend: '/availabilities',
	book: '/booking'
};

export function LandingPage() {
	const [action, setAction] = useState<'lend' | 'book'>();
	const navigate = useNavigate();
	const { user } = useContext(UserStatusContext);
	const auth0 = useAuth0();

	useEffect(() => {
		if (!action) {
			return;
		}

		const handler = setTimeout(() => navigate(routeForAction[action]), 400);
		return () => clearTimeout(handler);
	}, [navigate, action]);

	return (
		<div className={'flex flex-col w-full h-full justify-between'}>
			{/*bottom margin makes the illusion that the logo is center despite the gap between the header and the content*/}
			{/*Don't use gap it doesn't work well for smaller heights*/}
			<div className={'flex flex-col justify-center grow mb-10'}>
				<div className={'flex justify-center gap-6'}>
					<ActionCard
						primary={!!action || false}
						className={'h-28'}
						style={{
							rotate: '-5deg',
							translate: '45%'
						}}
						state={action ? (action === 'lend' ? 'active' : 'inactive') : 'none'}
						onClick={() => setAction('lend')}
					/>
					<ActionCard
						primary={true}
						className={'h-28 delay-200'}
						style={{
							rotate: '15deg',
							translate: '-40% 20%'
						}}
						state={action ? (action === 'book' ? 'active' : 'inactive') : 'none'}
						onClick={() => setAction('book')}
					/>
				</div>
			</div>
			<div className={cn('flex flex-col gap-8', action && 'opacity-25')}>
				<Title>
					Salut <span className={'text-primary'}>{auth0.user?.nickname}</span>, que
					souhaites-tu faire ?
				</Title>
				<div className={'flex flex-col gap-6'}>
					<ActionButton
						large
						info={`${user.availableSpots} places sont disponnibles dans votre parking`}
						onClick={() => setAction('book')}>
						Je réserve une place
					</ActionButton>
					<span className={'mx-auto text-md'}>ou</span>
					<ActionButton
						large
						info={'Gagner des crédits en prêtant ma place'}
						variant={'outline'}
						onClick={() => setAction('lend')}>
						Je prête ma place
					</ActionButton>
				</div>
			</div>
		</div>
	);
}

function ActionCard({
	className,
	style,
	...props
}: { state: 'none' | 'active' | 'inactive' } & LogoCardProps) {
	return (
		<LogoCard
			className={cn(
				className,
				'transition-all duration-3000 animate-float',
				props.state === 'inactive' && 'opacity-25 z-0',
				props.state === 'active' && 'z-50 animate-none duration-1000 delay-0'
			)}
			style={{
				...style,
				scale: props.state === 'active' ? '100' : '1',
				rotate: props.state === 'active' ? '0deg' : style?.rotate
			}}
			{...props}
		/>
	);
}
