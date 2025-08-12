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
import { SplashScreen } from 'expo-router';
import { deviceCalendar, deviceLocale } from '~/i18n/i18n';
import { AppContext } from '~/app/_layout';

type UserProfileContext = {
  readonly userProfile: UserProfile;
  readonly refreshProfile: () => Promise<void>;
  readonly refreshTrigger: unknown;
  readonly updateInternalProfile: (
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
  const [refreshTrigger, setRefreshTrigger] = useState(new Date());
  const registerUser = useRegisterUser();
  const getProfile = useGetProfile();
  const stateTrigger = useListenOnAppStateChange('background');
  const [internalFirebaseUser, setInternalFirebaseUser] = useState<User>(firebaseUser);
  const { userDevice } = useContext(AppContext);

  const { expoPushToken } = useNotification();

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
    async (user: User) => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await registerUser({
            displayName: user.displayName ?? user.email ?? 'Unknown User',
            pictureUrl: user.photoURL,
            device: {
              id: userDevice.deviceId,
              expoPushToken: expoPushToken,
              uniquenessNotGuaranteed: userDevice.uniquenessNotGuaranteed,
              locale: deviceLocale.languageTag,
              timezone: deviceCalendar.timeZone,
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
    [expoPushToken, userDevice]
  );

  useEffect(() => {
    // discarding when no displayName, because it takes one more render to be actually populated.
    if (!internalFirebaseUser.displayName) {
      return;
    }

    registerWithRetries(internalFirebaseUser)
      .catch(() => signOut(getAuth()))
      .then(() => getProfile().then(setUserProfile));
  }, [registerWithRetries, internalFirebaseUser]);

  useEffect(() => {
    if (userProfile) {
      SplashScreen.hide();
    }
  }, [userProfile]);

  const refreshProfile = useCallback(async () => {
    await getProfile()
      .then(setUserProfile)
      .then(() => setRefreshTrigger(new Date()));
  }, [getProfile, setUserProfile]);

  useEffect(() => {
    if (!internalFirebaseUser.emailVerified) {
      return;
    }

    refreshProfile().then();
  }, [internalFirebaseUser, refreshProfile, stateTrigger]);

  return userProfile ? (
    <_UserProfileContext.Provider
      value={{ refreshTrigger, userProfile, refreshProfile, updateInternalProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}
