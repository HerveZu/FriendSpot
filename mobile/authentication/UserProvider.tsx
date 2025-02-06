import { User, updateProfile, updateEmail } from 'firebase/auth';
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
  updateInternalProfile: (photoURL: string, displayName: string) => Promise<void>;
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
  const stateTrigger = useListenOnAppStateChange('background');
  const [internalFirebaseUser, setInternalFirebaseUser] = useState<User>(firebaseUser);

  const updateInternalProfile = useCallback(
    async (photoURL: string, displayName: string) => {
      await updateProfile(firebaseUser, {
        displayName: displayName,
        photoURL: photoURL,
      }).then(() => {
        setInternalFirebaseUser((firebaseUser) => {
          return {
            ...firebaseUser,
            photoURL,
            displayName,
          };
        });
      });
    },
    [updateProfile, setInternalFirebaseUser]
  );

  useEffect(() => {
    const displayName = internalFirebaseUser.displayName ?? internalFirebaseUser.email ?? '';

    registerUser({ displayName, pictureUrl: internalFirebaseUser.photoURL }).then(() =>
      getProfile().then(setUserProfile)
    );
  }, [internalFirebaseUser]);

  useEffect(() => {
    refreshProfile().then();
  }, [stateTrigger]);

  const refreshProfile = useCallback(async () => {
    await getProfile().then(setUserProfile);
  }, [getProfile, setUserProfile]);

  return userProfile ? (
    <_UserProfileContext.Provider value={{ userProfile, refreshProfile, updateInternalProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}
