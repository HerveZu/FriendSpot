import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAuth0 } from 'react-native-auth0';

import { useGetProfile, UserProfile } from '~/endpoints/get-profile';

type UserProfileContext = {
  userProfile: UserProfile;
};

const _UserProfileContext = createContext<UserProfileContext>(null!);

export function useCurrentUser() {
  return useContext(_UserProfileContext);
}

export default function UserProvider(props: PropsWithChildren) {
  const { user } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const getProfile = useGetProfile();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isAuthenticated) return;

    getProfile().then(setUserProfile);
  }, [isAuthenticated]);

  return userProfile ? (
    <_UserProfileContext.Provider value={{ userProfile }}>
      {props.children}
    </_UserProfileContext.Provider>
  ) : (
    <ActivityIndicator />
  );
}
