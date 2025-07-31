import { useCurrentUser } from '~/authentication/UserProvider';

import { useRouter } from 'expo-router';
import { PropsWithChildren } from 'react';

export function EnsureUserHasSpot({ children }: PropsWithChildren) {
  const router = useRouter();
  const user = useCurrentUser();
  const userHasParking = user.userProfile?.spot?.parking;

  if (userHasParking) {
    return;
  } else {
    router.push({
      pathname: '/(main)/join-parking',
    });
  }

  return userHasParking ? children : '';
}
