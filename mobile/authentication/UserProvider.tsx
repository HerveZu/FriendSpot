import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '~/authentication/AuthProvider';
import { Loader } from '~/components/Loader';
import { useGetProfile, UserProfile } from '~/endpoints/get-profile';
import { useRegisterUser } from '~/endpoints/register-user';
import { useListenOnAppStateChange } from '~/lib/useListenOnAppStateChange';

type UserProfileContext = {
  readonly userProfile: UserProfile;
  refreshProfile: () => Promise<void>;
  refreshTrigger: unknown;
};

const _UserProfileContext = createContext<UserProfileContext>(null!);

export function useCurrentUser() {
  return useContext(_UserProfileContext);
}

export function UserProvider(props: PropsWithChildren) {
  const { firebaseUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [refreshTrigger, setRefreshTrigger] = useState({});
  const registerUser = useRegisterUser();
  const getProfile = useGetProfile();
  const stateTrigger = useListenOnAppStateChange('background');

  useEffect(() => {
    const displayName = firebaseUser.displayName ?? firebaseUser.email ?? '';

    registerUser({ displayName, pictureUrl: firebaseUser.photoURL }).then(() =>
      getProfile().then(setUserProfile)
    );
  }, [firebaseUser]);

  useEffect(() => {
    refreshProfile().then();
  }, [stateTrigger]);

  const refreshProfile = useCallback(async () => {
    await getProfile()
      .then(setUserProfile)
      .then(() => setRefreshTrigger({}));
  }, [getProfile, setUserProfile]);

  return userProfile ? (
    <_UserProfileContext.Provider value={{ refreshTrigger, userProfile, refreshProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}
