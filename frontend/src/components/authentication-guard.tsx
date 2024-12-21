import { useAuth0 } from '@auth0/auth0-react';
import { Logo, useLoading } from '@/components/logo.tsx';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request.ts';
import { Footer } from '@/components/footer.tsx';
import { Title } from '@/components/title.tsx';
import { ActionButton } from '@/components/action-button.tsx';

export function AuthenticationGuard(props: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth0();
	const { setIsLoading } = useLoading('auth-guard');

	useEffect(() => {
		setIsLoading(isLoading);
	}, [isLoading]);

	return !isLoading && (isAuthenticated ? props.children : <LandingConnect />);
}

type UserStatus = {
	wallet: {
		credits: number;
		pendingCredits: number;
	};
};

type UserStatusContext = {
	user: UserStatus;
};

export const UserStatusContext = createContext<UserStatusContext>(null!);

export function UserProvider(props: { children: ReactNode }) {
	const { setIsLoadingOnce, refreshTrigger } = useLoading('user-provider');
	const { apiRequest } = useApiRequest();
	const [userStatus, setUserStatus] = useState<UserStatus>();
	const [retryCount, setRetryCount] = useState(0);

	const MAX_RETRY_COUNT = 3;

	useEffect(() => {
		if (retryCount >= MAX_RETRY_COUNT) {
			console.error(`Max retry count reached (${retryCount})`);
			return;
		}

		setIsLoadingOnce(true);

		apiRequest<UserStatus>('/@me/status', 'GET')
			.then((status) => {
				setUserStatus(status);
				setRetryCount(0);
			})
			// likely that the user hasn't been registered
			.catch(() => {
				apiRequest<void>('/@me/register', 'POST').finally(() =>
					setRetryCount((retryCount) => retryCount + 1)
				);
			})
			.finally(() => setIsLoadingOnce(false));
	}, [retryCount, refreshTrigger]);

	return (
		userStatus && (
			<UserStatusContext.Provider value={{ user: userStatus }}>
				{props.children}
			</UserStatusContext.Provider>
		)
	);
}

function LandingConnect() {
	const { loginWithPopup } = useAuth0();

	return (
		<div className="flex flex-col items-center w-full h-full justify-center">
			<div className="flex flex-col items-center gap-12">
				<div className="flex flex-col items-center text-center gap-8">
					<Logo className={'w-16 h-16 my-8'} />
					<Title>
						Bienvenue sur <span className="text-primary">FriendSpot</span>
					</Title>
				</div>
				<ActionButton
					info={"Connecte-toi pour utiliser l'application !"}
					onClick={() => loginWithPopup()}
					variant={'default'}>
					S&apos;authentifier
				</ActionButton>
			</div>
			<Footer />
		</div>
	);
}
