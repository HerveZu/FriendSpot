import {Dispatch, SetStateAction, useCallback, useEffect, useState} from 'react';
import {Falsy} from 'react-native';

import {useCurrentUser} from '~/authentication/UserProvider';

export function useFetch<TResponse>(
  fetchData: () => Promise<TResponse> | Falsy,
  deps: unknown[],
  withRefresh = true
): [TResponse | undefined, Dispatch<SetStateAction<TResponse | undefined>>, boolean] {
  const [data, setData] = useState<TResponse>();
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useCurrentUser();

  const callback = useCallback(fetchData, [...deps, withRefresh && refreshTrigger]);

  useEffect(() => {
    setLoading(true);
    const promise = callback();

    if (!promise) {
      return;
    }

    promise.then(setData).finally(() => setLoading(false));
  }, [callback, setLoading]);

  return [data, setData, loading];
}
