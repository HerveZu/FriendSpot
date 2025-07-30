import { User } from 'firebase/auth';
import { createContext, PropsWithChildren, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

import { firebaseAuth } from '~/authentication/firebase';
import { Loader } from '~/components/Loader';

type _AuthContext = {
  firebaseUser: User;
};

const AuthContext = createContext<_AuthContext>(null!);

export function AuthProvider(props: PropsWithChildren) {
  const [firebaseUser] = useAuthState(firebaseAuth);

  return firebaseUser ? (
    <AuthContext.Provider value={{ firebaseUser }}>{props.children}</AuthContext.Provider>
  ) : (
    <Loader />
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
