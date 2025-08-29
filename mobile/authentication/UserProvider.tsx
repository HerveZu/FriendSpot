import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { useAuth } from '~/authentication/AuthProvider';
import { Loader } from '~/components/Loader';
import { useGetProfile, UserProfile } from '~/endpoints/me/get-profile';
import { SplashScreen } from 'expo-router';
import { useRegisterUser } from '~/endpoints/me/register-user';
import { AppContext } from '~/app/_layout';
import { useNotification } from '~/notification/NotificationContext';
import { deviceCalendar, deviceLocale } from '~/i18n/i18n';
import { updateProfile } from 'firebase/auth';
import { useFetch, useHookFetch } from '~/lib/useFetch';
import { AppFeatures, useGetFeatures } from '~/endpoints/me/get-features';

type UpdateUserProfile = {
  pictureUrl: string | null | undefined;
  displayName: string;
};

const UserProfileContext = createContext<{
  readonly userProfile: UserProfile;
  readonly features: AppFeatures;
  readonly refreshProfile: () => Promise<void>;
  readonly updateUserProfile: (profile: UpdateUserProfile) => Promise<void>;
}>(null!);

export function useCurrentUser() {
  return useContext(UserProfileContext);
}

export function UserProvider(props: PropsWithChildren) {
  const getProfile = useGetProfile();
  const registerUser = useRegisterUser();

  const [appFeatures] = useHookFetch(useGetFeatures, []);
  const [userProfile, setUserProfile] = useFetch(() => getProfile(), []);

  const { firebaseUser } = useAuth();
  const { userDevice } = useContext(AppContext);
  const { expoPushToken } = useNotification();

  const refreshProfile = useCallback(async () => {
    await getProfile().then(setUserProfile);
  }, [getProfile, setUserProfile]);

  const registerDevice = useMemo(
    () => ({
      id: userDevice.deviceId,
      expoPushToken: expoPushToken,
      uniquenessNotGuaranteed: userDevice.uniquenessNotGuaranteed,
      locale: deviceLocale.languageTag,
      timezone: deviceCalendar.timeZone,
    }),
    [userDevice, expoPushToken]
  );

  const updateUserProfile = useCallback(
    ({ displayName, pictureUrl }: UpdateUserProfile) =>
      updateProfile(firebaseUser, { displayName, photoURL: pictureUrl }).then(() =>
        registerUser({
          displayName: displayName,
          pictureUrl: pictureUrl ?? null,
          device: registerDevice,
        }).then(refreshProfile)
      ),
    [registerUser, registerDevice, firebaseUser]
  );

  useEffect(() => {
    if (userProfile && userProfile.displayName !== firebaseUser.displayName) {
      return;
    }

    updateUserProfile({
      displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'Unknown',
      pictureUrl: firebaseUser.photoURL,
    }).then(() => console.debug('User registered after firebaseUser change trigger'));
  }, [firebaseUser.displayName]);

  useEffect(() => {
    if (userProfile) {
      SplashScreen.hide();
    }
  }, [userProfile]);

  return userProfile && appFeatures ? (
    <UserProfileContext.Provider
      value={{ features: appFeatures, userProfile, refreshProfile, updateUserProfile }}>
      {props.children}
    </UserProfileContext.Provider>
  ) : (
    <Loader />
  );
}
