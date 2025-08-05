import { useCurrentUser } from '~/authentication/UserProvider';

import { useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';

export default function EnsureUserHasSpot({ children }: PropsWithChildren) {
  const router = useRouter();
  const user = useCurrentUser();
  const userHasParking = user.userProfile?.spot?.parking;

  useEffect(() => {
    !userHasParking &&
      router.push({
        pathname: '/authenticated/joint-parking',
      });
  }, [userHasParking]);

  return children;
}
