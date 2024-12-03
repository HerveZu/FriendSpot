import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { Footer } from './footer';

export function LandingConnect() {
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
