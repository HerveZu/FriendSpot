import { useAuth0 } from '@auth0/auth0-react';
import { LoaderContext } from '@/components/logo.tsx';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request.ts';
import { Button } from '@/components/ui/button.tsx';
import { Footer } from '@/components/footer.tsx';

export function AuthenticationGuard(props: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth0();
	const { setIsLoading } = useContext(LoaderContext);

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
	const { setIsLoading } = useContext(LoaderContext);
	const { apiRequest } = useApiRequest();
	const [userStatus, setUserStatus] = useState<UserStatus>();

	useEffect(() => {
		setIsLoading(true);

		apiRequest<UserStatus>('/@me/status', 'GET')
			.then(setUserStatus)
			.finally(() => setIsLoading(false));
	}, []);

	return (
		userStatus && (
			<UserStatusContext.Provider value={{ user: userStatus }}>
				{props.children}
			</UserStatusContext.Provider>
		)
	);
}

function LandingConnect() {
	const { loginWithRedirect } = useAuth0();

	return (
		<div className="flex flex-col items-center w-full h-full justify-center">
			<div className="flex flex-col items-center gap-12 w-[80%]">
				<div className="flex flex-col items-center text-center gap-4 mt-5">
					<h1 className="text-xl">
						Bienvenue sur <span className="text-primary">FriendSpot</span> (bêta)
					</h1>
					<h2 className="text-lg">
						Connectez-vous pour pouvoir utiliser l&apos;application !
					</h2>
				</div>
				<Button className="w-full" onClick={() => loginWithRedirect()} variant={'default'}>
					S&apos;authentifier
				</Button>
			</div>
			<Footer />
		</div>
	);
}
