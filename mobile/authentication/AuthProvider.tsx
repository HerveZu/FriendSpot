import { User } from 'firebase/auth';
import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { firebaseAuth } from '~/authentication/firebase';
import { Loader } from '~/components/Loader';
import { SplashScreen, useRouter } from 'expo-router';
import { useListenOnAppStateChange } from '~/lib/useListenOnAppStateChange';

const AuthContext = createContext<{
  firebaseUser: User;
  isAuthenticated: boolean;
}>(null!);

export function AuthProvider(props: PropsWithChildren) {
  const [firebaseUser, isLoading, error] = useAuthState(firebaseAuth);
  const router = useRouter();
  const appActiveTrigger = useListenOnAppStateChange('active');

  const isAuthenticated = !!firebaseUser && firebaseUser.emailVerified && !error;

  useEffect(() => {
    !isLoading && !isAuthenticated && SplashScreen.hide();
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    console.debug('Not authenticated, redirecting to welcome screen');
    router.navigate('/welcome');
  }, [isLoading, isAuthenticated, appActiveTrigger]);

  return isAuthenticated && firebaseUser ? (
    <AuthContext.Provider value={{ isAuthenticated, firebaseUser }}>
      {props.children}
    </AuthContext.Provider>
  ) : (
    <Loader />
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
