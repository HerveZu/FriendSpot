import { SplashScreen, useRouter } from 'expo-router';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import * as Linking from 'expo-linking';

import { firebaseAuth } from '~/authentication/firebase';
import { Loader } from '~/components/Loader';

export function AuthenticationGuard(props: PropsWithChildren) {
  const [firebaseUser, isLoading] = useAuthState(firebaseAuth);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!firebaseUser && firebaseUser.emailVerified;

  useEffect(() => {
    !isLoading && !isAuthenticated && SplashScreen.hide();
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    router.navigate('/welcome');
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || hasRedirected) {
      return;
    }

    const initialLinkingUrl = Linking.getInitialURL();
    console.log('Redirecting to app initial URL after authentication ', { initialLinkingUrl });
    router.navigate(initialLinkingUrl as any);
    setHasRedirected(true);
  }, [isAuthenticated]);

  return isLoading ? <Loader /> : props.children;
}
