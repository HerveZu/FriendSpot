import { useAuth0 } from '@auth0/auth0-react';
import { LoaderContext } from '@/components/logo.tsx';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request.ts';
import { Button } from '@/components/ui/button.tsx';
import { Footer } from '@/components/footer.tsx';
import { cn } from '@/lib/utils.ts';

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

export function AuthenticationGuard(props: { children: ReactNode, className?: string }) {
	const { isAuthenticated, isLoading } = useAuth0();
	const { setIsLoading } = useContext(LoaderContext);
	const { apiRequest } = useApiRequest();
	const [userStatus, setUserStatus] = useState<UserStatus>();

	useEffect(() => {
		setIsLoading(isLoading);
	}, [isLoading]);

	useEffect(() => {
		setIsLoading(true);

		apiRequest<UserStatus>('/@me/status', 'GET')
			.then(setUserStatus)
			.finally(() => setIsLoading(false));
	}, []);

	return (
		<div className={cn(props.className, "w-full h-full p-4")}>
			{userStatus && (
				<UserStatusContext.Provider value={{ user: userStatus }}>
					{!isLoading && (isAuthenticated ? props.children : <LandingConnect />)}
				</UserStatusContext.Provider>
			)}
		</div>
	);
}

function LandingConnect() {
	const { loginWithRedirect } = useAuth0();

	return (
		<div className="flex flex-col items-center w-full h-screen mt-48">
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
