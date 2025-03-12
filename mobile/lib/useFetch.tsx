import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { Falsy } from 'react-native';

import { useCurrentUser } from '~/authentication/UserProvider';

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

export function useLoading<TArgs extends unknown[], TResponse>(
  apiRequest: (...args: TArgs) => Promise<TResponse>,
  skiLoadingWhen?: (...request: TArgs) => boolean
): [(...req: TArgs) => Promise<TResponse>, boolean] {
  const [loading, setLoading] = useState(false);

  const callback = useCallback(
    async (...req: TArgs) => {
      if (!skiLoadingWhen || !skiLoadingWhen(...req)) {
        setLoading(true);
      }

      try {
        return await apiRequest(...req);
      } finally {
        setLoading(false);
      }
    },
    [apiRequest, setLoading]
  );

  return [callback, loading];
}
