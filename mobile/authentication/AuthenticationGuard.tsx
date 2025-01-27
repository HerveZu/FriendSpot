import { useRootNavigationState, useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { firebaseAuth } from '~/authentication/firebase';

export default function AuthenticationGuard(props: PropsWithChildren) {
  const [user] = useAuthState(firebaseAuth);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!rootNavigationState?.key) {
      return;
    }

    router.navigate(isAuthenticated ? '/home' : '/welcome');
  }, [isAuthenticated, rootNavigationState?.key]);

  return props.children;
}
