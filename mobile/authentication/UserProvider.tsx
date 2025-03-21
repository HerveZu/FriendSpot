import { updateProfile, User } from 'firebase/auth';
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
import { useNotification } from '~/notification/NotificationContext';
import { useDeviceId } from '~/lib/use-device-id';
import { SplashScreen } from 'expo-router';

type UserProfileContext = {
  readonly userProfile: UserProfile;
  refreshProfile: () => Promise<void>;
  refreshTrigger: unknown;
  updateInternalProfile: (
    photoURL: string | null | undefined,
    displayName: string
  ) => Promise<void>;
};

const _UserProfileContext = createContext<UserProfileContext>(null!);

export function useCurrentUser() {
  return useContext(_UserProfileContext);
}

// shared global value to avoid other attempts during re-renders
let REGISTER_ATTEMPT_COUNT = 0;

export function UserProvider(props: PropsWithChildren) {
  const { firebaseUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [refreshTrigger, setRefreshTrigger] = useState({});
  const registerUser = useRegisterUser();
  const getProfile = useGetProfile();
  const stateTrigger = useListenOnAppStateChange('background');
  const [internalFirebaseUser, setInternalFirebaseUser] = useState<User>(firebaseUser);
  const [registerTrigger, setRegisterTrigger] = useState({});

  const { expoPushToken } = useNotification();
  const deviceId = useDeviceId();

  const updateInternalProfile = useCallback(
    async (photoURL: string | null | undefined, displayName: string) => {
      await updateProfile(firebaseUser, {
        displayName: displayName,
        photoURL: photoURL,
      }).then(() => {
        setInternalFirebaseUser((firebaseUser) => {
          return {
            ...firebaseUser,
            photoURL: photoURL ?? null,
            displayName,
          };
        });
      });
    },
    [firebaseUser, updateProfile, setInternalFirebaseUser]
  );

  // force app refresh every 30s
  useEffect(() => {
    const handler = setInterval(refreshProfile, 30_000);
    return () => clearTimeout(handler);
  }, []);

  useEffect(() => {
    if (REGISTER_ATTEMPT_COUNT > 5) {
      console.error('Max register attempt count reach');
      return;
    }

    if (!userProfile && !internalFirebaseUser.displayName) {
      console.error(`Register failed on attempt ${REGISTER_ATTEMPT_COUNT}, retrying in 200ms`);
      REGISTER_ATTEMPT_COUNT++;

      // dirty fix to handle concurrency issue when the user is not registered yet
      const handler = setTimeout(() => setRegisterTrigger({}), 200);
      return () => clearTimeout(handler);
    }

    if (!deviceId || !internalFirebaseUser.displayName) {
      return;
    }

    registerUser({
      displayName: internalFirebaseUser.displayName,
      pictureUrl: internalFirebaseUser.photoURL,
      device: {
        id: deviceId,
        expoPushToken: expoPushToken,
      },
    })
      .then(() => getProfile().then(setUserProfile))
      .then(() => (REGISTER_ATTEMPT_COUNT = 0));
  }, [registerTrigger, deviceId, internalFirebaseUser, expoPushToken]);

  useEffect(() => {
    refreshProfile().then();
  }, [stateTrigger]);

  useEffect(() => {
    if (userProfile) {
      SplashScreen.hide();
    }
  }, [userProfile]);

  const refreshProfile = useCallback(async () => {
    await getProfile()
      .then(setUserProfile)
      .then(() => setRefreshTrigger({}));
  }, [getProfile, setUserProfile]);

  return userProfile ? (
    <_UserProfileContext.Provider
      value={{ refreshTrigger, userProfile, refreshProfile, updateInternalProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}