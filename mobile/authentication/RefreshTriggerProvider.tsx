import { createContext, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useListenOnAppStateChange } from '~/lib/useListenOnAppStateChange';
import { AppState } from 'react-native';

export const RefreshTriggerContext = createContext<{
  readonly refreshTrigger: unknown;
  readonly triggerRefresh: () => void;
}>(null!);

export function RefreshTriggerProvider(props: PropsWithChildren<{ refreshIntervalMs: number }>) {
  const [trigger, setTrigger] = useState(new Date());
  const stateTrigger = useListenOnAppStateChange('active');

  const triggerRefresh = useCallback(() => setTrigger(new Date()), [setTrigger]);

  useEffect(() => {
    if (AppState.currentState !== 'active') {
      return;
    }

    const handler = setInterval(triggerRefresh, props.refreshIntervalMs);
    return () => clearTimeout(handler);
  }, [props.refreshIntervalMs, triggerRefresh, AppState.currentState]);

  useEffect(() => {
    triggerRefresh();
  }, [stateTrigger, triggerRefresh]);

  useEffect(() => {
    console.debug('App refresh', { trigger });
  }, [trigger]);

  return (
    <RefreshTriggerContext.Provider value={{ refreshTrigger: trigger, triggerRefresh }}>
      {props.children}
    </RefreshTriggerContext.Provider>
  );
}
