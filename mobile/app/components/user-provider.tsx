import {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useState
} from 'react';
import { useAuth0, User } from 'react-native-auth0';
import { useApiRequest } from '@/app/utils/use-api-request';
import { Image, Text, View } from 'react-native';

export const UserContext = createContext<{
	user: User;
	userStatus: UserStatus;
}>(null!);

type UserStatus = {
	readonly wallet: {
		readonly credits: number;
		readonly pendingCredits: number;
	};
};

export function UserProvider(props: PropsWithChildren) {
	const { isLoading, authorize, user } = useAuth0();
	const { apiRequest } = useApiRequest();
	const [userStatus, setUserStatus] = useState<UserStatus>();

	const isAuthenticated = !isLoading && !!user;

	const login = useCallback(async () => {
		await authorize({
			audience: 'https://friendspot.me'
		});
	}, [authorize]);

	useEffect(() => {
		if (isLoading || isAuthenticated) {
			return;
		}

		login().then();
	}, [isLoading, isAuthenticated, login]);

	useEffect(() => {
		if (isLoading || !isAuthenticated) {
			return;
		}

		apiRequest<UserStatus>('/@me/status', 'GET').then(setUserStatus);
	}, [apiRequest, setUserStatus, isLoading, isAuthenticated]);

	if (!user || !userStatus) {
		return;
	}

	return (
		<UserContext.Provider
			value={{
				user: user,
				userStatus: userStatus
			}}>
			<UserHeader />
			{props.children}
		</UserContext.Provider>
	);
}

function UserHeader() {
	const { user, userStatus } = useContext(UserContext);

	const userDisplayName =
		user.preferred_username ?? user.given_name ?? user.nickname ?? user.address;

	return (
		<View>
			<Text>{userDisplayName}</Text>
			<Text>{userStatus.wallet.credits}</Text>
			<Text>{userStatus.wallet.pendingCredits}</Text>
			<Text>{userDisplayName}</Text>
			<Image src={user.picture}></Image>
		</View>
	);
}
