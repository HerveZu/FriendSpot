import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Falsy } from 'react-native';

export function useFetch<TResponse>(
  fetchData: () => Promise<TResponse> | Falsy
): [TResponse | undefined, Dispatch<SetStateAction<TResponse | undefined>>, boolean] {
  const [data, setData] = useState<TResponse>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const promise = fetchData();

    if (!promise) {
      return;
    }

    promise.then(setData).finally(() => setLoading(false));
  }, [fetchData, setLoading]);

  return [data, setData, loading];
}
