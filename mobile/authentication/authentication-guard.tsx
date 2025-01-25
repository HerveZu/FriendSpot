import { useRootNavigationState, useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import { useAuth0 } from 'react-native-auth0';

export default function AuthenticationGuard(props: PropsWithChildren) {
  const { user } = useAuth0();
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
