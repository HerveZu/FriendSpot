import { useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import { useAuth0 } from 'react-native-auth0';

export default function UserProvider(props: PropsWithChildren) {
  const { user } = useAuth0();
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    !isAuthenticated && router.navigate('/welcome');
  }, [isAuthenticated]);

  return props.children;
}
