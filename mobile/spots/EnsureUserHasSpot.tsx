import { useCurrentUser } from '~/authentication/UserProvider';

import { useRouter } from 'expo-router';
import { createContext, PropsWithChildren, useCallback, useEffect } from 'react';
import { usePersistentState } from '~/lib/usePersistentState';

export const UserSpotCheckContext = createContext<{ hasDismissed: boolean; dismiss: () => void }>(
  null!
);

export function EnsureUserHasSpot({ children }: PropsWithChildren) {
  const router = useRouter();
  const user = useCurrentUser();
  const userHasParking = user.userProfile?.spot?.parking;
  const [dismissed, setDismissed] = usePersistentState<'dismissed' | 'noYet' | 'loading'>(
    'dismiss-join-parking-redirection',
    'noYet',
    'loading'
  );

  const dismiss = useCallback(() => {
    setDismissed('dismissed');
  }, [setDismissed]);

  useEffect(() => {
    if (dismissed !== 'noYet' || userHasParking) {
      return;
    }

    dismiss();
    router.push({
      pathname: '/join-parking',
    });
  }, [dismissed, userHasParking, dismiss]);

  return (
    <UserSpotCheckContext.Provider value={{ hasDismissed: dismissed === 'dismissed', dismiss }}>
      {children}
    </UserSpotCheckContext.Provider>
  );
}
