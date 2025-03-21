import { SplashScreen, useRootNavigationState, useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { firebaseAuth } from '~/authentication/firebase';
import { Loader } from '~/components/Loader';

export function AuthenticationGuard(props: PropsWithChildren) {
  const [user, isLoading] = useAuthState(firebaseAuth);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const isAuthenticated = !!user;

  useEffect(() => {
    !isLoading && !isAuthenticated && SplashScreen.hide();
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!rootNavigationState?.key) {
      return;
    }

    router.navigate(isAuthenticated ? '/my-spot' : '/welcome');
  }, [isAuthenticated, rootNavigationState?.key]);

  return isLoading ? <Loader /> : props.children;
}
