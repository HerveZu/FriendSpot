import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react';
import { Falsy } from 'react-native';
import { RefreshTriggerContext } from '~/authentication/RefreshTriggerProvider';

type UseFetchResponse<TResponse> = [
  TResponse | undefined,
  Dispatch<SetStateAction<TResponse | undefined>>,
  boolean,
  { initialLoading: boolean; resetInitialLoading: () => void },
];

export function useHookFetch<TResponse>(
  dataHook: () => () => Promise<TResponse>,
  deps: unknown[],
  withRefresh = true
): UseFetchResponse<TResponse> {
  const fetchData = dataHook();

  // this closure magic makes it work with hooks somehow :)
  return useFetch(() => fetchData(), deps, withRefresh);
}

// this won't work when using hooks as fetchData, use useHookFetch instead
export function useFetch<TResponse>(
  fetchData: () => Promise<TResponse> | Falsy,
  deps: unknown[],
  withRefresh = true,
  callbacks?: { onError: () => void }
): UseFetchResponse<TResponse> {
  const [data, setData] = useState<TResponse>();
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { refreshTrigger } = useContext(RefreshTriggerContext);

  const callback = useCallback(fetchData, [...deps, withRefresh && refreshTrigger]);

  useEffect(() => {
    setLoading(true);
    const promise = callback();
    if (!promise) {
      return;
    }

    promise
      .then(setData)
      .catch(callbacks?.onError)
      .finally(() => {
        setLoading(false);
        setHasLoadedOnce(true);
      });
  }, [callback, setLoading, setData]);

  const resetInitialLoading = useCallback(() => setHasLoadedOnce(false), [setHasLoadedOnce]);

  return [data, setData, loading, { initialLoading: !hasLoadedOnce, resetInitialLoading }];
}

export function useLoading<TArgs extends unknown[], TResponse>(
  apiRequest: (...args: TArgs) => Promise<TResponse>,
  options?: {
    beforeMarkingComplete?: () => void;
    skiLoadingWhen?: (...request: TArgs) => boolean;
  }
): [(...req: TArgs) => Promise<TResponse>, boolean] {
  const [loading, setLoading] = useState(false);

  const callback = useCallback(
    async (...req: TArgs) => {
      const withLoading = !options?.skiLoadingWhen || !options.skiLoadingWhen(...req);
      if (withLoading) {
        setLoading(true);
      }

      try {
        const result = await apiRequest(...req);
        withLoading && options?.beforeMarkingComplete?.();
        return result;
      } finally {
        setLoading(false);
      }
    },
    [apiRequest, setLoading]
  );

  return [callback, loading];
}

export function useRefreshOnSuccess<TArgs extends unknown[], TResponse>(
  apiRequest: (...args: TArgs) => Promise<TResponse>
): (...args: TArgs) => Promise<TResponse> {
  const { triggerRefresh } = useContext(RefreshTriggerContext);

  return useCallback(
    async (...args: TArgs) => {
      const result = await apiRequest(...args);
      triggerRefresh();
      return result;
    },
    [apiRequest]
  );
}
