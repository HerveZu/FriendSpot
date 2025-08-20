import { useCurrentUser } from '~/authentication/UserProvider';

import { useRouter } from 'expo-router';
import { createContext, PropsWithChildren, useCallback, useEffect, useState } from 'react';

export const UserSpotCheckContext = createContext<{ hasDismissed: boolean; dismiss: () => void }>(
  null!
);

export function EnsureUserHasSpot({ children }: PropsWithChildren) {
  const router = useRouter();
  const user = useCurrentUser();
  const userHasParking = user.userProfile?.spot?.parking;
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  useEffect(() => {
    if (dismissed || userHasParking) {
      return;
    }

    dismiss();
    router.push({
      pathname: '/join-parking',
    });
  }, [dismissed, userHasParking, dismiss]);

  return (
    <UserSpotCheckContext.Provider value={{ hasDismissed: dismissed, dismiss }}>
      {children}
    </UserSpotCheckContext.Provider>
  );
}
