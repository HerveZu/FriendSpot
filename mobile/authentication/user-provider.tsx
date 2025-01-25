import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth0 } from 'react-native-auth0';

import { useGetProfile, UserProfile } from '~/endpoints/get-profile';
import { useRegisterUser } from '~/endpoints/register-user';

type UserProfileContext = {
  readonly userProfile: UserProfile;
  refreshProfile: () => Promise<void>;
};

const _UserProfileContext = createContext<UserProfileContext>(null!);

export function useCurrentUser() {
  return useContext(_UserProfileContext);
}

export default function UserProvider(props: PropsWithChildren) {
  const { user } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const registerUser = useRegisterUser();
  const getProfile = useGetProfile();

  useEffect(() => {
    if (!user) return;

    const displayName = user.nickname ?? user.name ?? user.email ?? '';

    registerUser({ displayName, pictureUrl: user.picture }).then(() =>
      getProfile().then(setUserProfile)
    );
  }, [user]);

  const refreshProfile = useCallback(async () => {
    await getProfile().then(setUserProfile);
  }, [getProfile, setUserProfile]);

  return userProfile ? (
    <_UserProfileContext.Provider value={{ userProfile, refreshProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <SafeAreaView className="h-full flex-col justify-center">
      <ActivityIndicator />
    </SafeAreaView>
  );
}
