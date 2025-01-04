import { Stack } from 'expo-router';
import { Auth0Provider } from 'react-native-auth0';
import { UserProvider } from '@/app/components/user-provider';
import { env } from '@/app/utils/env';

export default function RootLayout() {
	return (
		<Auth0Provider domain={env.auth0.domain} clientId={env.auth0.clientId}>
			<UserProvider>
				<Stack />
			</UserProvider>
		</Auth0Provider>
	);
}
