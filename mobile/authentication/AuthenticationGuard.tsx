import { SplashScreen, useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { firebaseAuth } from '~/authentication/firebase';
import { Loader } from '~/components/Loader';

export function AuthenticationGuard(props: PropsWithChildren) {
  const [firebaseUser, isLoading] = useAuthState(firebaseAuth);
  const router = useRouter();

  const isAuthenticated = !!firebaseUser && firebaseUser.emailVerified;

  useEffect(() => {
    !isLoading && !isAuthenticated && SplashScreen.hide();
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    router.navigate(isAuthenticated ? '/authenticated/(main)/my-spot' : '/welcome');
  }, [isLoading, isAuthenticated]);

  return isLoading ? <Loader /> : props.children;
}
