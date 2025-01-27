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

type UserProfileContext = {
  readonly userProfile: UserProfile;
  refreshProfile: () => Promise<void>;
};

const _UserProfileContext = createContext<UserProfileContext>(null!);

export function useCurrentUser() {
  return useContext(_UserProfileContext);
}

export default function UserProvider(props: PropsWithChildren) {
  const { firebaseUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const registerUser = useRegisterUser();
  const getProfile = useGetProfile();

  useEffect(() => {
    const displayName = firebaseUser.displayName ?? firebaseUser.email ?? '';

    registerUser({ displayName, pictureUrl: firebaseUser.photoURL }).then(() =>
      getProfile().then(setUserProfile)
    );
  }, [firebaseUser]);

  const refreshProfile = useCallback(async () => {
    await getProfile().then(setUserProfile);
  }, [getProfile, setUserProfile]);

  return userProfile ? (
    <_UserProfileContext.Provider value={{ userProfile, refreshProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}
