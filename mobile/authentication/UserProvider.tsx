import { getAuth, signOut, updateProfile, User } from 'firebase/auth';
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
import { useGetProfile, UserProfile } from '~/endpoints/me/get-profile';
import { useRegisterUser } from '~/endpoints/me/register-user';
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

export function UserProvider(props: PropsWithChildren) {
  const { firebaseUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [refreshTrigger, setRefreshTrigger] = useState({});
  const registerUser = useRegisterUser();
  const getProfile = useGetProfile();
  const stateTrigger = useListenOnAppStateChange('background');
  const [internalFirebaseUser, setInternalFirebaseUser] = useState<User>(firebaseUser);

  const { expoPushToken } = useNotification();
  const { deviceId, uniquenessNotGuaranteed } = useDeviceId();

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

  const registerWithRetries = useCallback(
    async (internalFirebaseUser: User, deviceId: string) => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await registerUser({
            displayName:
              internalFirebaseUser.displayName ?? internalFirebaseUser.email ?? 'Unknown User',
            pictureUrl: internalFirebaseUser.photoURL,
            device: {
              id: deviceId,
              expoPushToken: expoPushToken,
              uniquenessNotGuaranteed: uniquenessNotGuaranteed,
            },
          });
          return;
        } catch (error) {
          const delayMs = 200 * attempt;
          console.error(`Register failed on attempt ${attempt}, retrying in ${delayMs}ms`, error);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      throw new Error('Max register attempt count reach');
    },
    [internalFirebaseUser, expoPushToken, deviceId, uniquenessNotGuaranteed]
  );

  useEffect(() => {
    if (!deviceId || !internalFirebaseUser) {
      return;
    }

    registerWithRetries(internalFirebaseUser, deviceId)
      .catch(() => signOut(getAuth()))
      .then(() => getProfile().then(setUserProfile));
  }, [registerWithRetries, internalFirebaseUser, deviceId]);

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

  useEffect(() => {
    refreshProfile().then();
  }, [refreshProfile, stateTrigger]);

  return userProfile ? (
    <_UserProfileContext.Provider
      value={{ refreshTrigger, userProfile, refreshProfile, updateInternalProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}
